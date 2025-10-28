import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createZohoSyncService } from "@/lib/services/zoho-sync-service";
import { withErrorHandler } from "@/lib/middleware/error-handler";
import { validateRequestBody } from "@/lib/middleware/validation";
import { z } from "zod";

/**
 * POST /api/zoho/sync
 * Fetch products from Zoho and save them to database
 * Thin controller - delegates to ZohoSyncService
 */

const syncRequestSchema = z.object({
  orgId: z.string().optional(),
  zohoOrgId: z.string().optional(),
});

async function syncHandler(req: NextRequest) {
  // Authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validation
  const { orgId, zohoOrgId } = await validateRequestBody(req, syncRequestSchema);

  if (!zohoOrgId && !orgId) {
    return NextResponse.json(
      { error: "Either orgId or zohoOrgId is required" },
      { status: 400 }
    );
  }

  // Delegate to service
  const syncService = createZohoSyncService();
  const result = await syncService.syncProductsFromZoho({
    orgId,
    zohoOrgId,
  });

  return NextResponse.json(result);
}

export const POST = withErrorHandler(syncHandler);

