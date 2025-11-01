/**
 * POST /api/telr/webhook
 * Handle Telr payment webhook callbacks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentService } from '@/lib/services/payment-service';
import { getTelrClient } from '@/lib/clients/telr-client';
import { handleError } from '@/lib/middleware/error-handler';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data: Record<string, string> = {};
    
    // Convert FormData to object
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    const telrClient = getTelrClient();
    const tranRef = data.ivp_tranref || data.tran_ref || '';

    if (!tranRef) {
      return NextResponse.json(
        { error: 'Missing transaction reference' },
        { status: 400 }
      );
    }

    // Verify webhook signature (optional but recommended)
    const signature = data.ivp_hash || '';
    if (signature && !telrClient.verifyWebhookSignature(data, signature)) {
      console.warn('[Telr Webhook] Invalid signature received');
      // Continue processing but log the warning
    }

    // Parse webhook payload
    const payload = telrClient.parseWebhookPayload(data);

    // Store webhook event
    const order = await prisma.order.findUnique({
      where: { telrTranRef: tranRef },
    });

    await prisma.webhookEvent.create({
      data: {
        source: 'telr',
        type: 'payment.webhook',
        payload: payload as any,
        orderId: order?.id,
        status: 'PENDING',
      },
    });

    // Handle payment callback
    const paymentService = getPaymentService();
    await paymentService.handlePaymentCallback(tranRef, payload);

    // Update webhook event status
    await prisma.webhookEvent.updateMany({
      where: {
        source: 'telr',
        type: 'payment.webhook',
        orderId: order?.id,
        status: 'PENDING',
      },
      data: {
        status: 'PROCESSED',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Telr Webhook] Error processing webhook:', error);
    
    // Try to update webhook event status to FAILED
    try {
      const formData = await request.formData();
      const data: Record<string, string> = {};
      formData.forEach((value, key) => {
        data[key] = value.toString();
      });
      const tranRef = data.ivp_tranref || data.tran_ref || '';
      
      if (tranRef) {
        const order = await prisma.order.findUnique({
          where: { telrTranRef: tranRef },
        });

        await prisma.webhookEvent.updateMany({
          where: {
            source: 'telr',
            type: 'payment.webhook',
            orderId: order?.id,
            status: 'PENDING',
          },
          data: {
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    } catch (updateError) {
      console.error('[Telr Webhook] Failed to update webhook event status:', updateError);
    }

    return handleError(error);
  }
}


