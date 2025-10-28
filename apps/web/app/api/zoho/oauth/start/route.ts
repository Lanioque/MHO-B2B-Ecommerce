import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getZohoClient } from "@/lib/clients/zoho-client";
import { withErrorHandler } from "@/lib/middleware/error-handler";

/**
 * GET /api/zoho/oauth/start
 * Initiate Zoho OAuth flow
 */
async function startZohoOAuthHandler(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get orgId from query parameter
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");

  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  // Generate Zoho OAuth URL using unified client
  const zohoClient = getZohoClient();
  const authUrl = zohoClient.getAuthUrl(orgId);

  // Redirect to Zoho OAuth
  return NextResponse.redirect(authUrl);
}

export const GET = withErrorHandler(startZohoOAuthHandler);

