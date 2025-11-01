'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BranchSelector } from '@/components/branch-selector';
import { FileText, Plus, CheckCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { QuotationChat } from './QuotationChat';
import Link from 'next/link';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

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
  const [selectedBranch, setSelectedBranch] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('currentBranchId') || undefined;
    }
    return undefined;
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  // Manual convert disabled; conversions happen based on Zoho response
  const [updating, setUpdating] = useState<string | null>(null);
  const [chatForQuotation, setChatForQuotation] = useState<string | null>(null);
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

  // No manual convert

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
    }).format(cents / 100);
  };

  const updateStatus = async (quotationId: string, status: 'APPROVED' | 'REJECTED', message?: string) => {
    if (updating) return;
    setUpdating(quotationId);
    try {
      const response = await fetch(`/api/quotations/${quotationId}` , {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update quotation');
      toast.success(`Quotation ${status.toLowerCase()}`);
      fetchQuotations();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update quotation');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <main className="container mx-auto px-4 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                Quotations
              </h1>
              <p className="text-sm text-gray-500 mt-1">Manage your quotations</p>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row items-start gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              {isAdmin && (
                <BranchSelector
                  currentBranchId={selectedBranch}
                  onBranchChange={setSelectedBranch}
                />
              )}
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="CONVERTED">Converted</SelectItem>
                </SelectContent>
              </Select>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Quotation
              </Button>
            </div>
          </div>
        </div>
      </div>
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
                          <Link href={`/quotations/${quotation.id}`} className="text-blue-600 hover:underline">
                            {quotation.number}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {quotation.customer
                            ? `${quotation.customer.firstName || ''} ${
                                quotation.customer.lastName || ''
                              }`.trim() || quotation.customer.email
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-medium">
                          {quotation.status === 'APPROVED' || quotation.status === 'CONVERTED' 
                            ? formatCurrency(quotation.totalCents)
                            : <span className="text-gray-500 italic">Pending</span>}
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
                              onClick={() => updateStatus(quotation.id, 'APPROVED')}
                              disabled={updating === quotation.id || quotation.status !== 'SENT'}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setChatForQuotation(quotation.id)}
                              disabled={updating === quotation.id}
                            >
                              Chat / Decline
                            </Button>
                            {/* Manual convert removed - status changes are driven by Zoho */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/quotations/${quotation.id}/pdf`);
                                  const json = await res.json();
                                  if (!res.ok || !json.pdfUrl) throw new Error(json.error || 'No PDF available');
                                  window.open(json.pdfUrl, '_blank');
                                } catch (e) {
                                  toast.error('Unable to open quotation PDF');
                                }
                              }}
                            >
                              View PDF
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
      {chatForQuotation && (
        <QuotationChat
          quotationId={chatForQuotation}
          open={!!chatForQuotation}
          onOpenChange={(v) => setChatForQuotation(v ? chatForQuotation : null)}
        />
      )}
    </main>
  );
}

