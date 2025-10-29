'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BranchSelector } from '@/components/branch-selector';
import { FileText, Plus, ArrowLeft, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Quotation {
  id: string;
  number: string;
  totalCents: number;
  status: string;
  validUntil?: Date | null;
  createdAt: Date;
  customer?: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null;
}

interface QuotationsClientProps {
  orgId: string;
  userRole: string;
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-orange-100 text-orange-800',
  CONVERTED: 'bg-purple-100 text-purple-800',
};

const formatStatus = (status: string) => {
  return status
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

export default function QuotationsClient({ orgId, userRole }: QuotationsClientProps) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [converting, setConverting] = useState<string | null>(null);
  const isAdmin = userRole === 'ADMIN' || userRole === 'OWNER';

  const fetchQuotations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ orgId });
      if (selectedBranch) params.append('branchId', selectedBranch);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/quotations?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch quotations');
      }

      setQuotations(data.quotations || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load quotations');
      console.error('Quotations fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [orgId, selectedBranch, statusFilter]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const handleConvertQuotation = async (quotationId: string) => {
    if (converting) return;

    setConverting(quotationId);
    try {
      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ convertToOrder: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to convert quotation');
      }

      const data = await response.json();
      if (data.order) {
        alert(`Quotation converted to order ${data.order.number}`);
        fetchQuotations();
      }
    } catch (err) {
      console.error('Failed to convert quotation:', err);
      alert('Failed to convert quotation to order');
    } finally {
      setConverting(null);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Quotations
                </h1>
                <p className="text-sm text-gray-500">Manage your quotations</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isAdmin && (
                <BranchSelector
                  currentBranchId={selectedBranch}
                  onBranchChange={setSelectedBranch}
                />
              )}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
                <option value="CONVERTED">Converted</option>
              </select>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Quotation
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : quotations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No quotations yet
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first quotation
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Quotation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Quotations</CardTitle>
              <CardDescription>
                {quotations.length} quotation{quotations.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Quotation ID
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Customer
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">
                        Amount
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">
                        Valid Until
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">
                        Status
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotations.map((quotation) => (
                      <tr
                        key={quotation.id}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm">
                          {format(new Date(quotation.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-3 px-4 text-sm font-mono">
                          {quotation.number}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {quotation.customer
                            ? `${quotation.customer.firstName || ''} ${
                                quotation.customer.lastName || ''
                              }`.trim() || quotation.customer.email
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-medium">
                          {formatCurrency(quotation.totalCents)}
                        </td>
                        <td className="py-3 px-4 text-sm text-center">
                          {quotation.validUntil
                            ? format(new Date(quotation.validUntil), 'MMM dd, yyyy')
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            className={
                              statusColors[quotation.status] ||
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {formatStatus(quotation.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConvertQuotation(quotation.id)}
                              disabled={
                                converting === quotation.id ||
                                quotation.status === 'CONVERTED' ||
                                quotation.status === 'REJECTED' ||
                                quotation.status === 'EXPIRED' ||
                                quotation.status !== 'APPROVED' && quotation.status !== 'SENT'
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {converting === quotation.id
                                ? 'Converting...'
                                : 'Convert'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

