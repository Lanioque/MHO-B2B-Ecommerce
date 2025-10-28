import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getZohoAuthUrl } from "@/lib/zoho";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get orgId from query parameter
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "orgId is required" },
        { status: 400 }
      );
    }

    // Generate Zoho OAuth URL
    const authUrl = getZohoAuthUrl(orgId);

    // Redirect to Zoho OAuth
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Zoho call OAuth start error:", error);
    return NextResponse.json(
      { error: "Failed to start Zoho OAuth" },
      { status: 500 }
    );
  }
}

