import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, Role } from "@/lib/auth-helpers";
import { getInvoiceService } from "@/lib/services/invoice-service";
import { withErrorHandler } from "@/lib/middleware/error-handler";

/**
 * GET /api/invoices/[invoiceId]/download
 * Redirect to invoice PDF URL
 */
async function downloadInvoiceHandler(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  await requireAuth();
  const { invoiceId } = await params;

  const invoiceService = getInvoiceService();
  const invoice = await invoiceService.getInvoiceById(invoiceId);

  // Verify user has access
  await requireRole(invoice.orgId, Role.CUSTOMER);

  if (!invoice.pdfUrl) {
    return NextResponse.json({ error: "Invoice PDF not available" }, { status: 404 });
  }

  return NextResponse.redirect(invoice.pdfUrl);
}

export const GET = withErrorHandler(downloadInvoiceHandler);

