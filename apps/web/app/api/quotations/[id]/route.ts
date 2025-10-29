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
});

/**
 * GET /api/quotations/:id
 * Get quotation details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const quotation = await quotationService.getQuotationById(params.id);

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
  { params }: { params: { id: string } }
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
    const quotation = await quotationService.getQuotationById(params.id);
    if (quotation.orgId !== membership.orgId) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    // Convert to order if requested
    if (validatedData.convertToOrder) {
      const order = await quotationService.convertToOrder(params.id);
      return NextResponse.json({
        success: true,
        order,
        quotation: await quotationService.getQuotationById(params.id),
      });
    }

    // Update status if provided
    if (validatedData.status) {
      const updatedQuotation = await quotationService.updateStatus(
        params.id,
        validatedData.status
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
  { params }: { params: { id: string } }
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
    const quotation = await quotationService.getQuotationById(params.id);
    if (quotation.orgId !== membership.orgId) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    await quotationService.deleteQuotation(params.id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return handleError(error);
  }
}

