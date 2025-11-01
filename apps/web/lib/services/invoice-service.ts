/**
 * Invoice Service
 * Handles invoice creation and retrieval from Zoho
 */

import { prisma } from '@/lib/prisma';
import { getZohoClient } from '@/lib/clients/zoho-client';
import { NotFoundError } from '@/lib/errors';
import { getOrderRepository } from '@/lib/repositories/order-repository';

export class InvoiceService {
  /**
   * Get invoice by ID
   */
  async getInvoiceById(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        org: true,
      },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    return invoice;
  }

  /**
   * Get invoice by Zoho invoice ID
   */
  async getInvoiceByZohoId(zohoInvoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { zohoInvoiceId },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        org: true,
      },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    return invoice;
  }

  /**
   * Refresh invoice from Zoho (update PDF URL and status)
   */
  async refreshInvoiceFromZoho(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { order: true },
    });

    if (!invoice || !invoice.zohoInvoiceId) {
      throw new NotFoundError('Invoice or Zoho invoice ID not found');
    }

    const zohoClient = getZohoClient();
    const zohoInvoice = await zohoClient.getInvoice(invoice.order.orgId, invoice.zohoInvoiceId);

    // Update local invoice record
    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        pdfUrl: zohoInvoice.pdf_url || zohoInvoice.invoice_url,
        status: (zohoInvoice.status || 'ISSUED') as any,
      },
    });

    return updated;
  }

  /**
   * Get invoices for organization
   */
  async getInvoicesByOrgId(orgId: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { orgId },
        include: {
          order: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.invoice.count({ where: { orgId } }),
    ]);

    return {
      invoices,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}

// Factory function
export function getInvoiceService(): InvoiceService {
  return new InvoiceService();
}

