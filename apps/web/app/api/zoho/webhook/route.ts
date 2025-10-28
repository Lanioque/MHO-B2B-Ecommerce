import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getZohoClient } from "@/lib/clients/zoho-client";
import { createHash, timingSafeEqual } from "crypto";

/**
 * POST /api/zoho/webhook
 * Handle webhook events from Zoho Inventory
 */
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("X-Zoho-Signature");
    const body = await req.text();

    // Verify webhook signature if configured
    if (process.env.ZOHO_WEBHOOK_SECRET) {
      const expectedSignature = createHash("sha256")
        .update(body + process.env.ZOHO_WEBHOOK_SECRET)
        .digest("hex");

      // Use timing-safe comparison to prevent timing attacks
      if (!timingSafeEqual(Buffer.from(signature || ""), Buffer.from(expectedSignature))) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(body);
    const eventType = payload.event;

    console.log(`[Webhook] Received Zoho event: ${eventType}`);

    // Store webhook event
    await prisma.webhookEvent.create({
      data: {
        source: "zoho",
        type: eventType,
        payload,
        status: "PENDING",
      },
    });

    // Process webhook based on event type
    switch (eventType) {
      case "items.create":
      case "items.update":
      case "items.delete":
        await handleItemWebhook(payload);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handle item-related webhooks from Zoho
 */
async function handleItemWebhook(payload: any) {
  const itemId = payload.data?.item_id;
  const orgId = payload.data?.organization_id;

  if (!itemId || !orgId) {
    console.log("[Webhook] Missing item_id or organization_id in payload");
    return;
  }

  try {
    // Fetch updated item from Zoho
    console.log(`[Webhook] Fetching updated item ${itemId} from organization ${orgId}`);
    
    // Note: We'll need to implement fetching a single item by ID
    // For now, we'll just log and mark the webhook as processed
    console.log(`[Webhook] Item ${itemId} needs to be synced`);

    // Update webhook status
    await prisma.webhookEvent.updateMany({
      where: {
        type: payload.event,
        status: "PENDING",
      },
      data: {
        status: "PROCESSED",
      },
    });
  } catch (error) {
    console.error("[Webhook] Error processing item webhook:", error);
    
    await prisma.webhookEvent.updateMany({
      where: {
        type: payload.event,
        status: "PENDING",
      },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

