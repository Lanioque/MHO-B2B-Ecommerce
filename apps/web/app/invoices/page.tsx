/**
 * Invoices List Page
 * Display all invoices for the organization
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Search, Filter, AlertCircle, Download, Eye } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/use-auth';
import { BranchSelector } from '@/components/branch-selector';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { startOfDay, endOfDay } from 'date-fns';

interface Invoice {
  id: string;
  number: string;
  status: string;
  pdfUrl: string | null;
  zohoInvoiceId: string | null;
  createdAt: string;
  order: {
    id: string;
    number: string;
    totalCents: number;
    currency: string;
    branch?: {
      id: string;
      name: string;
    } | null;
  };
}

interface InvoicesResponse {
  data: Invoice[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function InvoicesListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  // Get organization ID from user's first membership (memoized)
  const orgId = useMemo(() => user?.memberships?.[0]?.orgId, [user?.memberships]);

  // Fetch invoices function (memoized)
  const fetchInvoices = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('orgId', orgId);
      params.append('page', pagination.page.toString());
      params.append('pageSize', pagination.pageSize.toString());
      
      if (selectedBranchId) {
        params.append('branchId', selectedBranchId);
      }
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (startDate) {
        params.append('startDate', startOfDay(startDate).toISOString());
      }
      
      if (endDate) {
        params.append('endDate', endOfDay(endDate).toISOString());
      }

      const response = await fetch(`/api/invoices?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data: InvoicesResponse = await response.json();
      setInvoices(data.data);
      setPagination({
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [orgId, selectedBranchId, statusFilter, pagination.page, pagination.pageSize, startDate, endDate]);

  // Fetch invoices on mount and when dependencies change
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const formatCurrency = (cents: number, currency: string = 'AED') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      DRAFT: 'outline',
      ISSUED: 'default',
      SENT: 'default',
      PAID: 'secondary',
      OVERDUE: 'destructive',
    };

    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      ISSUED: 'bg-blue-100 text-blue-800',
      SENT: 'bg-indigo-100 text-indigo-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
    };

    return (
      <Badge 
        variant={variants[status] || 'outline'}
        className={colors[status] || ''}
      >
        {status}
      </Badge>
    );
  };

  const handleBranchChange = useCallback((branchId: string | null) => {
    setSelectedBranchId(branchId);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  const handleStatusFilter = useCallback((status: string) => {
    setStatusFilter(status);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  const handleDownloadInvoice = async (invoice: Invoice) => {
    if (!invoice.pdfUrl) {
      alert('PDF not available for this invoice');
      return;
    }

    try {
      // Try to open the PDF URL directly
      window.open(invoice.pdfUrl, '_blank');
    } catch (err) {
      // Fallback to API download route
      try {
        const response = await fetch(`/api/invoices/${invoice.id}/download`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          // If it redirects, follow the redirect
          if (response.redirected) {
            window.open(response.url, '_blank');
          } else {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
          }
        } else {
          const data = await response.json();
          alert(data.error || 'Failed to download invoice');
        }
      } catch (error) {
        alert('Failed to download invoice');
      }
    }
  };

  const filteredInvoices = useMemo(() => {
    if (!searchQuery) return invoices;
    const q = searchQuery.toLowerCase();
    return invoices.filter((inv) =>
      inv.number.toLowerCase().includes(q) ||
      inv.id.toLowerCase().includes(q) ||
      inv.order.number.toLowerCase().includes(q)
    );
  }, [invoices, searchQuery]);

  if (loading && invoices.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Invoices</h1>
        <p className="text-gray-600">View and manage all invoices for your organization</p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by invoice number or order number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Branch Selector */}
          <div className="w-full md:w-64">
            <BranchSelector
              currentBranchId={selectedBranchId || undefined}
              onBranchChange={handleBranchChange}
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-48">
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ISSUED">Issued</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Picker */}
          <DateRangePicker
            value={startDate && endDate ? 'custom' : '30'}
            onChange={(period, start, end) => {
              setStartDate(start);
              setEndDate(end);
              setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
            }}
          />
        </div>


        {/* Results count */}
        <div className="text-sm text-gray-600">
          Showing {filteredInvoices.length} of {pagination.total} invoices
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* No Organization State */}
      {!orgId && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No organization found</p>
            <p className="text-sm text-gray-500 mt-2">
              Please contact support to be added to an organization.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Invoices List */}
      {filteredInvoices.length === 0 && !loading && orgId ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No invoices found</p>
            {searchQuery || statusFilter !== 'all' || selectedBranchId ? (
              <p className="text-sm text-gray-500 mt-2">
                Try adjusting your filters
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <Link href={`/orders/${invoice.order.id}`}>
                        <h3 className="text-lg font-semibold hover:text-blue-600 transition-colors">
                          {invoice.number}
                        </h3>
                      </Link>
                      {getStatusBadge(invoice.status)}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span>{formatDate(invoice.createdAt)}</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(invoice.order.totalCents, invoice.order.currency)}
                      </span>
                      <Link 
                        href={`/orders/${invoice.order.id}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Order: {invoice.order.number}
                      </Link>
                      {invoice.order.branch && (
                        <span>Branch: {invoice.order.branch.name}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {invoice.pdfUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadInvoice(invoice)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    )}
                    <Link href={`/orders/${invoice.order.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Order
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
          >
            Previous
          </Button>
          <div className="flex items-center px-4">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <Button
            variant="outline"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </Button>
        </div>
      )}
    </main>
  );
}

