import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchZohoItemsForOrganization, ZohoError } from "@/lib/zoho";
import { getOrgContext, Role } from "@/lib/auth-helpers";

/**
 * GET /api/zoho/products?zohoOrgId=xxx (optional)
 * Fetch all products from Zoho Inventory
 */
export async function GET(req: NextRequest) {
  try {
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
    const products = await fetchZohoItemsForOrganization(orgId || undefined, zohoOrgId || undefined);

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Error fetching Zoho products:", error);

    if (error instanceof ZohoError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }

    // Handle auth errors
    if (error instanceof Error && error.message.includes("don't have access")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    // Return the actual error message for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch products: ${errorMessage}` },
      { status: 500 }
    );
  }
}

