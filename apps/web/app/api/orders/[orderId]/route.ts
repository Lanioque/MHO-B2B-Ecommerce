import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, Role } from "@/lib/auth-helpers";
import { getOrderService } from "@/lib/services/order-service";
import { getOrderRepository } from "@/lib/repositories/order-repository";
import { withErrorHandler } from "@/lib/middleware/error-handler";
import { validateRequestBody } from "@/lib/middleware/validation";
import { z } from "zod";
import type { Order } from "@/lib/prisma-types";

const updateOrderSchema = z.object({
  status: z.enum(["PENDING", "AWAITING_PAYMENT", "PAID", "FAILED", "CANCELLED", "REFUNDED"]).optional(),
});

/**
 * GET /api/orders/[orderId]
 * Get order by ID
 */
async function getOrderHandler(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  await requireAuth();
  const { orderId } = await params;

  const orderService = getOrderService();
  const order = await orderService.getOrderById(orderId);

  // Verify user has access to the order's organization
  // Order extends Order from Prisma which has orgId
  await requireRole((order as Order).orgId, Role.CUSTOMER);

  return NextResponse.json({ order });
}

/**
 * PATCH /api/orders/[orderId]
 * Update order status (admin only)
 */
async function updateOrderHandler(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  await requireAuth();
  const { orderId } = await params;

  const validated = await validateRequestBody(req, updateOrderSchema);
  
  // Get order to check org access
  const orderRepository = getOrderRepository();
  const order = await orderRepository.findById(orderId);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Require admin role to update order
  // Order extends Order from Prisma which has orgId
  await requireRole((order as Order).orgId, Role.ADMIN);

  // Update order
  const updated = await orderRepository.update(orderId, validated);

  return NextResponse.json({ order: updated });
}

export const GET = withErrorHandler(getOrderHandler);
export const PATCH = withErrorHandler(updateOrderHandler);

