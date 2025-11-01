/**
 * Cart Repository Interface
 * Defines contract for cart data operations
 */

import { Cart, CartItem, Product } from '@prisma/client';

export type CartWithItems = Cart & {
  items: (CartItem & {
    product: Product;
  })[];
};

export interface CartIdentifier {
  orgId: string;
  branchId?: string;
  userId?: string;
  sessionId?: string;
}

export interface AddItemData {
  productId: string;
  quantity: number;
  unitPriceCents: number;
}

export interface ICartRepository {
  /**
   * Find cart by user or session ID
   */
  findByIdentifier(identifier: CartIdentifier): Promise<CartWithItems | null>;

  /**
   * Get or create cart for user/session
   */
  getOrCreate(identifier: CartIdentifier): Promise<CartWithItems>;

  /**
   * Add item to cart (or update quantity if exists)
   */
  addItem(cartId: string, data: AddItemData): Promise<CartWithItems>;

  /**
   * Update item quantity
   */
  updateItemQuantity(itemId: string, quantity: number): Promise<CartItem>;

  /**
   * Remove item from cart
   */
  removeItem(itemId: string): Promise<void>;

  /**
   * Clear all items from cart
   */
  clearCart(cartId: string): Promise<void>;

  /**
   * Delete cart
   */
  deleteCart(cartId: string): Promise<void>;

  /**
   * Get cart by ID
   */
  findById(cartId: string): Promise<CartWithItems | null>;
}

