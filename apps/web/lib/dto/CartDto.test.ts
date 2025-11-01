import { describe, it, expect } from 'vitest';
import { AddToCartSchema, UpdateCartItemSchema, type CartResponseDto, type CartItemResponseDto } from './CartDto';

describe('CartDto', () => {
  describe('AddToCartSchema', () => {
    it('should validate valid cart item data', () => {
      const validData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 5,
      };

      const result = AddToCartSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.productId).toBe(validData.productId);
        expect(result.data.quantity).toBe(5);
      }
    });

    it('should validate with optional branchId', () => {
      const validData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 3,
        branchId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = AddToCartSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.branchId).toBe(validData.branchId);
      }
    });

    it('should reject invalid UUID for productId', () => {
      const invalidData = {
        productId: 'not-a-uuid',
        quantity: 5,
      };

      const result = AddToCartSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject zero quantity', () => {
      const invalidData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 0,
      };

      const result = AddToCartSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative quantity', () => {
      const invalidData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: -1,
      };

      const result = AddToCartSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer quantity', () => {
      const invalidData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 1.5,
      };

      const result = AddToCartSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID for optional branchId', () => {
      const invalidData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 5,
        branchId: 'not-a-uuid',
      };

      const result = AddToCartSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateCartItemSchema', () => {
    it('should validate valid update data', () => {
      const validData = {
        quantity: 10,
      };

      const result = UpdateCartItemSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(10);
      }
    });

    it('should accept zero quantity (for removal)', () => {
      const validData = {
        quantity: 0,
      };

      const result = UpdateCartItemSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(0);
      }
    });

    it('should reject negative quantity', () => {
      const invalidData = {
        quantity: -1,
      };

      const result = UpdateCartItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer quantity', () => {
      const invalidData = {
        quantity: 1.5,
      };

      const result = UpdateCartItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('CartItemResponseDto type', () => {
    it('should have correct type structure', () => {
      const item: CartItemResponseDto = {
        id: 'item-1',
        productId: 'product-1',
        productName: 'Product Name',
        productSku: 'SKU-001',
        productImage: 'image.jpg',
        quantity: 5,
        unitPriceCents: 1000,
        subtotalCents: 5000,
      };

      expect(item.subtotalCents).toBe(item.quantity * item.unitPriceCents);
    });
  });

  describe('CartResponseDto type', () => {
    it('should have correct type structure', () => {
      const cart: CartResponseDto = {
        id: 'cart-1',
        items: [],
        subtotalCents: 0,
        itemCount: 0,
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(cart.items).toEqual([]);
      expect(cart.currency).toBe('USD');
    });
  });
});



