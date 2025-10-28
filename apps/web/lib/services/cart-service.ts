/**
 * Cart Service
 * Business logic for cart operations
 */

import {
  ICartRepository,
  CartWithItems,
  CartIdentifier,
  AddItemData,
} from '@/lib/domain/interfaces/ICartRepository';
import { getCartRepository } from '@/lib/repositories/cart-repository';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { getProductRepository } from '@/lib/repositories/product-repository';
import { IProductRepository } from '@/lib/domain/interfaces/IProductRepository';

export interface CartTotals {
  subtotalCents: number;
  itemCount: number;
}

export class CartService {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly productRepository: IProductRepository
  ) {}

  /**
   * Get or create cart for user/session
   */
  async getCart(identifier: CartIdentifier): Promise<CartWithItems> {
    return this.cartRepository.getOrCreate(identifier);
  }

  /**
   * Add item to cart
   */
  async addItemToCart(
    identifier: CartIdentifier,
    productId: string,
    quantity: number
  ): Promise<CartWithItems> {
    // Validate quantity
    if (quantity <= 0) {
      throw new ValidationError('Quantity must be greater than 0');
    }

    // Get product and validate it exists
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Validate product is visible and active
    if (!product.isVisible || product.status !== 'active') {
      throw new ValidationError('Product is not available');
    }

    // Get or create cart
    const cart = await this.cartRepository.getOrCreate(identifier);

    // Add item with current product price
    return this.cartRepository.addItem(cart.id, {
      productId,
      quantity,
      unitPriceCents: product.priceCents,
    });
  }

  /**
   * Update item quantity in cart
   */
  async updateItemQuantity(
    itemId: string,
    quantity: number
  ): Promise<CartWithItems> {
    if (quantity < 0) {
      throw new ValidationError('Quantity cannot be negative');
    }

    if (quantity === 0) {
      // Remove item if quantity is 0
      return this.removeItem(itemId);
    }

    await this.cartRepository.updateItemQuantity(itemId, quantity);

    // Get the updated cart with all items
    const cart = await this.getCartByItemId(itemId);
    return cart;
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemId: string): Promise<CartWithItems> {
    // Get cart before removing item
    const cart = await this.getCartByItemId(itemId);
    
    await this.cartRepository.removeItem(itemId);
    
    // Return updated cart
    const updatedCart = await this.cartRepository.findById(cart.id);
    if (!updatedCart) {
      throw new NotFoundError('Cart not found after removing item');
    }
    
    return updatedCart;
  }

  /**
   * Clear all items from cart
   */
  async clearCart(identifier: CartIdentifier): Promise<void> {
    const cart = await this.cartRepository.findByIdentifier(identifier);
    if (cart) {
      await this.cartRepository.clearCart(cart.id);
    }
  }

  /**
   * Calculate cart totals
   */
  calculateTotals(cart: CartWithItems): CartTotals {
    const subtotalCents = cart.items.reduce((total, item) => {
      return total + item.quantity * item.unitPriceCents;
    }, 0);

    const itemCount = cart.items.reduce((count, item) => {
      return count + item.quantity;
    }, 0);

    return {
      subtotalCents,
      itemCount,
    };
  }

  /**
   * Helper to get cart by item ID
   */
  private async getCartByItemId(itemId: string): Promise<CartWithItems> {
    // Query to get cart through item using prisma directly
    const prisma = (await import('@/lib/prisma')).prisma;
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { 
        cart: { 
          include: { 
            items: { 
              include: { 
                product: true 
              } 
            } 
          } 
        } 
      },
    });

    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }

    return cartItem.cart as CartWithItems;
  }
}

// Factory function
export function createCartService(
  cartRepository?: ICartRepository,
  productRepository?: IProductRepository
): CartService {
  return new CartService(
    cartRepository || getCartRepository(),
    productRepository || getProductRepository()
  );
}

