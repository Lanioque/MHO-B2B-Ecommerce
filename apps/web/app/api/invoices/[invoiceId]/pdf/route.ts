import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getInvoiceService } from "@/lib/services/invoice-service";
import { getZohoClient } from "@/lib/clients/zoho-client";
import { withErrorHandler } from "@/lib/middleware/error-handler";

/**
 * GET /api/invoices/[invoiceId]/pdf
 * Get invoice PDF from Zoho or return stored PDF URL
 */
async function getInvoicePdfHandler(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const session = await auth();
  const { invoiceId } = await params;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoiceService = getInvoiceService();
  const invoice = await invoiceService.getInvoiceById(invoiceId);

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // If we have a PDF URL, try to fetch it from Zoho to ensure it's current
  if (invoice.zohoInvoiceId) {
    try {
      const zohoClient = getZohoClient();
      const zohoInvoice = await zohoClient.getInvoice(invoice.orgId, invoice.zohoInvoiceId);

      if (zohoInvoice.pdf_url) {
        // Fetch the PDF from Zoho
        const accessToken = await zohoClient.getValidAccessToken(invoice.orgId);
        const pdfResponse = await fetch(zohoInvoice.pdf_url, {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
          },
        });

        if (pdfResponse.ok) {
          const pdfBuffer = await pdfResponse.arrayBuffer();
          
          return new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="invoice-${invoice.number}.pdf"`,
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }
      }
    } catch (error) {
      console.error(`[InvoicePDF] Failed to fetch PDF from Zoho:`, error);
      // Fall through to return stored URL or error
    }
  }

  // If PDF URL is stored locally, redirect to it
  if (invoice.pdfUrl) {
    return NextResponse.redirect(invoice.pdfUrl);
  }

  return NextResponse.json(
    { error: "Invoice PDF not available. Please contact support." },
    { status: 404 }
  );
}

export const GET = withErrorHandler(getInvoicePdfHandler);
