import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getZohoClient, ZohoError } from "@/lib/clients/zoho-client";
import { prisma } from "@/lib/prisma";
import { ZohoRegion } from "@/lib/config";

/**
 * GET /api/zoho/oauth/callback
 * Handle Zoho OAuth callback and save tokens
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      // If user is not logged in, redirect to login without callback URL
      // because OAuth callbacks shouldn't be used as callback URLs
      return NextResponse.redirect("/login?error=session_expired");
    }

    // Get authorization code and state (orgId) from callback
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const orgId = searchParams.get("state");
    const error = searchParams.get("error");
    const location = (searchParams.get("location") || "eu") as ZohoRegion;
    
    console.log("[OAuth] Callback received:", { code: !!code, orgId, location });

    // Handle OAuth error
    if (error) {
      const errorUrl = new URL("/test-zoho", request.url);
      errorUrl.searchParams.set("error", error);
      return NextResponse.redirect(errorUrl);
    }

    if (!code || !orgId) {
      const errorUrl = new URL("/test-zoho", request.url);
      errorUrl.searchParams.set("error", "missing_parameters");
      return NextResponse.redirect(errorUrl);
    }

    // Exchange code for tokens using unified client
    const zohoClient = getZohoClient();
    const tokenData = await zohoClient.exchangeCode(code, location);

    console.log("[OAuth] Token exchange response:", {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
    });

    // Calculate expiresAt
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    // Get existing connection to preserve refresh token if new one not provided
    const existing = await prisma.zohoConnection.findUnique({ where: { orgId } });

    // Save or update Zoho connection
    await prisma.zohoConnection.upsert({
      where: { orgId },
      update: {
        accessToken: tokenData.access_token,
        // Only update refresh token if Zoho provided a new one
        refreshToken: tokenData.refresh_token || existing?.refreshToken || "pending",
        expiresAt,
        region: location,
        scope: tokenData.scope,
        lastSyncAt: new Date(),
      },
      create: {
        orgId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || "pending",
        expiresAt,
        region: location,
        scope: tokenData.scope,
        lastSyncAt: new Date(),
      },
    });

    // Redirect to test page with success message
    const successUrl = new URL("/test-zoho", request.url);
    successUrl.searchParams.set("zoho_connected", "true");
    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error("Zoho OAuth callback error:", error);

    let errorMessage = "Failed to connect Zoho";

    if (error instanceof ZohoError) {
      errorMessage += `: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }

    const testUrl = new URL("/test-zoho", request.url);
    testUrl.searchParams.set("error", errorMessage);
    return NextResponse.redirect(testUrl);
  }
}

