import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getZohoClient } from "@/lib/clients/zoho-client";
import { getOrgContext } from "@/lib/auth-helpers";
import { withErrorHandler } from "@/lib/middleware/error-handler";

/**
 * GET /api/zoho/products?zohoOrgId=xxx (optional)
 * Fetch all products from Zoho Inventory
 * Thin controller - delegates to ZohoClient
 */
async function getZohoProductsHandler(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get optional orgId from query parameters (for OAuth mode)
  const orgId = req.nextUrl.searchParams.get("orgId");
  
  // Get optional Zoho organization ID
  const zohoOrgId = req.nextUrl.searchParams.get("zohoOrgId");

  // If orgId is provided, verify user has access to it
  if (orgId) {
    await getOrgContext(orgId);
  }

  // Fetch products from Zoho
  const zohoClient = getZohoClient();
  const products = await zohoClient.fetchItems(orgId || undefined, zohoOrgId || undefined);

  return NextResponse.json({
    success: true,
    count: products.length,
    products,
  });
}

export const GET = withErrorHandler(getZohoProductsHandler);

