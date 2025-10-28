import cron from "node-cron";
import { syncProducts } from "./sync";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Schedule: Run every 15 minutes
const CRON_SCHEDULE = "*/15 * * * *";

console.log("[Service] Zoho Sync Service starting...");
console.log(`[Service] Cron schedule: ${CRON_SCHEDULE}`);

// Get configuration from environment
const config = {
  clientId: process.env.ZOHO_CLIENT_ID || "",
  clientSecret: process.env.ZOHO_CLIENT_SECRET || "",
  organizationId: process.env.ZOHO_ORGANIZATION_ID || "",
  accessToken: process.env.ZOHO_ACCESS_TOKEN,
  refreshToken: process.env.ZOHO_REFRESH_TOKEN,
};

// Validate configuration
if (!config.clientId || !config.clientSecret || !config.organizationId) {
  console.error("[Service] Missing required environment variables:");
  console.error("[Service] - ZOHO_CLIENT_ID");
  console.error("[Service] - ZOHO_CLIENT_SECRET");
  console.error("[Service] - ZOHO_ORGANIZATION_ID");
  process.exit(1);
}

if (!config.accessToken && !config.refreshToken) {
  console.error("[Service] Missing access token. Provide either:");
  console.error("[Service] - ZOHO_ACCESS_TOKEN");
  console.error("[Service] - ZOHO_REFRESH_TOKEN");
  process.exit(1);
}

console.log("[Service] Configuration loaded");
console.log(`[Service] Zoho Organization ID: ${config.organizationId}`);

// Define sync task
async function runSyncTask() {
  const now = new Date().toISOString();
  console.log(`\n[Sync] Starting sync at ${now}`);

  try {
    const result = await syncProducts(config);
    console.log("[Sync] Completed:", {
      success: result.success,
      fetched: result.fetched,
      synced: result.synced,
      errors: result.errors,
    });
  } catch (error) {
    console.error("[Sync] Error:", error);
  }

  console.log(`[Sync] Finished at ${new Date().toISOString()}\n`);
}

// Run sync immediately on startup
console.log("[Service] Running initial sync...");
runSyncTask();

// Schedule recurring syncs
console.log("[Service] Scheduling recurring syncs...");
const task = cron.schedule(CRON_SCHEDULE, runSyncTask);

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("[Service] SIGTERM received, shutting down gracefully...");
  task.stop();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("[Service] SIGINT received, shutting down gracefully...");
  task.stop();
  process.exit(0);
});

console.log("[Service] Service is running. Press Ctrl+C to stop.");

