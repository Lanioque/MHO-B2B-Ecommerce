/**
 * Create quotation from current cart
 * POST /api/quotations/from-cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SessionHelper } from '@/lib/auth-helpers';
import { handleError } from '@/lib/middleware/error-handler';
import { createCartService } from '@/lib/services/cart-service';
import { getQuotationService } from '@/lib/services/quotation-service';
import { prisma } from '@/lib/prisma';
import { getOrCreateSessionId } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
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
    let branchId = searchParams.get('branchId') || undefined;

    // Load current cart for user/org (+branch if provided). Fallback to session cart if user cart is empty
    const cartService = createCartService();
    let cart = await cartService.getCart({ orgId: membership.orgId, branchId, userId: session.user.id });
    if (!cart || cart.items.length === 0) {
      const sessionId = await getOrCreateSessionId();
      const sessionCart = await cartService.getCart({ orgId: membership.orgId, branchId, sessionId });
      if (sessionCart && sessionCart.items.length > 0) {
        cart = sessionCart;
      }
    }
    if (!branchId && cart?.branchId) {
      branchId = cart.branchId;
    }

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!branchId) {
      return NextResponse.json({ error: 'Branch is required to request a quote' }, { status: 400 });
    }

    // Best-effort ensure Branch has a Zoho customer (do not block quotation creation)
    try {
      const { getBranchZohoSyncService } = await import('@/lib/services/branch-zoho-sync-service');
      await getBranchZohoSyncService().syncBranchToZohoContact(branchId);
    } catch (e) {
      console.warn('[Quotations From Cart] Non-fatal: failed to sync branch to Zoho before estimate', e);
    }

    // Ensure a local customer record exists for the user to map to Zoho (optional; operations use branch customer)
    let customerId: string | undefined = undefined;
    if (session.user.email) {
      let customer = await prisma.customer.findUnique({
        where: { orgId_email: { orgId: membership.orgId, email: session.user.email } },
      });
      if (!customer) {
        customer = await prisma.customer.create({
          data: { orgId: membership.orgId, email: session.user.email, firstName: session.user.name || null },
        });
      }
      customerId = customer.id;
    }

    const quotationService = getQuotationService();
    const quotation = await quotationService.createQuotation({
      orgId: membership.orgId,
      branchId: branchId,
      customerId,
      items: cart.items.map((it: typeof cart.items[number]) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPriceCents: it.unitPriceCents,
        subtotalCents: it.quantity * it.unitPriceCents,
      })),
    });

    // Do not clear cart; user will still see items while waiting for quote

    return NextResponse.json({ success: true, quotation }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}


