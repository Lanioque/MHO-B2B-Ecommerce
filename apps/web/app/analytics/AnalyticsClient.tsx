'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricCard } from '@/components/analytics/MetricCard';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { RevenueChart } from '@/components/analytics/RevenueChart';
import { StatusPieChart } from '@/components/analytics/StatusPieChart';
import { CategoryBarChart } from '@/components/analytics/CategoryBarChart';
import { ProductBarChart } from '@/components/analytics/ProductBarChart';
import { LatestOrdersTable } from '@/components/analytics/LatestOrdersTable';
import { LatestQuotationsTable } from '@/components/analytics/LatestQuotationsTable';
import { BranchSelector } from '@/components/branch-selector';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  UserCheck,
  BarChart3,
  Download,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { subDays } from 'date-fns';

interface AnalyticsClientProps {
  orgId: string;
  userRole: string;
  userName: string;
}

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  averageCostPerEmployee: number;
  revenueByPeriod: Array<{ date: string; revenue: number; orders: number }>;
  ordersByStatus: Array<{ status: string; count: number; revenue: number }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    sku: string;
    revenue: number;
    orders: number;
    quantity: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    revenue: number;
    orders: number;
    percentage: number;
  }>;
  recentOrders: any[];
  recentQuotations: any[];
  previousPeriodRevenue?: number;
}

export default function AnalyticsClient({
  orgId,
  userRole,
  userName,
}: AnalyticsClientProps) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30');
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [selectedBranch, setSelectedBranch] = useState<string | undefined>();
  const isAdmin = userRole === 'ADMIN' || userRole === 'OWNER';

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (selectedBranch) {
        params.append('branchId', selectedBranch);
      }

      const response = await fetch(`/api/analytics?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analytics');
      }

      if (data.success && data.data) {
        setAnalytics(data.data);
      } else {
        throw new Error('Invalid response format from analytics API');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
      console.error('Analytics fetch error:', err);
      // Set empty analytics data to prevent crashes
      setAnalytics({
        totalRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalCustomers: 0,
        averageOrderValue: 0,
        averageCostPerEmployee: 0,
        revenueByPeriod: [],
        ordersByStatus: [],
        topProducts: [],
        categoryBreakdown: [],
        recentOrders: [],
        recentQuotations: [],
        previousPeriodRevenue: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate, selectedBranch]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handlePeriodChange = (
    newPeriod: string,
    newStartDate: Date,
    newEndDate: Date
  ) => {
    setPeriod(newPeriod);
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId || undefined);
  };

  const handleConvertQuotation = async (quotationId: string) => {
    try {
      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ convertToOrder: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to convert quotation');
      }

      // Refresh analytics
      fetchAnalytics();
    } catch (err) {
      console.error('Failed to convert quotation:', err);
      alert('Failed to convert quotation to order');
    }
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
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
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                  Analytics Dashboard
                </h1>
                <p className="text-sm text-gray-500">Business insights and metrics</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <DateRangePicker value={period} onChange={handlePeriodChange} />
              {isAdmin && (
                <BranchSelector
                  currentBranchId={selectedBranch}
                  onBranchChange={handleBranchChange}
                />
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const params = new URLSearchParams({
                      format: 'csv',
                      period,
                      startDate: startDate.toISOString(),
                      endDate: endDate.toISOString(),
                    });
                    if (selectedBranch) params.append('branchId', selectedBranch);
                    window.open(`/api/analytics/export?${params.toString()}`);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const params = new URLSearchParams({
                      format: 'pdf',
                      period,
                      startDate: startDate.toISOString(),
                      endDate: endDate.toISOString(),
                    });
                    if (selectedBranch) params.append('branchId', selectedBranch);
                    window.open(`/api/analytics/export?${params.toString()}`);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        ) : analytics ? (
          <>
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
              <MetricCard
                title="Total Spent Amount"
                value={analytics.totalRevenue}
                trend={{
                  value: calculatePercentageChange(
                    analytics.totalRevenue,
                    analytics.previousPeriodRevenue || 0
                  ),
                  isPositive: false, // Spending more is not positive
                }}
                description="Total amount spent on orders"
                icon={<DollarSign className="h-5 w-5" />}
              />
              <MetricCard
                title="Total Orders"
                value={analytics.totalOrders}
                icon={<ShoppingCart className="h-5 w-5" />}
              />
              <MetricCard
                title="Pending Orders"
                value={analytics.pendingOrders}
                description="Orders awaiting processing"
                icon={<ShoppingCart className="h-5 w-5" />}
              />
              <MetricCard
                title="Avg Order Value"
                value={analytics.averageOrderValue}
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <MetricCard
                title="Total Customers"
                value={analytics.totalCustomers}
                icon={<Users className="h-5 w-5" />}
              />
              <MetricCard
                title="Avg Cost Per Employee"
                value={analytics.averageCostPerEmployee}
                description="Spending per active employee"
                icon={<UserCheck className="h-5 w-5" />}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <RevenueChart data={analytics.revenueByPeriod} />
              <StatusPieChart data={analytics.ordersByStatus} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <CategoryBarChart data={analytics.categoryBreakdown} />
              <ProductBarChart data={analytics.topProducts} />
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 gap-6 mb-8">
              <LatestOrdersTable orders={analytics.recentOrders} />
              <LatestQuotationsTable
                quotations={analytics.recentQuotations}
                onConvertToOrder={handleConvertQuotation}
              />
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No analytics data available</p>
          </div>
        )}
      </main>
    </div>
  );
}

