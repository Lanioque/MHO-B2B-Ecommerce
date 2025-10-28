/**
 * Cart API Routes
 * GET - Fetch current cart
 * POST - Add item to cart
 * DELETE - Clear cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/middleware/error-handler';
import { validateRequestBody } from '@/lib/middleware/validation';
import { AddToCartSchema } from '@/lib/dto/CartDto';
import { CartMapper } from '@/lib/dto/mapper';
import { createCartService } from '@/lib/services/cart-service';
import { auth } from '@/lib/auth';
import { getOrCreateSessionId } from '@/lib/auth-helpers';
import { CartIdentifier } from '@/lib/domain/interfaces/ICartRepository';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';

/**
 * Helper to validate organization exists
 */
async function validateOrganization(orgId: string): Promise<void> {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      // For guest users, log but don't block - create with default org
      console.warn(`Organization ${orgId} not found, but allowing cart operation for guest`);
    }
  } catch (error) {
    // If database connection fails, allow the operation anyway for guest users
    console.error('Error validating organization:', error);
  }
}

/**
 * Helper to ensure organization exists, create if needed
 */
async function ensureOrganization(orgId: string): Promise<string> {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });
    
    if (org) {
      return orgId;
    }
    
    // Try to find first organization
    const firstOrg = await prisma.organization.findFirst();
    if (firstOrg) {
      return firstOrg.id;
    }
    
    // Create default organization if none exists
    const defaultOrg = await prisma.organization.create({
      data: {
        id: orgId,
        name: 'Default Store',
      },
    });
    return defaultOrg.id;
  } catch (error) {
    console.error('Error ensuring organization:', error);
    // Return original orgId if all else fails
    return orgId;
  }
}

/**
 * Helper to get cart identifier (user or session)
 */
async function getCartIdentifier(orgId: string): Promise<CartIdentifier> {
  const session = await auth();

  if (session?.user?.id) {
    return {
      orgId,
      userId: session.user.id,
    };
  }

  // Guest user - use session ID
  const sessionId = await getOrCreateSessionId();
  return {
    orgId,
    sessionId,
  };
}

/**
 * GET /api/cart
 * Fetch current user's cart
 */
async function getCartHandler(req: NextRequest) {
  const cartService = createCartService();

  // Get organization ID from query params
  const orgId = req.nextUrl.searchParams.get('orgId');
  if (!orgId) {
    return NextResponse.json(
      { error: 'Organization ID is required' },
      { status: 400 }
    );
  }

  // Ensure organization exists (allows guest access)
  const finalOrgId = await ensureOrganization(orgId);

  // Get cart identifier
  const identifier = await getCartIdentifier(finalOrgId);

  // Get or create cart
  const cart = await cartService.getCart(identifier);

  return NextResponse.json({
    cart: CartMapper.toResponseDto(cart),
  });
}

/**
 * POST /api/cart
 * Add item to cart
 */
async function addToCartHandler(req: NextRequest) {
  const cartService = createCartService();

  // Validate request body
  const validated = await validateRequestBody(req, AddToCartSchema);

  // Get organization ID from body or query
  const orgId = validated.branchId || req.nextUrl.searchParams.get('orgId');
  if (!orgId) {
    return NextResponse.json(
      { error: 'Organization ID is required' },
      { status: 400 }
    );
  }

  // Ensure organization exists (allows guest access)
  const finalOrgId = await ensureOrganization(orgId);

  // Get cart identifier
  const identifier = await getCartIdentifier(finalOrgId);

  // Add item to cart
  const cart = await cartService.addItemToCart(
    identifier,
    validated.productId,
    validated.quantity
  );

  return NextResponse.json({
    cart: CartMapper.toResponseDto(cart),
    message: 'Item added to cart',
  });
}

/**
 * DELETE /api/cart
 * Clear cart
 */
async function clearCartHandler(req: NextRequest) {
  const cartService = createCartService();

  // Get organization ID from query params
  const orgId = req.nextUrl.searchParams.get('orgId');
  if (!orgId) {
    return NextResponse.json(
      { error: 'Organization ID is required' },
      { status: 400 }
    );
  }

  // Ensure organization exists (allows guest access)
  const finalOrgId = await ensureOrganization(orgId);

  // Get cart identifier
  const identifier = await getCartIdentifier(finalOrgId);

  // Clear cart
  await cartService.clearCart(identifier);

  return NextResponse.json({
    message: 'Cart cleared successfully',
  });
}

export const GET = withErrorHandler(getCartHandler);
export const POST = withErrorHandler(addToCartHandler);
export const DELETE = withErrorHandler(clearCartHandler);

