import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SessionHelper } from '@/lib/auth-helpers';
import { handleError } from '@/lib/middleware/error-handler';
import { getQuotationService } from '@/lib/services/quotation-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const sessionHelper = new SessionHelper(session);
    const membership = sessionHelper.getMembership();
    if (!membership) return NextResponse.json({ error: 'No organization membership found' }, { status: 403 });

    const { id } = await params;
    const qs = getQuotationService();
    const quotation = await qs.getQuotationById(id);
    if (quotation.orgId !== membership.orgId) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const order = await qs.convertToOrder(id);
    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}


