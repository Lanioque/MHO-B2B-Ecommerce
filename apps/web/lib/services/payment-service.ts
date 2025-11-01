/**
 * Payment Service
 * Handles payment processing logic for orders
 */

import { getTelrClient, TelrPaymentRequest, TelrWebhookPayload } from '@/lib/clients/telr-client';
import { IOrderRepository, OrderWithItems } from '@/lib/domain/interfaces/IOrderRepository';
import { getOrderRepository } from '@/lib/repositories/order-repository';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { Order } from '@prisma/client';

export type PaymentOption = 'pay_now' | 'buy_now_pay_later';

export interface InitiatePaymentFromQuotationParams {
  quotationId: string;
  paymentOption: PaymentOption;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
}

export interface PaymentInitiationResult {
  paymentUrl: string;
  orderId: string;
  tranRef: string;
}

export class PaymentService {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly telrClient = getTelrClient()
  ) {}

  /**
   * Initiate payment for quotation-to-order conversion
   */
  async initiatePaymentFromQuotation(
    params: InitiatePaymentFromQuotationParams
  ): Promise<PaymentInitiationResult> {
    const { quotationId, paymentOption, customerEmail, customerName, customerPhone } = params;

    // Get quotation
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    if (!quotation) {
      throw new NotFoundError('Quotation not found');
    }

    if (quotation.status === 'CONVERTED') {
      throw new ValidationError('Quotation already converted');
    }

    if (quotation.status !== 'APPROVED' && quotation.status !== 'SENT') {
      throw new ValidationError(
        'Only approved or sent quotations can be converted to orders'
      );
    }

    // Generate unique transaction reference
    const tranRef = `TELR-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create order in AWAITING_PAYMENT status
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const orderItems = quotation.items.map((item: typeof quotation.items[number]) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      subtotalCents: item.subtotalCents,
    }));

    const order = await prisma.order.create({
      data: {
        orgId: quotation.orgId,
        branchId: quotation.branchId || undefined,
        customerId: quotation.customerId || undefined,
        number: orderNumber,
        totalCents: quotation.totalCents,
        currency: quotation.currency || 'AED',
        status: 'AWAITING_PAYMENT',
        telrTranRef: tranRef,
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

    const orderBase = order as Order;
    
    // If buy now pay later, mark order as paid and update quotation
    if (paymentOption === 'buy_now_pay_later') {
      await prisma.order.update({
        where: { id: orderBase.id },
        data: {
          status: 'PAID',
          paymentId: `BNPL-${orderBase.id}`,
        },
      });

      // Update quotation status to CONVERTED
      await prisma.quotation.update({
        where: { id: quotationId },
        data: { status: 'CONVERTED' },
      });

      // Sync to Zoho in background
      this.syncOrderToZoho(orderBase.id).catch((error) => {
        console.error(`[PaymentService] Failed to sync order ${orderBase.id} to Zoho:`, error);
      });

      // Return success URL for BNPL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return {
        paymentUrl: `${appUrl}/checkout/success?orderId=${orderBase.id}&tranRef=${tranRef}`,
        orderId: orderBase.id,
        tranRef,
      };
    }

    // For pay_now, initiate Telr payment
    const paymentRequest: TelrPaymentRequest = {
      storeId: process.env.TELR_STORE_ID || '',
      authKey: process.env.TELR_AUTH_KEY || '',
      tranRef,
      orderNumber,
      amount: quotation.totalCents,
      currency: quotation.currency || 'AED',
      customerEmail,
      customerName: customerName || quotation.customer?.firstName || undefined,
      customerPhone,
      returnSuccessUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/telr/return?status=success&tranRef=${tranRef}&orderId=${orderBase.id}`,
      returnDeclineUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/telr/return?status=decline&tranRef=${tranRef}&orderId=${orderBase.id}`,
      returnCancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/telr/return?status=cancel&tranRef=${tranRef}&orderId=${orderBase.id}`,
      langId: 'en',
      testMode: process.env.TELR_MODE === 'test',
    };

    try {
      const paymentResponse = await this.telrClient.initiatePayment(paymentRequest);
      
      return {
        paymentUrl: paymentResponse.paymentUrl,
        orderId: orderBase.id,
        tranRef: paymentResponse.tranRef,
      };
    } catch (error) {
      // If payment initiation fails, mark order as FAILED
      await prisma.order.update({
        where: { id: orderBase.id },
        data: { status: 'FAILED' },
      });

      throw error instanceof Error
        ? error
        : new Error('Failed to initiate payment');
    }
  }

  /**
   * Handle Telr webhook/callback
   */
  async handlePaymentCallback(
    tranRef: string,
    payload: TelrWebhookPayload
  ): Promise<void> {
    // Find order by transaction reference
    const order = await this.orderRepository.findByTelrTranRef(tranRef);

    if (!order) {
      throw new NotFoundError(`Order not found for transaction reference: ${tranRef}`);
    }

    const orderBase = order as Order;

    // Update order based on payment status
    const status = payload.status?.toUpperCase();
    
    if (status === 'A' || status === 'APPROVED' || status === 'SUCCESS') {
      // Payment successful
      await prisma.order.update({
        where: { id: orderBase.id },
        data: {
          status: 'PAID',
          paymentId: payload.telr_ref || tranRef,
        },
      });

      // Update quotation status if exists
      await this.updateQuotationStatusIfNeeded(orderBase.id);

      // Sync to Zoho in background
      this.syncOrderToZoho(orderBase.id).catch((error) => {
        console.error(`[PaymentService] Failed to sync order ${orderBase.id} to Zoho:`, error);
      });
    } else if (status === 'D' || status === 'DECLINED' || status === 'FAILED') {
      // Payment declined/failed
      await prisma.order.update({
        where: { id: orderBase.id },
        data: {
          status: 'FAILED',
        },
      });
    } else if (status === 'C' || status === 'CANCELLED' || status === 'CANCEL') {
      // Payment cancelled
      await prisma.order.update({
        where: { id: orderBase.id },
        data: {
          status: 'CANCELLED',
        },
      });
    }

    // Store webhook event
    await prisma.webhookEvent.create({
      data: {
        source: 'telr',
        type: 'payment.callback',
        payload: payload as any,
        orderId: orderBase.id,
        status: 'PROCESSED',
      },
    });
  }

  /**
   * Update quotation status to CONVERTED if order is paid
   */
  private async updateQuotationStatusIfNeeded(orderId: string): Promise<void> {
    // Find quotation that was converted to this order
    // This is a best-effort operation
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
        },
      });

      if (order && order.customerId) {
        // Find quotations for this customer that match the order
        const quotations = await prisma.quotation.findMany({
          where: {
            customerId: order.customerId,
            orgId: order.orgId,
            status: { not: 'CONVERTED' },
            totalCents: order.totalCents,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        });

        if (quotations.length > 0) {
          await prisma.quotation.update({
            where: { id: quotations[0].id },
            data: { status: 'CONVERTED' },
          });
        }
      }
    } catch (error) {
      console.warn(`[PaymentService] Failed to update quotation status for order ${orderId}:`, error);
    }
  }

  /**
   * Sync order to Zoho (background operation)
   */
  private async syncOrderToZoho(orderId: string): Promise<void> {
    try {
      const { getOrderZohoSyncService } = await import('./order-zoho-sync-service');
      const syncService = getOrderZohoSyncService();
      await syncService.syncOrderToZoho(orderId);
    } catch (error) {
      console.error(`[PaymentService] Error syncing order ${orderId} to Zoho:`, error);
      throw error;
    }
  }

  /**
   * Get payment status for an order
   */
  async getPaymentStatus(orderId: string): Promise<{
    status: string;
    tranRef: string | null;
    paymentId: string | null;
  }> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const orderBase = order as Order;
    return {
      status: orderBase.status,
      tranRef: orderBase.telrTranRef || null,
      paymentId: orderBase.paymentId || null,
    };
  }
}

// Factory function
export function getPaymentService(): PaymentService {
  return new PaymentService(getOrderRepository());
}

