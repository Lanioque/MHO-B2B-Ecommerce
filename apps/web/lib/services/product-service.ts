/**
 * Product Service
 * Business logic for product operations
 */

import {
  IProductRepository,
  ProductFilter,
  PaginationOptions,
  PaginatedResult,
  CreateProductData,
  UpdateProductData,
} from '@/lib/domain/interfaces/IProductRepository';
import { Product } from '@prisma/client';
import { ConflictError, NotFoundError } from '@/lib/errors';
import { getProductRepository } from '@/lib/repositories/product-repository';

export class ProductService {
  constructor(private readonly productRepository: IProductRepository) {}

  async getProducts(
    filter: ProductFilter,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<Product>> {
    return this.productRepository.findMany(filter, pagination);
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }

  async getProductBySku(sku: string): Promise<Product | null> {
    return this.productRepository.findBySku(sku);
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    return this.productRepository.findBySlug(slug);
  }

  async createProduct(data: CreateProductData): Promise<Product> {
    // Check for duplicates
    const [existingBySku, existingBySlug] = await Promise.all([
      this.productRepository.findBySku(data.sku),
      this.productRepository.findBySlug(data.slug),
    ]);

    if (existingBySku) {
      throw new ConflictError('Product with this SKU already exists');
    }

    if (existingBySlug) {
      throw new ConflictError('Product with this slug already exists');
    }

    return this.productRepository.create(data);
  }

  async updateProduct(id: string, data: UpdateProductData): Promise<Product> {
    // Ensure product exists
    await this.getProductById(id);

    return this.productRepository.update(id, data);
  }

  async deleteProduct(id: string): Promise<void> {
    // Ensure product exists
    await this.getProductById(id);

    await this.productRepository.delete(id);
  }

  async countProducts(filter: ProductFilter): Promise<number> {
    return this.productRepository.count(filter);
  }
}

// Factory function for dependency injection
export function createProductService(
  productRepository?: IProductRepository
): ProductService {
  return new ProductService(productRepository || getProductRepository());
}


