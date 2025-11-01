/**
 * Cart Repository Implementation
 * Handles cart data persistence using Prisma
 */

import { prisma } from '@/lib/prisma';
import {
  ICartRepository,
  CartWithItems,
  CartIdentifier,
  AddItemData,
} from '@/lib/domain/interfaces/ICartRepository';
import type { CartItem } from '@/lib/prisma-types';

export class CartRepository implements ICartRepository {
  private includeClause = {
    items: {
      include: {
        product: true,
      },
    },
  };

  async findByIdentifier(identifier: CartIdentifier): Promise<CartWithItems | null> {
    const where: any = {
      orgId: identifier.orgId,
      status: 'active',
    };

    // Include branchId in the query if provided
    if (identifier.branchId) {
      where.branchId = identifier.branchId;
    } else {
      // If no branchId, only match carts without a branch
      where.branchId = null;
    }

    if (identifier.userId) {
      where.userId = identifier.userId;
    } else if (identifier.sessionId) {
      where.sessionId = identifier.sessionId;
      where.userId = null; // Ensure it's a guest cart
    } else {
      return null;
    }

    return prisma.cart.findFirst({
      where,
      include: this.includeClause,
    });
  }

  async getOrCreate(identifier: CartIdentifier): Promise<CartWithItems> {
    const existingCart = await this.findByIdentifier(identifier);
    if (existingCart) {
      return existingCart;
    }

    // Create new cart
    const data: any = {
      orgId: identifier.orgId,
      status: 'active',
    };

    // Include branchId if provided
    if (identifier.branchId) {
      data.branchId = identifier.branchId;
    }

    if (identifier.userId) {
      data.userId = identifier.userId;
    } else if (identifier.sessionId) {
      data.sessionId = identifier.sessionId;
    }

    return prisma.cart.create({
      data,
      include: this.includeClause,
    });
  }

  async addItem(cartId: string, data: AddItemData): Promise<CartWithItems> {
    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId,
        productId: data.productId,
      },
    });

    if (existingItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + data.quantity,
          unitPriceCents: data.unitPriceCents, // Update price in case it changed
        },
      });
    } else {
      // Create new item
      await prisma.cartItem.create({
        data: {
          cartId,
          productId: data.productId,
          quantity: data.quantity,
          unitPriceCents: data.unitPriceCents,
        },
      });
    }

    // Return updated cart
    return this.findById(cartId) as Promise<CartWithItems>;
  }

  async updateItemQuantity(itemId: string, quantity: number): Promise<CartItem> {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      await this.removeItem(itemId);
      // Return a placeholder - caller should handle this case
      throw new Error('Item removed');
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { cart: true },
    });

    return updatedItem;
  }

  async removeItem(itemId: string): Promise<void> {
    await prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  async clearCart(cartId: string): Promise<void> {
    await prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }

  async deleteCart(cartId: string): Promise<void> {
    // Delete all items first
    await this.clearCart(cartId);
    // Delete cart
    await prisma.cart.delete({
      where: { id: cartId },
    });
  }

  async findById(cartId: string): Promise<CartWithItems | null> {
    return prisma.cart.findUnique({
      where: { id: cartId },
      include: this.includeClause,
    });
  }
}

// Factory function
export function getCartRepository(): ICartRepository {
  return new CartRepository();
}

