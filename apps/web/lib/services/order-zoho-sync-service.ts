/**
 * Order Zoho Sync Service
 * Handles synchronization of orders to Zoho Books as sales orders and invoices
 */

import { prisma } from '@/lib/prisma';
import { getZohoClient, ZohoError } from '@/lib/clients/zoho-client';
import { getOrderRepository } from '@/lib/repositories/order-repository';
import { IOrderRepository } from '@/lib/domain/interfaces/IOrderRepository';
import { ZohoSalesOrder, ZohoInvoice } from '@/lib/domain/interfaces/IZohoClient';
import { getBranchZohoSyncService } from './branch-zoho-sync-service';

export class OrderZohoSyncService {
  constructor(private readonly orderRepository: IOrderRepository) {}

  /**
   * Sync order to Zoho Books (create sales order and invoice)
   */
  async syncOrderToZoho(orderId: string): Promise<void> {
    try {
      // Fetch order with all related data
      const order = await this.orderRepository.findById(orderId);

      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      // Ensure branch is synced to Zoho first
      if (order.branchId) {
        const branch = await prisma.branch.findUnique({
          where: { id: order.branchId },
        });

        if (branch && !branch.zohoContactId) {
          console.log(`[OrderZohoSync] Branch ${order.branchId} not synced, syncing now...`);
          const syncService = getBranchZohoSyncService();
          await syncService.syncBranchToZohoContact(order.branchId);

          // Refetch branch to get updated zohoContactId
          const updatedBranch = await prisma.branch.findUnique({
            where: { id: order.branchId },
          });
          if (!updatedBranch?.zohoContactId) {
            throw new Error(`Failed to sync branch ${order.branchId} to Zoho`);
          }
        }
      }

      // Get branch zohoContactId or use customer's Zoho contact ID
      let customerId: string;
      
      if (order.branchId) {
        const branch = await prisma.branch.findUnique({
          where: { id: order.branchId },
        });
        
        if (branch?.zohoContactId) {
          customerId = branch.zohoContactId;
        } else if (branch) {
          // Branch exists but not synced - sync it now
          console.log(`[OrderZohoSync] Branch ${order.branchId} not synced to Zoho, syncing now...`);
          const syncService = getBranchZohoSyncService();
          await syncService.syncBranchToZohoContact(order.branchId);
          
          // Refetch branch to get zohoContactId
          const updatedBranch = await prisma.branch.findUnique({
            where: { id: order.branchId },
          });
          
          if (!updatedBranch?.zohoContactId) {
            throw new Error(`Failed to sync branch ${order.branchId} to Zoho`);
          }
          customerId = updatedBranch.zohoContactId;
        } else {
          throw new Error(`Branch ${order.branchId} not found`);
        }
      } else if (order.customerId) {
        // Fallback: try to use customer's Zoho contact ID
        const customer = await prisma.customer.findUnique({
          where: { id: order.customerId },
        });
        
        if (customer?.zohoContactId) {
          customerId = customer.zohoContactId;
        } else {
          throw new Error('Order must have a branch ID or customer with Zoho contact ID to sync to Zoho');
        }
      } else {
        throw new Error('Order must have a branch ID or customer ID to sync to Zoho');
      }

      // Map order to Zoho Sales Order format
      const salesOrderData: ZohoSalesOrder = {
        customer_id: customerId,
        reference_number: order.number,
        date: new Date(order.createdAt).toISOString().split('T')[0],
        line_items: order.items.map((item) => ({
          sku: item.product.sku,
          name: item.product.name,
          description: item.product.description || undefined,
          quantity: item.quantity,
          rate: item.unitPriceCents / 100, // Convert cents to dollars
          item_total: item.subtotalCents / 100,
        })),
        currency_code: order.currency,
      };

      // Create sales order in Zoho Books (with retry if contact missing)
      const zohoClient = getZohoClient();
      let zohoSalesOrder;
      try {
        zohoSalesOrder = await zohoClient.createSalesOrder(order.orgId, salesOrderData);
      } catch (err) {
        const isMissingContact = err instanceof ZohoError && typeof err.message === 'string' && err.message.includes('Contact does not exist');
        if (isMissingContact) {
          console.warn(`[OrderZohoSync] Contact missing in Zoho. Attempting to re-sync branch/customer then retry...`);
          // Attempt to resync contact for branch or customer
          if (order.branchId) {
            const syncService = getBranchZohoSyncService();
            await syncService.syncBranchToZohoContact(order.branchId);
            // refresh customerId from branch
            const refreshed = await prisma.branch.findUnique({ where: { id: order.branchId } });
            if (!refreshed?.zohoContactId) {
              throw err; // give up
            }
            salesOrderData.customer_id = refreshed.zohoContactId;
          } else if (order.customerId) {
            // Try to create a simple contact from customer email if available
            const customer = await prisma.customer.findUnique({ where: { id: order.customerId } });
            if (customer?.email) {
              try {
                const created = await zohoClient.createContact(order.orgId, { contact_name: customer.email, email: customer.email } as any);
                salesOrderData.customer_id = (created as any).contact_id;
              } catch (e) {
                console.warn('[OrderZohoSync] Failed to create Zoho contact for customer', e);
                throw err;
              }
            } else {
              throw err;
            }
          } else {
            throw err;
          }

          // Retry once
          zohoSalesOrder = await zohoClient.createSalesOrder(order.orgId, salesOrderData);
        } else {
          throw err;
        }
      }

      // Update order with Zoho sales order ID
      await this.orderRepository.updateZohoIds(
        orderId,
        zohoSalesOrder.salesorder_id,
        undefined
      );

      console.log(`[OrderZohoSync] Created sales order ${zohoSalesOrder.salesorder_id} for order ${orderId}`);

      // Generate invoice number from order number
      const invoiceNumber = order.number.replace('ORD-', 'INV-');

      // Create invoice from sales order
      // Use the sales order ID to properly link the invoice
      const invoiceData: Partial<ZohoInvoice> = {
        invoice_number: invoiceNumber,
        salesorder_id: zohoSalesOrder.salesorder_id,
        customer_id: customerId,
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        payment_terms: 30, // Default 30 days
        reference_number: order.number,
        line_items: salesOrderData.line_items,
        currency_code: order.currency,
      };

      console.log(`[OrderZohoSync] Creating invoice from sales order ${zohoSalesOrder.salesorder_id}`);

      const zohoInvoice = await zohoClient.createInvoice(order.orgId, invoiceData);

      // Mark invoice as sent so it's available for viewing
      let fullInvoice: ZohoInvoice;
      try {
        await zohoClient.sendInvoice(order.orgId, zohoInvoice.invoice_id!);
        // Fetch full invoice details after marking as sent
        fullInvoice = await zohoClient.getInvoice(order.orgId, zohoInvoice.invoice_id!);
      } catch (sendError) {
        console.warn(`[OrderZohoSync] Failed to mark invoice as sent, fetching anyway:`, sendError);
        // Still fetch the invoice even if marking as sent failed
        fullInvoice = await zohoClient.getInvoice(order.orgId, zohoInvoice.invoice_id!);
      }

      // Update order with invoice ID
      await this.orderRepository.updateZohoIds(
        orderId,
        zohoSalesOrder.salesorder_id,
        fullInvoice.invoice_id
      );

      // Create or update local invoice record
      await prisma.invoice.upsert({
        where: { zohoInvoiceId: fullInvoice.invoice_id },
        create: {
          orgId: order.orgId,
          orderId: orderId,
          number: fullInvoice.invoice_number || `INV-${Date.now()}`,
          zohoInvoiceId: fullInvoice.invoice_id,
          pdfUrl: fullInvoice.pdf_url || fullInvoice.invoice_url,
          status: 'ISSUED',
        },
        update: {
          pdfUrl: fullInvoice.pdf_url || fullInvoice.invoice_url,
          status: 'ISSUED',
        },
      });

      console.log(`[OrderZohoSync] Created invoice ${fullInvoice.invoice_id} for order ${orderId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[OrderZohoSync] Failed to sync order ${orderId} to Zoho:`, errorMessage);
      throw error;
    }
  }
}

// Factory function
export function getOrderZohoSyncService(): OrderZohoSyncService {
  const { getOrderRepository } = require('@/lib/repositories/order-repository');
  return new OrderZohoSyncService(getOrderRepository());
}

