/**
 * Order Repository Implementation
 * Handles order data persistence using Prisma
 */

import { prisma } from '@/lib/prisma';
import {
  IOrderRepository,
  OrderWithItems,
  CreateOrderData,
  UpdateOrderData,
  OrderFilter,
  PaginationOptions,
  PaginatedResult,
} from '@/lib/domain/interfaces/IOrderRepository';
import { Order } from '@prisma/client';

export class OrderRepository implements IOrderRepository {
  private includeClause = {
    items: {
      include: {
        product: true,
      },
    },
    org: true,
    customer: true,
    billing: true,
    shipping: true,
    invoices: {
      orderBy: {
        createdAt: 'desc' as const,
      },
      take: 1, // Get most recent invoice
    },
  } as const;

  async findById(id: string): Promise<OrderWithItems | null> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: this.includeClause,
    });

    if (!order) return null;

    // Fetch branch separately if branchId exists
    if (order.branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: order.branchId } });
      if (branch) {
        (order as any).branch = branch;
      }
    }

    return order as OrderWithItems;
  }

  async findByNumber(number: string): Promise<OrderWithItems | null> {
    const order = await prisma.order.findUnique({
      where: { number },
      include: this.includeClause,
    });

    if (!order) return null;

    // Fetch branch separately if branchId exists
    if (order.branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: order.branchId },
      });
      if (branch) {
        (order as any).branch = branch;
      }
    }

    return order as OrderWithItems;
  }

  async create(data: CreateOrderData): Promise<OrderWithItems> {
    const { items, ...orderData } = data;

    // Filter out undefined values to avoid Prisma errors
    const cleanData: any = {
      orgId: orderData.orgId,
      number: orderData.number,
      totalCents: orderData.totalCents,
      currency: orderData.currency || 'USD',
      status: orderData.status || 'PENDING',
    };

    if (orderData.branchId) cleanData.branchId = orderData.branchId;
    if (orderData.customerId) cleanData.customerId = orderData.customerId;
    if (orderData.billingId) cleanData.billingId = orderData.billingId;
    if (orderData.shippingId) cleanData.shippingId = orderData.shippingId;

    // Create order first
    const order = await prisma.order.create({
      data: {
        ...cleanData,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            subtotalCents: item.subtotalCents,
          })),
        },
      },
    });

    // Fetch order with all relations
    const orderWithRelations = await prisma.order.findUnique({
      where: { id: order.id },
      include: this.includeClause,
    });

    if (!orderWithRelations) {
      throw new Error(`Failed to fetch created order ${order.id}`);
    }

    // Fetch branch separately if branchId exists
    if (order.branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: order.branchId },
      });
      if (branch) {
        (orderWithRelations as any).branch = branch;
      }
    }

    return orderWithRelations as OrderWithItems;
  }

  async update(id: string, data: UpdateOrderData): Promise<Order> {
    // Filter out undefined values and ensure status is properly typed
    const updateData: any = {};
    
    if (data.status) updateData.status = data.status as any;
    if (data.zohoSalesOrderId !== undefined) updateData.zohoSalesOrderId = data.zohoSalesOrderId;
    if (data.zohoInvoiceId !== undefined) updateData.zohoInvoiceId = data.zohoInvoiceId;
    if (data.paymentId !== undefined) updateData.paymentId = data.paymentId;
    if (data.telrTranRef !== undefined) updateData.telrTranRef = data.telrTranRef;

    return prisma.order.update({
      where: { id },
      data: updateData,
    });
  }

  async updateZohoIds(id: string, zohoSalesOrderId?: string, zohoInvoiceId?: string): Promise<Order> {
    const updateData: UpdateOrderData = {};
    if (zohoSalesOrderId) updateData.zohoSalesOrderId = zohoSalesOrderId;
    if (zohoInvoiceId) updateData.zohoInvoiceId = zohoInvoiceId;

    return this.update(id, updateData);
  }

  async findMany(filter: OrderFilter, pagination: PaginationOptions): Promise<PaginatedResult<OrderWithItems>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (filter.orgId) where.orgId = filter.orgId;
    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.customerId) where.customerId = filter.customerId;
    if (filter.status) where.status = filter.status;

    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {};
      if (filter.dateFrom) where.createdAt.gte = filter.dateFrom;
      if (filter.dateTo) where.createdAt.lte = filter.dateTo;
    }

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: this.includeClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    // Fetch branches for orders that have branchId
    const branchIds = [...new Set(data.map((order) => order.branchId).filter(Boolean))] as string[];
    const branches = branchIds.length > 0
      ? await prisma.branch.findMany({
          where: { id: { in: branchIds } },
        })
      : [];

    // Map branches to orders
    const dataWithBranches = data.map((order) => {
      if (order.branchId) {
        const branch = branches.find((b) => b.id === order.branchId);
        if (branch) {
          (order as any).branch = branch;
        }
      }
      return order;
    });

    return {
      data: dataWithBranches as OrderWithItems[],
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async count(filter: OrderFilter): Promise<number> {
    const where: any = {};

    if (filter.orgId) where.orgId = filter.orgId;
    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.customerId) where.customerId = filter.customerId;
    if (filter.status) where.status = filter.status;

    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {};
      if (filter.dateFrom) where.createdAt.gte = filter.dateFrom;
      if (filter.dateTo) where.createdAt.lte = filter.dateTo;
    }

    return prisma.order.count({ where });
  }
}

// Factory function
export function getOrderRepository(): IOrderRepository {
  return new OrderRepository();
}


