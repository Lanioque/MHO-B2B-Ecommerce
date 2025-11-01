/**
 * Quotation Service
 * Business logic for quotation operations
 */

import { prisma } from '@/lib/prisma';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { getOrderService } from './order-service';
import { getZohoClient } from '@/lib/clients/zoho-client';
import { getBranchZohoSyncService } from './branch-zoho-sync-service';

export interface CreateQuotationData {
  orgId: string;
  branchId?: string;
  customerId?: string;
  validUntil?: Date;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPriceCents: number;
    subtotalCents: number;
  }>;
}

export interface QuotationWithItems {
  id: string;
  orgId: string;
  branchId?: string | null;
  customerId?: string | null;
  number: string;
  totalCents: number;
  currency: string;
  status: string;
  validUntil?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPriceCents: number;
    subtotalCents: number;
    product: {
      id: string;
      name: string;
      sku: string;
      categoryName?: string | null;
    };
  }>;
}

export class QuotationService {
  /**
   * Generate unique quotation number
   */
  private generateQuotationNumber(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `QUO-${timestamp}-${random}`;
  }

  /**
   * Create new quotation
   */
  async createQuotation(data: CreateQuotationData): Promise<QuotationWithItems> {
    // Validate items
    if (!data.items || data.items.length === 0) {
      throw new ValidationError('Quotation must have at least one item');
    }

    // Calculate total
    const totalCents = data.items.reduce(
      (sum, item) => sum + item.subtotalCents,
      0
    );

    // Generate quotation number
    const number = this.generateQuotationNumber();

    // Create quotation with items
    const quotation = await prisma.quotation.create({
      data: {
        orgId: data.orgId,
        branchId: data.branchId,
        customerId: data.customerId,
        number,
        totalCents,
        currency: 'AED',
        status: 'DRAFT',
        validUntil: data.validUntil,
        notes: data.notes,
        items: {
          create: data.items.map((item: typeof data.items[number]) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            subtotalCents: item.subtotalCents,
          })),
        },
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                categoryName: true,
              },
            },
          },
        },
      },
    });

    // Create Zoho Books estimate (best-effort; keep local quotation even on Zoho failure)
    try {
      const zoho = getZohoClient();
      // Always use the branch's Zoho contact for all operations
      let zohoContactId: string | undefined;
      if (data.branchId) {
        const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
        if (branch?.zohoContactId) {
          zohoContactId = branch.zohoContactId;
        } else if (branch) {
          const sync = getBranchZohoSyncService();
          await sync.syncBranchToZohoContact(branch.id);
          const refreshed = await prisma.branch.findUnique({ where: { id: branch.id } });
          if (refreshed?.zohoContactId) {
            zohoContactId = refreshed.zohoContactId;
          }
        }
      }

      const estimatePayload = {
        customer_id: zohoContactId, // Zoho requires a valid customer
        reference_number: quotation.number,
        date: new Date().toISOString().slice(0, 10),
        line_items: quotation.items.map((it: typeof quotation.items[number]) => ({
          name: it.product.name,
          sku: it.product.sku,
          rate: it.unitPriceCents / 100,
          quantity: it.quantity,
        })),
        notes: quotation.notes || undefined,
      };

      const zohoEstimate = await zoho.createEstimate(data.orgId, estimatePayload);
      const estimateId = zohoEstimate.estimate_id || zohoEstimate.estimate_number || null;
      await prisma.quotation.update({
        where: { id: quotation.id },
        data: { 
          zohoEstimateId: estimateId, 
          status: 'SENT'
        } as any,
      });
    } catch (err) {
      console.warn('[QuotationService] Zoho estimate creation failed:', err);
    }

    return (await this.getQuotationById(quotation.id)) as QuotationWithItems;
  }

  /**
   * Get quotation by ID
   */
  async getQuotationById(id: string): Promise<QuotationWithItems> {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                categoryName: true,
              },
            },
          },
        },
      },
    });

    if (!quotation) {
      throw new NotFoundError('Quotation not found');
    }

    return quotation as QuotationWithItems;
  }

  /**
   * List quotations with filters
   */
  async getQuotations(filters: {
    orgId: string;
    branchId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: any = {
      orgId: filters.orgId,
    };

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return prisma.quotation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update quotation status
   */
  async updateStatus(
    id: string,
    status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED',
    customerMessage?: string
  ): Promise<QuotationWithItems> {
    const quotation = await prisma.quotation.update({
      where: { id },
      data: { status, ...(customerMessage ? { customerMessage } : {}) },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                categoryName: true,
              },
            },
          },
        },
      },
    });

    return quotation as QuotationWithItems;
  }

  /**
   * Convert quotation to order
   */
  async convertToOrder(quotationId: string): Promise<any> {
    const quotation = await this.getQuotationById(quotationId);

    if (quotation.status === 'CONVERTED') {
      throw new ValidationError('Quotation already converted');
    }

    if (quotation.status !== 'APPROVED' && quotation.status !== 'SENT') {
      throw new ValidationError(
        'Only approved or sent quotations can be converted to orders'
      );
    }

    // Create order from quotation
    // Note: This is a simplified conversion. In production, you'd want to
    // create a cart first or directly create an order with proper service layer
    const orderService = getOrderService();
    
    // Create order items from quotation items
    const orderItems = quotation.items.map((item: typeof quotation.items[number]) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      subtotalCents: item.subtotalCents,
    }));

    // Create order manually since we don't have a direct cart
    const order = await prisma.order.create({
      data: {
        orgId: quotation.orgId,
        branchId: quotation.branchId || undefined,
        customerId: quotation.customerId || undefined,
        number: `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        totalCents: quotation.totalCents,
        currency: quotation.currency,
        status: 'PENDING',
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    // Update quotation status
    await this.updateStatus(quotationId, 'CONVERTED');

    // Best-effort: sync order to Zoho (create sales order + invoice)
    try {
      const { getOrderZohoSyncService } = await import('./order-zoho-sync-service');
      const syncService = getOrderZohoSyncService();
      await syncService.syncOrderToZoho(order.id);
    } catch (e) {
      console.warn('[QuotationService] Non-fatal: failed to sync created order to Zoho', e);
    }

    return order;
  }

  /**
   * Delete quotation
   */
  async deleteQuotation(id: string): Promise<void> {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!quotation) {
      throw new NotFoundError('Quotation not found');
    }

    await prisma.quotation.delete({
      where: { id },
    });
  }
}

// Factory function
export function getQuotationService(): QuotationService {
  return new QuotationService();
}


