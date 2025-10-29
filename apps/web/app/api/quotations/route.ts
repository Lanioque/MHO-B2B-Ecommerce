/**
 * Quotations API Route
 * GET /api/quotations - List quotations
 * POST /api/quotations - Create quotation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SessionHelper } from '@/lib/auth-helpers';
import { getQuotationService } from '@/lib/services/quotation-service';
import { handleError } from '@/lib/middleware/error-handler';
import { parseISO } from 'date-fns';
import { z } from 'zod';

const createQuotationSchema = z.object({
  branchId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
      unitPriceCents: z.number().int().nonnegative(),
      subtotalCents: z.number().int().nonnegative(),
    })
  ).min(1),
});

/**
 * GET /api/quotations
 * List quotations with filters
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const orgId = membership.orgId;
    const branchId = searchParams.get('branchId') || undefined;
    const status = searchParams.get('status') || undefined;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const filters: any = {
      orgId,
      branchId,
      status: status as any,
      limit,
    };

    if (startDateParam) {
      filters.startDate = parseISO(startDateParam);
    }
    if (endDateParam) {
      filters.endDate = parseISO(endDateParam);
    }

    const quotationService = getQuotationService();
    const quotations = await quotationService.getQuotations(filters);

    return NextResponse.json({
      success: true,
      quotations,
      });
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * POST /api/quotations
   * Create new quotation
   */
  export async function POST(request: NextRequest) {
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
      const validatedData = createQuotationSchema.parse(body);

      const quotationService = getQuotationService();
      const quotation = await quotationService.createQuotation({
        orgId: membership.orgId,
        branchId: validatedData.branchId,
        customerId: validatedData.customerId,
        validUntil: validatedData.validUntil
          ? parseISO(validatedData.validUntil)
          : undefined,
        notes: validatedData.notes,
        items: validatedData.items,
      });

      return NextResponse.json(
        {
          success: true,
          quotation,
        },
        { status: 201 }
      );
    } catch (error) {
      return handleError(error);
    }
  }

