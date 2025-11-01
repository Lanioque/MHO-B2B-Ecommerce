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

export interface SpendingDataPoint {
  date: string;
  spending: number;
  orders: number;
}

export interface CategoryBreakdown {
  category: string;
  spending: number;
  orders: number;
  percentage: number;
}

export interface ProductBreakdown {
  productId: string;
  productName: string;
  sku: string;
  spending: number;
  orders: number;
  quantity: number;
}

export interface OrdersByStatus {
  status: string;
  count: number;
  spending: number;
}

export interface RecentOrder {
  id: string;
  number: string;
  totalCents: number;
  status: string;
  createdAt: Date;
  customer?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

export interface RecentQuotation {
  id: string;
  number: string;
  totalCents: number;
  status: string;
  validUntil?: Date | null;
  createdAt: Date;
  customer?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

export interface OrganizationAnalytics {
  totalSpending: number;
  totalOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  averageCostPerEmployee: number;
  spendingByPeriod: SpendingDataPoint[];
  ordersByStatus: OrdersByStatus[];
  topProducts: ProductBreakdown[];
  categoryBreakdown: CategoryBreakdown[];
  recentOrders: RecentOrder[];
  recentQuotations: RecentQuotation[];
  previousPeriodSpending?: number;
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
      spendingData,
      ordersCount,
      pendingOrdersCount,
      employeeCount,
      ordersByStatusData,
      topProductsData,
      categoryData,
      recentOrders,
      recentQuotations,
      previousPeriodSpending,
    ] = await Promise.all([
      this.getTotalSpending(whereClause),
      this.getOrdersCount(whereClause),
      this.getPendingOrdersCount(whereClause),
      this.getEmployeeCount(orgId, branchId),
      this.getOrdersByStatus(whereClause),
      this.getTopProducts(whereClause, 10),
      this.getCategoryBreakdown(whereClause),
      this.getRecentOrders(whereClause, 10),
      this.getRecentQuotations(
        { orgId, startDate, endDate, ...(branchId && { branchId }) },
        10
      ),
      this.getPreviousPeriodSpending(orgId, startDate, endDate, branchId),
    ]);

    // Convert spending from cents to dollars
    const totalSpendingCents = spendingData._sum?.totalCents || 0;
    const totalSpending = totalSpendingCents / 100;
    const totalOrders = ordersCount || 0;
    const pendingOrders = pendingOrdersCount || 0;
    const averageOrderValue =
      totalOrders > 0 ? totalSpending / totalOrders : 0;
    // Calculate average cost per employee: total spent in period / employee count
    const averageCostPerEmployee =
      employeeCount > 0 ? totalSpending / employeeCount : 0;

    return {
      totalSpending,
      totalOrders,
      pendingOrders,
      averageOrderValue,
      averageCostPerEmployee,
      spendingByPeriod: await this.getSpendingByPeriod(
        whereClause,
        startDate,
        endDate
      ),
      ordersByStatus: ordersByStatusData,
      topProducts: topProductsData,
      categoryBreakdown: categoryData,
      recentOrders,
      recentQuotations,
      previousPeriodSpending: previousPeriodSpending?._sum?.totalCents ? previousPeriodSpending._sum.totalCents / 100 : 0,
    };
  }

  /**
   * Get total spending from paid and pending orders
   */
  private async getTotalSpending(whereClause: any) {
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
   * If branchId is provided, counts customers who have orders/quotations for that branch
   */
  private async getCustomersCount(whereClause: any) {
    const { branchId, ...rest } = whereClause;
    
    // If branchId is provided, filter customers through their orders/quotations
    if (branchId) {
      // Count distinct customers who have orders or quotations for this branch
      const customersWithOrders = await prisma.customer.findMany({
        where: {
          ...rest,
          OR: [
            {
              orders: {
                some: {
                  branchId,
                },
              },
            },
            {
              quotations: {
                some: {
                  branchId,
                },
              },
            },
          ],
        },
        select: {
          id: true,
        },
      });
      
      return customersWithOrders.length;
    }
    
    // Otherwise, count all customers for the org
    return prisma.customer.count({
      where: rest,
    });
  }

  /**
   * Get employee count for organization
   * Uses branch's employeeCount field if set, otherwise counts from Employee table
   * Respects branch filtering if branchId is provided
   */
  private async getEmployeeCount(orgId: string, branchId?: string): Promise<number> {
    // If a specific branch is selected, use its employeeCount field
    if (branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        select: { employeeCount: true },
      });
      
      // If branch has employeeCount set, use it
      if (branch?.employeeCount !== null && branch?.employeeCount !== undefined) {
        return branch.employeeCount || 1; // Default to 1 to avoid division by zero
      }
      
      // Otherwise, count employees for this branch
      const result = await prisma.employee.count({
        where: {
          orgId,
          branchId,
          status: 'ACTIVE',
        },
      });
      return result || 1;
    }
    
    // For organization-wide, sum employeeCount from all active branches
    const branches = await prisma.branch.findMany({
      where: {
        orgId,
        status: 'ACTIVE',
      },
      select: {
        employeeCount: true,
      },
    });
    
    // Sum up employeeCount from branches (if set)
    const totalFromBranches = branches.reduce((sum: number, branch: typeof branches[number]) => {
      return sum + (branch.employeeCount || 0);
    }, 0);
    
    // If we have employeeCount from branches, use it
    if (totalFromBranches > 0) {
      return totalFromBranches;
    }
    
    // Fallback: count from Employee table
    const result = await prisma.employee.count({
      where: {
        orgId,
        status: 'ACTIVE',
      },
    });
    return result || 1; // Default to 1 to avoid division by zero
  }

  /**
   * Get spending by period (daily breakdown)
   */
  private async getSpendingByPeriod(
    whereClause: any,
    startDate: Date,
    endDate: Date
  ): Promise<SpendingDataPoint[]> {
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
    const dateMap = new Map<string, { spending: number; orders: Set<string> }>();

    orders.forEach((order) => {
      const dateKey = format(order.createdAt, 'yyyy-MM-dd');
      const existing = dateMap.get(dateKey) || {
        spending: 0,
        orders: new Set<string>(),
      };
      existing.spending += order.totalCents;
      existing.orders.add(order.id);
      dateMap.set(dateKey, existing);
    });

    // Convert to array and sort by date
    const result: SpendingDataPoint[] = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        spending: data.spending / 100, // Convert cents to dollars
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

    return orders.map((item: typeof orders[number]) => ({
      status: item.status,
      count: item._count.id,
      spending: (item._sum.totalCents || 0) / 100,
    }));
  }

  /**
   * Get top products by spending
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
        spending: number;
        quantity: number;
        orders: Set<string>;
      }
    >();

    orders.forEach((order: typeof orders[number]) => {
      order.items.forEach((item: typeof order.items[number]) => {
        const existing = productMap.get(item.productId) || {
          productName: item.product.name,
          sku: item.product.sku,
          spending: 0,
          quantity: 0,
          orders: new Set<string>(),
        };
        existing.spending += item.subtotalCents;
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
        spending: data.spending / 100,
        orders: data.orders.size,
        quantity: data.quantity,
      }))
      .sort((a, b) => b.spending - a.spending)
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
      { spending: number; orders: Set<string> }
    >();

    orders.forEach((order: typeof orders[number]) => {
      order.items.forEach((item: typeof order.items[number]) => {
        const category = item.product.categoryName || 'Uncategorized';
        const existing = categoryMap.get(category) || {
          spending: 0,
          orders: new Set<string>(),
        };
        existing.spending += item.subtotalCents;
        existing.orders.add(order.id);
        categoryMap.set(category, existing);
      });
    });

    const totalSpending = Array.from(categoryMap.values()).reduce(
      (sum, cat) => sum + cat.spending,
      0
    );

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        spending: data.spending / 100,
        orders: data.orders.size,
        percentage:
          totalSpending > 0
            ? (data.spending / totalSpending) * 100
            : 0,
      }))
      .sort((a, b) => b.spending - a.spending);
  }

  /**
   * Get recent orders
   */
  private async getRecentOrders(whereClause: any, limit: number): Promise<RecentOrder[]> {
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
  ): Promise<RecentQuotation[]> {
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
   * Get previous period spending for comparison
   */
  private async getPreviousPeriodSpending(
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

