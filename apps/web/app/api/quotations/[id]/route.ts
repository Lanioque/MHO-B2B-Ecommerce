/**
 * Quotation API Route
 * GET /api/quotations/:id - Get quotation details
 * PATCH /api/quotations/:id - Update quotation (status, convert to order)
 * DELETE /api/quotations/:id - Delete quotation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SessionHelper } from '@/lib/auth-helpers';
import { getQuotationService } from '@/lib/services/quotation-service';
import { handleError } from '@/lib/middleware/error-handler';
import { z } from 'zod';

const updateQuotationSchema = z.object({
  status: z
    .enum([
      'DRAFT',
      'SENT',
      'APPROVED',
      'REJECTED',
      'EXPIRED',
      'CONVERTED',
    ])
    .optional(),
  convertToOrder: z.boolean().optional(),
  message: z.string().max(1000).optional(),
});

/**
 * GET /api/quotations/:id
 * Get quotation details
 */
export async function GET(
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

    const quotationService = getQuotationService();
    const { id } = await params;
    const quotation = await quotationService.getQuotationById(id);

    // Verify quotation belongs to organization
    if (quotation.orgId !== membership.orgId) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      quotation,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PATCH /api/quotations/:id
 * Update quotation status or convert to order
 */
export async function PATCH(
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

    const body = await request.json();
    const validatedData = updateQuotationSchema.parse(body);

    const quotationService = getQuotationService();

    // Verify quotation belongs to organization
    const { id } = await params;
    const quotation = await quotationService.getQuotationById(id);
    if (quotation.orgId !== membership.orgId) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    // Disallow manual convert; conversion is handled based on Zoho API actions
    if (validatedData.convertToOrder) {
      return NextResponse.json({ error: 'Manual conversion is disabled. Status changes are driven by Zoho.' }, { status: 400 });
    }

    // Update status if provided
    if (validatedData.status) {
      // If approved, attempt Zoho conversions
      if (validatedData.status === 'APPROVED') {
        try {
          // Try converting estimate to invoice and sales order in Zoho if available
          const { getZohoClient } = await import('@/lib/clients/zoho-client');
          const { getQuotationService } = await import('@/lib/services/quotation-service');
          const qs = getQuotationService();
          const current = await qs.getQuotationById(id);
          if ((current as any).zohoEstimateId) {
            const zoho = getZohoClient();
            const results = await Promise.allSettled([
              zoho.convertEstimateToSalesOrder(membership.orgId, (current as any).zohoEstimateId),
              zoho.convertEstimateToInvoice(membership.orgId, (current as any).zohoEstimateId),
            ]);
            const allOk = results.every(r => r.status === 'fulfilled');
            if (allOk) {
              // Update status to CONVERTED if Zoho conversions succeeded
              const updated = await quotationService.updateStatus(id, 'CONVERTED', validatedData.message);
              return NextResponse.json({ success: true, quotation: updated });
            }
          }
        } catch (e) {
          console.warn('[Quotations API] Zoho conversion on approval failed', e);
        }
      }

      const updatedQuotation = await quotationService.updateStatus(
        id,
        validatedData.status,
        validatedData.message
      );
      return NextResponse.json({
        success: true,
        quotation: updatedQuotation,
      });
    }

    return NextResponse.json(
      { error: 'No valid update provided' },
      { status: 400 }
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/quotations/:id
 * Delete quotation
 */
export async function DELETE(
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

    const quotationService = getQuotationService();

    // Verify quotation belongs to organization
    const { id } = await params;
    const quotation = await quotationService.getQuotationById(id);
    if (quotation.orgId !== membership.orgId) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    await quotationService.deleteQuotation(id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return handleError(error);
  }
}

