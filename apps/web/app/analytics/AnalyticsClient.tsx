'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
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
  TrendingUp, 
  UserCheck,
  BarChart3,
  Download,
  MapPin,
  Users,
  Building2,
} from 'lucide-react';
import { subDays } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsClientProps {
  orgId: string;
  userRole: string;
  userName: string;
}

interface AnalyticsData {
  totalSpending: number;
  totalOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  averageCostPerEmployee: number;
  spendingByPeriod: Array<{ date: string; spending: number; orders: number }>;
  ordersByStatus: Array<{ status: string; count: number; spending: number }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    sku: string;
    spending: number;
    orders: number;
    quantity: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    spending: number;
    orders: number;
    percentage: number;
  }>;
  recentOrders: any[];
  recentQuotations: any[];
  previousPeriodSpending?: number;
}

export default function AnalyticsClient({
  orgId,
  userRole,
  userName,
}: AnalyticsClientProps) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchAnalytics, setBranchAnalytics] = useState<Record<string, any>>({});
  const [period, setPeriod] = useState('30');
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [selectedBranch, setSelectedBranch] = useState<string | undefined>();
  const isAdmin = userRole === 'ADMIN' || userRole === 'OWNER';

  const fetchBranches = useCallback(async () => {
    try {
      const response = await fetch(`/api/branches?orgId=${orgId}`);
      if (response.ok) {
        const data = await response.json();
        setBranches(data.branches || []);
        
        // Fetch analytics for each branch when "All Branches" is selected
        if (!selectedBranch || selectedBranch === "all") {
          const branchAnalyticsData: Record<string, any> = {};
          for (const branch of data.branches || []) {
            try {
              const branchParams = new URLSearchParams({
                period,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                branchId: branch.id,
              });
              const branchResponse = await fetch(`/api/analytics?${branchParams.toString()}`);
              if (branchResponse.ok) {
                const branchData = await branchResponse.json();
                if (branchData.success && branchData.data) {
                  branchAnalyticsData[branch.id] = branchData.data;
                }
              }
            } catch (err) {
              console.error(`Failed to fetch analytics for branch ${branch.id}:`, err);
            }
          }
          setBranchAnalytics(branchAnalyticsData);
        } else {
          // Clear branch analytics when a specific branch is selected
          setBranchAnalytics({});
        }
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  }, [orgId, period, startDate, endDate, selectedBranch]);

  useEffect(() => {
    if (isAdmin) {
      fetchBranches();
    }
  }, [fetchBranches, isAdmin]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (selectedBranch && selectedBranch !== "all") {
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
        totalSpending: 0,
        totalOrders: 0,
        pendingOrders: 0,
        averageOrderValue: 0,
        averageCostPerEmployee: 0,
        spendingByPeriod: [],
        ordersByStatus: [],
        topProducts: [],
        categoryBreakdown: [],
        recentOrders: [],
        recentQuotations: [],
        previousPeriodSpending: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate, selectedBranch]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (isAdmin) {
      fetchBranches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, period, startDate, endDate, selectedBranch]);

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
    // BranchSelector passes "" for "all", convert to undefined
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
      toast.success('Quotation converted to order successfully');
    } catch (err) {
      console.error('Failed to convert quotation:', err);
      toast.error('Failed to convert quotation to order');
    }
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <main className="container mx-auto px-4 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                Analytics Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">Business insights and metrics</p>
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
                    if (selectedBranch && selectedBranch !== "all") params.append('branchId', selectedBranch);
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
                    if (selectedBranch && selectedBranch !== "all") params.append('branchId', selectedBranch);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <MetricCard
                title="Total Spent Amount"
                value={analytics.totalSpending}
                trend={{
                  value: calculatePercentageChange(
                    analytics.totalSpending,
                    analytics.previousPeriodSpending || 0
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
                title="Avg Cost Per Employee"
                value={analytics.averageCostPerEmployee}
                description="Spending per active employee"
                icon={<UserCheck className="h-5 w-5" />}
              />
            </div>

            {/* All Branches Overview - Show when "All Branches" is selected */}
            {(!selectedBranch || selectedBranch === "all") && branches.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">All Branches Overview</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {branches.map((branch) => {
                    const branchData = branchAnalytics[branch.id];
                    const formatCurrency = (amount: number) => {
                      return new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: branch.budgetCurrency || 'USD',
                      }).format(amount);
                    };

                    return (
                      <Card key={branch.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-blue-600" />
                                {branch.name}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {branch.status || 'ACTIVE'} • {branch.billing?.city || 'N/A'}
                              </CardDescription>
                            </div>
                            {branch.employeeCount && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Users className="h-4 w-4" />
                                {branch.employeeCount}
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {branchData ? (
                            <>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs text-gray-500">Spending</p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {formatCurrency(branchData.totalSpending || 0)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Orders</p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {branchData.totalOrders || 0}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Avg Order</p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {formatCurrency(branchData.averageOrderValue || 0)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Cost/Employee</p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {formatCurrency(branchData.averageCostPerEmployee || 0)}
                                  </p>
                                </div>
                              </div>
                              {branch.yearlyBudget && (
                                <div className="pt-2 border-t">
                                  <p className="text-xs text-gray-500">Yearly Budget</p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {formatCurrency((branch.yearlyBudget || 0) / 100)}
                                  </p>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-4 text-sm text-gray-500">
                              <p>No data for this period</p>
                            </div>
                          )}
                          {branch.managerName && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-gray-500">Manager</p>
                              <p className="text-sm font-medium text-gray-700">{branch.managerName}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <RevenueChart data={analytics.spendingByPeriod} />
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
  );
}

