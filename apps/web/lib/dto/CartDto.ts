/**
 * Cart DTOs
 * Data Transfer Objects for Cart API
 */

import { z } from 'zod';

export const AddToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  branchId: z.string().uuid().optional(), // For future branch-specific carts
});

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(0),
});

export type AddToCartDto = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemDto = z.infer<typeof UpdateCartItemSchema>;

export interface CartItemResponseDto {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  productImage: string | null;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
}

export interface CartResponseDto {
  id: string;
  items: CartItemResponseDto[];
  subtotalCents: number;
  itemCount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

