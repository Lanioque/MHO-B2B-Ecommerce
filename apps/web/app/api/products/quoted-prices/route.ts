/**
 * GET /api/products/quoted-prices?orgId=...&branchId=...
 * Returns map of productId -> quoted unitPriceCents based on latest APPROVED quotation
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SessionHelper } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/middleware/error-handler';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const sessionHelper = new SessionHelper(session);
    const membership = sessionHelper.getMembership();
    if (!membership) {
      return NextResponse.json({ error: 'No organization membership found' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;

    // Fetch latest approved quotation items per product for this org (and branch if provided)
    const quotations = await prisma.quotation.findMany({
      where: {
        orgId: membership.orgId,
        status: 'APPROVED',
        ...(branchId ? { branchId } : {}),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const map: Record<string, number> = {};
    for (const q of quotations) {
      for (const item of q.items) {
        if (!(item.productId in map)) {
          map[item.productId] = item.unitPriceCents;
        }
      }
    }

    return NextResponse.json({ success: true, prices: map });
  } catch (error) {
    return handleError(error);
  }
}


