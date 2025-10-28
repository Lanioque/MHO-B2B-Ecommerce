import { PrismaClient } from ".prisma/zoho-sync-client";
import {
  getValidAccessToken,
  fetchZohoItems,
  ZohoError,
} from "./zoho-client";

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

    // Use service account access token if provided
    let accessToken = config.accessToken;
    
    // If refresh token provided, get access token
    if (config.refreshToken && !accessToken) {
      console.log("[Sync] Using service account refresh token");
      accessToken = await getValidAccessToken(
        config.refreshToken,
        config.clientId,
        config.clientSecret
      );
    }

    // Fetch products from Zoho
    const products = await fetchZohoItems(config.organizationId, accessToken!);
    console.log(`[Sync] Fetched ${products.length} products from Zoho`);
    
    // Log all fetched items
    if (products.length > 0) {
      console.log(`[Sync] Fetched items from Zoho:`);
      products.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.item_name} (SKU: ${product.sku || product.item_id}) - Price: ${product.rate} - Stock: ${product.stock_on_hand}`);
      });
    } else {
      console.log(`[Sync] No products found in Zoho Inventory`);
    }

    // Sync each product (products are now global, not tied to organizations)
    let syncCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        const sku = product.sku || product.item_id;
        const name = product.item_name;
        const priceCents = Math.round((product.rate || 0) * 100);
        const stock = typeof product.stock_on_hand === "number" ? product.stock_on_hand : 0;

        await prisma.product.upsert({
          where: { sku },
          update: {
            name,
            description: product.description || null,
            priceCents,
            stock,
            zohoItemId: product.item_id,
            lastStockSync: new Date(),
          },
          create: {
            sku,
            slug: sku.toLowerCase().replace(/\s+/g, "-"),
            name,
            description: product.description || null,
            priceCents,
            currency: "USD",
            vatRate: 0,
            zohoItemId: product.item_id,
            stock,
            lastStockSync: new Date(),
          },
        });

        syncCount++;
      } catch (error) {
        console.error(`[Sync] Error syncing product ${product.item_id}:`, error);
        errorCount++;
      }
    }

    console.log(
      `[Sync] Sync completed: ${syncCount} synced, ${errorCount} errors, ${products.length} total fetched`
    );

    return {
      success: true,
      fetched: products.length,
      synced: syncCount,
      errors: errorCount,
      organization: "global", // Products are now global
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
