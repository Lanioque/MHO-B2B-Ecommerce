/**
 * Product Repository Interface
 * Defines the contract for product data access
 */

import { Product } from '@prisma/client';

export interface ProductFilter {
  isVisible?: boolean;
  status?: string;
  categoryName?: string;
  hasImage?: boolean;
  search?: string; // Search by name or SKU
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateProductData {
  sku: string;
  slug: string;
  name: string;
  description?: string | null;
  priceCents: number;
  currency: string;
  vatRate: number;
  stock?: number;
  zohoItemId?: string | null;
  [key: string]: any;
}

export interface UpdateProductData {
  name?: string;
  description?: string | null;
  priceCents?: number;
  stock?: number;
  [key: string]: any;
}

export interface IProductRepository {
  /**
   * Find product by ID
   */
  findById(id: string): Promise<Product | null>;

  /**
   * Find product by SKU
   */
  findBySku(sku: string): Promise<Product | null>;

  /**
   * Find product by slug
   */
  findBySlug(slug: string): Promise<Product | null>;

  /**
   * Find product by Zoho item ID
   */
  findByZohoItemId(zohoItemId: string): Promise<Product | null>;

  /**
   * Get paginated products with filters
   */
  findMany(
    filter: ProductFilter,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<Product>>;

  /**
   * Create a new product
   */
  create(data: CreateProductData): Promise<Product>;

  /**
   * Update existing product
   */
  update(id: string, data: UpdateProductData): Promise<Product>;

  /**
   * Upsert product by SKU
   */
  upsertBySku(
    sku: string,
    createData: CreateProductData,
    updateData: UpdateProductData
  ): Promise<Product>;

  /**
   * Batch upsert products
   */
  batchUpsert(
    products: Array<{ sku: string; data: CreateProductData & UpdateProductData }>
  ): Promise<void>;

  /**
   * Delete product
   */
  delete(id: string): Promise<void>;

  /**
   * Count products matching filter
   */
  count(filter: ProductFilter): Promise<number>;
}


