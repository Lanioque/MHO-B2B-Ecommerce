/**
 * Product DTOs
 * Data Transfer Objects for Product API
 */

import { z } from 'zod';

export const CreateProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.number().int().positive(),
  currency: z.string().default('AED'),
  vatRate: z.number().min(0).max(1).default(0),
  zohoItemId: z.string().optional(),
  isVisible: z.boolean().default(true),
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;

export interface ProductResponseDto {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  vatRate: number;
  stock: number;
  isVisible: boolean;
  imageName: string | null;
  categoryName: string | null;
  brand: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductListResponseDto {
  products: ProductResponseDto[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}


