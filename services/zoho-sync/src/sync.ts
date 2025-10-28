/**
 * Zoho Sync Service - Standalone
 * Uses shared libraries from web app
 */

// NOTE: This file now uses the shared ZohoSyncService from the web app
// The duplication has been eliminated - all logic is in the shared service

import { PrismaClient } from ".prisma/zoho-sync-client";
import { createZohoSyncService } from "../../../apps/web/lib/services/zoho-sync-service";
import { getZohoClient } from "../../../apps/web/lib/clients/zoho-client";
import { ProductRepository } from "../../../apps/web/lib/repositories/product-repository";

const prisma = new PrismaClient();

interface SyncConfig {
  clientId: string;
  clientSecret: string;
  organizationId: string;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Sync products from Zoho Inventory to database using service account
 * Now uses shared ZohoSyncService - no duplication
 */
export async function syncProducts(config: SyncConfig): Promise<{
  success: boolean;
  fetched: number;
  synced: number;
  errors: number;
  organization: string;
}> {
  try {
    console.log(`[Sync] Starting Zoho products sync for org: ${config.organizationId}`);

    // Use shared ZohoSyncService with this service's Prisma client
    const productRepository = new ProductRepository(prisma);
    const zohoClient = getZohoClient();
    const syncService = createZohoSyncService(zohoClient, productRepository);

    // Run sync
    const result = await syncService.syncProductsFromZoho({
      zohoOrgId: config.organizationId,
    });

    return {
      success: result.success,
      fetched: result.totalFetched,
      synced: result.synced,
      errors: result.errors,
      organization: "global",
    };
  } catch (error) {
    console.error("[Sync] Fatal error:", error);
    throw error;
  }
}

/**
 * Run a one-time sync
 */
export async function runSyncOnce() {
  try {
    const config: SyncConfig = {
      clientId: process.env.ZOHO_CLIENT_ID || "",
      clientSecret: process.env.ZOHO_CLIENT_SECRET || "",
      organizationId: process.env.ZOHO_ORGANIZATION_ID || "",
      accessToken: process.env.ZOHO_ACCESS_TOKEN,
      refreshToken: process.env.ZOHO_REFRESH_TOKEN,
    };

    if (!config.clientId || !config.clientSecret || !config.organizationId) {
      throw new Error(
        "Missing required environment variables: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_ORGANIZATION_ID"
      );
    }

    if (!config.accessToken && !config.refreshToken) {
      throw new Error(
        "Missing access token. Provide either ZOHO_ACCESS_TOKEN or ZOHO_REFRESH_TOKEN"
      );
    }

    const result = await syncProducts(config);
    console.log("[Sync] Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("[Sync] Failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
