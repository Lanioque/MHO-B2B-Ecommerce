import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SessionHelper } from '@/lib/auth-helpers';
import { handleError } from '@/lib/middleware/error-handler';
import { getQuotationService } from '@/lib/services/quotation-service';
import { getZohoClient } from '@/lib/clients/zoho-client';

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
      return NextResponse.json({ error: 'No organization membership found' }, { status: 403 });
    }

    const quotationService = getQuotationService();
    const { id } = await params;
    const quotation = await quotationService.getQuotationById(id);
    if (quotation.orgId !== membership.orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Resolve estimate id from field or from notes fallback
    let estimateId: string | undefined = (quotation as any).zohoEstimateId as string | undefined;
    if (!estimateId && quotation.notes) {
      const m = /ZohoEstimateId:\s*(\S+)/i.exec(quotation.notes);
      if (m) estimateId = m[1];
    }
    if (!estimateId) {
      return NextResponse.json({ error: 'No Zoho estimate linked to this quotation' }, { status: 400 });
    }

    const zoho = getZohoClient();
    const estimate = await zoho.getEstimate(membership.orgId, estimateId);
    const pdfUrl = estimate.pdf_url || estimate.estimate_url;

    return NextResponse.json({ success: true, pdfUrl });
  } catch (error) {
    return handleError(error);
  }
}


