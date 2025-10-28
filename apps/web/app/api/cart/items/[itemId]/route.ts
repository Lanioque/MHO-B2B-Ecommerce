/**
 * Cart Item API Routes
 * PATCH - Update item quantity
 * DELETE - Remove item from cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/middleware/error-handler';
import { validateRequestBody } from '@/lib/middleware/validation';
import { UpdateCartItemSchema } from '@/lib/dto/CartDto';
import { CartMapper } from '@/lib/dto/mapper';
import { createCartService } from '@/lib/services/cart-service';

/**
 * PATCH /api/cart/items/[itemId]
 * Update item quantity
 */
async function updateItemHandler(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const cartService = createCartService();
  const { itemId } = await params;

  // Validate request body
  const validated = await validateRequestBody(req, UpdateCartItemSchema);

  if (validated.quantity === 0) {
    // Remove item if quantity is 0
    const cart = await cartService.removeItem(itemId);
    return NextResponse.json({
      cart: CartMapper.toResponseDto(cart),
      message: 'Item removed from cart',
    });
  }

  // Update quantity
  const cart = await cartService.updateItemQuantity(itemId, validated.quantity);

  return NextResponse.json({
    cart: CartMapper.toResponseDto(cart),
    message: 'Cart updated successfully',
  });
}

/**
 * DELETE /api/cart/items/[itemId]
 * Remove item from cart
 */
async function removeItemHandler(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const cartService = createCartService();
  const { itemId } = await params;

  // Remove item
  const cart = await cartService.removeItem(itemId);

  return NextResponse.json({
    cart: CartMapper.toResponseDto(cart),
    message: 'Item removed from cart',
  });
}

export const PATCH = withErrorHandler(updateItemHandler);
export const DELETE = withErrorHandler(removeItemHandler);

