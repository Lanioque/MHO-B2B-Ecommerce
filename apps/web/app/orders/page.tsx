/**
 * Orders List Page
 * Display all orders for the organization
 */

'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { ArrowRight, Package, Search, Filter, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/use-auth';
import { BranchSelector } from '@/components/branch-selector';

interface Order {
  id: string;
  number: string;
  totalCents: number;
  currency: string;
  status: string;
  createdAt: string;
  branchId: string | null;
  branch?: {
    id: string;
    name: string;
  };
  invoices?: Array<{
    id: string;
    number: string;
    status: string;
  }>;
}

interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function OrdersListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  // Ref to prevent duplicate fetches in React StrictMode
  const isFetchingRef = useRef(false);

  // Get organization ID from user's first membership (memoized)
  const orgId = useMemo(() => user?.memberships?.[0]?.orgId, [user?.memberships]);

  // Fetch orders function (memoized)
  const fetchOrders = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    // Prevent duplicate fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

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

      const response = await fetch(`/api/orders?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data: OrdersResponse = await response.json();
      setOrders(data.data);
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
      isFetchingRef.current = false;
    }
  }, [orgId, selectedBranchId, statusFilter, pagination.page, pagination.pageSize]);

  // Fetch orders on mount and when dependencies change
  useEffect(() => {
    // Prevent duplicate fetches in React StrictMode
    if (isFetchingRef.current) return;
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchOrders]);

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
      PENDING: 'outline',
      CONFIRMED: 'default',
      PROCESSING: 'default',
      SHIPPED: 'default',
      DELIVERED: 'default',
      CANCELLED: 'destructive',
      REFUNDED: 'secondary',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
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

  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter((o) =>
      o.number.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  if (loading && orders.length === 0) {
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
        <h1 className="text-3xl font-bold mb-2">Orders</h1>
        <p className="text-gray-600">View and manage all orders for your organization</p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by order number..."
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
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600">
          Showing {filteredOrders.length} of {pagination.total} orders
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
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No organization found</p>
            <p className="text-sm text-gray-500 mt-2">
              Please contact support to be added to an organization.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      {filteredOrders.length === 0 && !loading && orgId ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No orders found</p>
            {searchQuery || statusFilter !== 'all' || selectedBranchId ? (
              <p className="text-sm text-gray-500 mt-2">
                Try adjusting your filters
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <Link href={`/orders/${order.id}`}>
                        <h3 className="text-lg font-semibold hover:text-blue-600 transition-colors">
                          {order.number}
                        </h3>
                      </Link>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span>{formatDate(order.createdAt)}</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(order.totalCents, order.currency)}
                      </span>
                      {order.branch && (
                        <span>Branch: {order.branch.name}</span>
                      )}
                      {order.invoices && order.invoices.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Invoice: {order.invoices[0].number}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Link href={`/orders/${order.id}`}>
                    <Button variant="outline">
                      View Details
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
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
