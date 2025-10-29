import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrderService } from "@/lib/services/order-service";
import { getOrderZohoSyncService } from "@/lib/services/order-zoho-sync-service";
import { withErrorHandler } from "@/lib/middleware/error-handler";
import { validateRequestBody } from "@/lib/middleware/validation";
import { z } from "zod";

const createOrderSchema = z.object({
  cartId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
});

/**
 * POST /api/orders
 * Create order from cart
 */
async function createOrderHandler(req: NextRequest) {
  const session = await auth();
  
  // Validate request body
  const { cartId, branchId } = await validateRequestBody(req, createOrderSchema);

  // Create order from cart
  const orderService = getOrderService();
  const order = await orderService.createOrderFromCart(cartId, branchId);

  // Trigger Zoho sync asynchronously (don't await)
  const syncService = getOrderZohoSyncService();
  syncService.syncOrderToZoho(order.id).catch((error) => {
    console.error(`[Orders API] Failed to sync order ${order.id} to Zoho:`, error);
  });

  return NextResponse.json({ order }, { status: 201 });
}

/**
 * GET /api/orders
 * List orders for organization
 */
async function getOrdersHandler(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("orgId");
  const branchId = searchParams.get("branchId");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  const orderService = getOrderService();
  const { getOrderRepository } = await import("@/lib/repositories/order-repository");
  const orderRepository = getOrderRepository();

  const result = await orderRepository.findMany(
    {
      orgId,
      branchId: branchId || undefined,
      status: status || undefined,
    },
    { page, pageSize }
  );

  // Return in expected format for the frontend
  return NextResponse.json({
    data: result.data,
    total: result.pagination.total,
    page: result.pagination.page,
    pageSize: result.pagination.pageSize,
    totalPages: result.pagination.totalPages,
  });
}

export const POST = withErrorHandler(createOrderHandler);
export const GET = withErrorHandler(getOrdersHandler);

