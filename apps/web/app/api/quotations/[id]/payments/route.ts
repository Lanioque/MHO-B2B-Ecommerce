/**
 * POST /api/quotations/[id]/payments
 * Initiate payment for quotation-to-order conversion
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SessionHelper } from '@/lib/auth-helpers';
import { handleError } from '@/lib/middleware/error-handler';
import { validateRequestBody } from '@/lib/middleware/validation';
import { getPaymentService } from '@/lib/services/payment-service';
import { getQuotationService } from '@/lib/services/quotation-service';
import { z } from 'zod';

const initiatePaymentSchema = z.object({
  paymentOption: z.enum(['pay_now', 'buy_now_pay_later']),
  customerEmail: z.string().email(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionHelper = new SessionHelper(session);
    const membership = sessionHelper.getMembership();
    if (!membership) {
      return NextResponse.json(
        { error: 'No organization membership found' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const quotationService = getQuotationService();
    const quotation = await quotationService.getQuotationById(id);

    if (quotation.orgId !== membership.orgId) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Validate request body
    const body = await validateRequestBody(request, initiatePaymentSchema);
    const { paymentOption, customerEmail, customerName, customerPhone } = body;

    // Initiate payment
    const paymentService = getPaymentService();
    const result = await paymentService.initiatePaymentFromQuotation({
      quotationId: id,
      paymentOption,
      customerEmail,
      customerName,
      customerPhone,
    });

    return NextResponse.json({
      success: true,
      paymentUrl: result.paymentUrl,
      orderId: result.orderId,
      tranRef: result.tranRef,
    });
  } catch (error) {
    return handleError(error);
  }
}


