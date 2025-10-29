/**
 * Analytics Service
 * Business logic for analytics and reporting
 */

import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export interface AnalyticsFilters {
  orgId: string;
  startDate: Date;
  endDate: Date;
  branchId?: string;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number; // Kept as revenue for internal consistency, but displayed as "Spent Amount"
  orders: number;
}

export interface CategoryBreakdown {
  category: string;
  revenue: number;
  orders: number;
  percentage: number;
}

export interface ProductBreakdown {
  productId: string;
  productName: string;
  sku: string;
  revenue: number;
  orders: number;
  quantity: number;
}

export interface OrdersByStatus {
  status: string;
  count: number;
  revenue: number;
}

export interface OrganizationAnalytics {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  averageCostPerEmployee: number;
  revenueByPeriod: RevenueDataPoint[];
  ordersByStatus: OrdersByStatus[];
  topProducts: ProductBreakdown[];
  categoryBreakdown: CategoryBreakdown[];
  recentOrders: any[];
  recentQuotations: any[];
  previousPeriodRevenue?: number;
}

export class AnalyticsService {
  /**
   * Get comprehensive organization analytics
   */
  async getOrganizationAnalytics(
    filters: AnalyticsFilters
  ): Promise<OrganizationAnalytics> {
    const { orgId, startDate, endDate, branchId } = filters;

    const whereClause = {
      orgId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(branchId && { branchId }),
    };

    // Fetch all analytics data in parallel
    const [
      revenueData,
      ordersCount,
      pendingOrdersCount,
      customersCount,
      employeeCount,
      ordersByStatusData,
      topProductsData,
      categoryData,
      recentOrders,
      recentQuotations,
      previousPeriodRevenue,
    ] = await Promise.all([
      this.getTotalRevenue(whereClause),
      this.getOrdersCount(whereClause),
      this.getPendingOrdersCount(whereClause),
      this.getCustomersCount({ orgId, ...(branchId && { branchId }) }),
      this.getEmployeeCount(orgId),
      this.getOrdersByStatus(whereClause),
      this.getTopProducts(whereClause, 10),
      this.getCategoryBreakdown(whereClause),
      this.getRecentOrders(whereClause, 10),
      this.getRecentQuotations(
        { orgId, startDate, endDate, ...(branchId && { branchId }) },
        10
      ),
      this.getPreviousPeriodRevenue(orgId, startDate, endDate, branchId),
    ]);

    // Convert revenue from cents to dollars
    const totalRevenueCents = revenueData._sum?.totalCents || 0;
    const totalRevenue = totalRevenueCents / 100;
    const totalOrders = ordersCount || 0;
    const pendingOrders = pendingOrdersCount || 0;
    const totalCustomers = customersCount || 0;
    const averageOrderValue =
      totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const averageCostPerEmployee =
      employeeCount > 0 ? totalRevenue / employeeCount : 0;

    return {
      totalRevenue,
      totalOrders,
      pendingOrders,
      totalCustomers,
      averageOrderValue,
      averageCostPerEmployee,
      revenueByPeriod: await this.getRevenueByPeriod(
        whereClause,
        startDate,
        endDate
      ),
      ordersByStatus: ordersByStatusData,
      topProducts: topProductsData,
      categoryBreakdown: categoryData,
      recentOrders,
      recentQuotations,
      previousPeriodRevenue: previousPeriodRevenue?._sum?.totalCents ? previousPeriodRevenue._sum.totalCents / 100 : 0,
    };
  }

  /**
   * Get total revenue from paid and pending orders
   */
  private async getTotalRevenue(whereClause: any) {
    return prisma.order.aggregate({
      where: {
        ...whereClause,
        status: {
          in: ['PAID', 'PENDING', 'AWAITING_PAYMENT'],
        },
      },
      _sum: {
        totalCents: true,
      },
    });
  }

  /**
   * Get total orders count
   */
  private async getOrdersCount(whereClause: any) {
    return prisma.order.count({
      where: whereClause,
    });
  }

  /**
   * Get pending orders count
   */
  private async getPendingOrdersCount(whereClause: any) {
    return prisma.order.count({
      where: {
        ...whereClause,
        status: 'PENDING',
      },
    });
  }

  /**
   * Get total customers count
   */
  private async getCustomersCount(whereClause: any) {
    return prisma.customer.count({
      where: whereClause,
    });
  }

  /**
   * Get employee count for organization
   */
  private async getEmployeeCount(orgId: string): Promise<number> {
    const result = await prisma.employee.count({
      where: {
        orgId,
        status: 'ACTIVE',
      },
    });
    return result || 1; // Default to 1 to avoid division by zero
  }

  /**
   * Get revenue by period (daily breakdown)
   */
  private async getRevenueByPeriod(
    whereClause: any,
    startDate: Date,
    endDate: Date
  ): Promise<RevenueDataPoint[]> {
    const orders = await prisma.order.findMany({
      where: {
        ...whereClause,
        status: {
          in: ['PAID', 'PENDING', 'AWAITING_PAYMENT'],
        },
      },
      select: {
        createdAt: true,
        totalCents: true,
        id: true,
        status: true,
      },
    });

    // Group by date
    const dateMap = new Map<string, { revenue: number; orders: Set<string> }>();

    orders.forEach((order) => {
      const dateKey = format(order.createdAt, 'yyyy-MM-dd');
      const existing = dateMap.get(dateKey) || {
        revenue: 0,
        orders: new Set<string>(),
      };
      existing.revenue += order.totalCents;
      existing.orders.add(order.id);
      dateMap.set(dateKey, existing);
    });

    // Convert to array and sort by date
    const result: RevenueDataPoint[] = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue / 100, // Convert cents to dollars
        orders: data.orders.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }

  /**
   * Get orders breakdown by status
   */
  private async getOrdersByStatus(
    whereClause: any
  ): Promise<OrdersByStatus[]> {
    const orders = await prisma.order.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        id: true,
      },
      _sum: {
        totalCents: true,
      },
    });

    return orders.map((item) => ({
      status: item.status,
      count: item._count.id,
      revenue: (item._sum.totalCents || 0) / 100,
    }));
  }

  /**
   * Get top products by revenue
   */
  private async getTopProducts(
    whereClause: any,
    limit: number
  ): Promise<ProductBreakdown[]> {
    const orders = await prisma.order.findMany({
      where: {
        ...whereClause,
        status: {
          in: ['PAID', 'PENDING', 'AWAITING_PAYMENT'],
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    const productMap = new Map<
      string,
      {
        productName: string;
        sku: string;
        revenue: number;
        quantity: number;
        orders: Set<string>;
      }
    >();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = productMap.get(item.productId) || {
          productName: item.product.name,
          sku: item.product.sku,
          revenue: 0,
          quantity: 0,
          orders: new Set<string>(),
        };
        existing.revenue += item.subtotalCents;
        existing.quantity += item.quantity;
        existing.orders.add(order.id);
        productMap.set(item.productId, existing);
      });
    });

    return Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.productName,
        sku: data.sku,
        revenue: data.revenue / 100,
        orders: data.orders.size,
        quantity: data.quantity,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  /**
   * Get purchase breakdown by category
   */
  private async getCategoryBreakdown(
    whereClause: any
  ): Promise<CategoryBreakdown[]> {
    const orders = await prisma.order.findMany({
      where: {
        ...whereClause,
        status: {
          in: ['PAID', 'PENDING', 'AWAITING_PAYMENT'],
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                categoryName: true,
                priceCents: true,
              },
            },
          },
        },
      },
    });

    const categoryMap = new Map<
      string,
      { revenue: number; orders: Set<string> }
    >();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const category = item.product.categoryName || 'Uncategorized';
        const existing = categoryMap.get(category) || {
          revenue: 0,
          orders: new Set<string>(),
        };
        existing.revenue += item.subtotalCents;
        existing.orders.add(order.id);
        categoryMap.set(category, existing);
      });
    });

    const totalRevenue = Array.from(categoryMap.values()).reduce(
      (sum, cat) => sum + cat.revenue,
      0
    );

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        revenue: data.revenue / 100,
        orders: data.orders.size,
        percentage:
          totalRevenue > 0
            ? (data.revenue / totalRevenue) * 100
            : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Get recent orders
   */
  private async getRecentOrders(whereClause: any, limit: number) {
    return prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get recent quotations
   */
  private async getRecentQuotations(
    whereClause: any,
    limit: number
  ) {
    const { startDate, endDate, orgId, branchId, ...rest } = whereClause;
    
    // Check if quotation model exists in Prisma client (in case migration hasn't run yet)
    if (!('quotation' in prisma)) {
      console.warn('[AnalyticsService] Quotation model not available - Prisma client may need regeneration');
      return [];
    }
    
    return (prisma as any).quotation.findMany({
      where: {
        orgId,
        ...(branchId && { branchId }),
        createdAt: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get previous period revenue for comparison
   */
  private async getPreviousPeriodRevenue(
    orgId: string,
    startDate: Date,
    endDate: Date,
    branchId?: string
  ) {
    const periodDays =
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const previousEndDate = new Date(startDate);
    previousEndDate.setMilliseconds(previousEndDate.getMilliseconds() - 1);
    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setDate(
      previousStartDate.getDate() - periodDays
    );

    return prisma.order.aggregate({
      where: {
        orgId,
        createdAt: {
          gte: previousStartDate,
          lte: previousEndDate,
        },
        status: {
          in: ['PAID', 'PENDING', 'AWAITING_PAYMENT'],
        },
        ...(branchId && { branchId }),
      },
      _sum: {
        totalCents: true,
      },
    });
  }
}

// Factory function
export function getAnalyticsService(): AnalyticsService {
  return new AnalyticsService();
}

