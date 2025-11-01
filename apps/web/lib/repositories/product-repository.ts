/**
 * Product Repository Implementation
 */

import type { Product, PrismaClient } from '@/lib/prisma-types';
import { prisma } from '@/lib/prisma';
import {
  IProductRepository,
  ProductFilter,
  PaginationOptions,
  PaginatedResult,
  CreateProductData,
  UpdateProductData,
} from '@/lib/domain/interfaces/IProductRepository';

export class ProductRepository implements IProductRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async findById(id: string): Promise<Product | null> {
    return this.db.product.findUnique({
      where: { id },
    });
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.db.product.findUnique({
      where: { sku },
    });
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.db.product.findUnique({
      where: { slug },
    });
  }

  async findByZohoItemId(zohoItemId: string): Promise<Product | null> {
    return this.db.product.findUnique({
      where: { zohoItemId },
    });
  }

  async findMany(
    filter: ProductFilter,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<Product>> {
    const where: any = {};

    if (filter.isVisible !== undefined) {
      where.isVisible = filter.isVisible;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.categoryName) {
      where.categoryName = filter.categoryName;
    }

    if (filter.hasImage) {
      where.imageName = { not: null };
    }

    // Add search functionality - search across multiple fields
    if (filter.search) {
      const searchTerm = filter.search;
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { sku: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { categoryName: { contains: searchTerm, mode: 'insensitive' } },
        { brand: { contains: searchTerm, mode: 'insensitive' } },
        { manufacturer: { contains: searchTerm, mode: 'insensitive' } },
        { partNumber: { contains: searchTerm, mode: 'insensitive' } },
        { ean: { contains: searchTerm, mode: 'insensitive' } },
        { upc: { contains: searchTerm, mode: 'insensitive' } },
        { isbn: { contains: searchTerm, mode: 'insensitive' } },
        { slug: { contains: searchTerm, mode: 'insensitive' } },
        // Search in tags array - exact match (Prisma limitation for array fields)
        { tags: { has: searchTerm } },
      ];
    }

    const skip = (pagination.page - 1) * pagination.pageSize;

    // Determine sort order based on filter
    let orderBy: any = { createdAt: 'desc' }; // Default to newest
    if (filter.sortBy) {
      switch (filter.sortBy) {
        case 'price-low':
          orderBy = { priceCents: 'asc' };
          break;
        case 'price-high':
          orderBy = { priceCents: 'desc' };
          break;
        case 'name-asc':
          orderBy = { name: 'asc' };
          break;
        case 'name-desc':
          orderBy = { name: 'desc' };
          break;
        case 'newest':
        default:
          orderBy = { createdAt: 'desc' };
          break;
      }
    }

    const [items, total] = await Promise.all([
      this.db.product.findMany({
        where,
        orderBy,
        skip,
        take: pagination.pageSize,
      }),
      this.db.product.count({ where }),
    ]);

    return {
      items,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
    };
  }

  async create(data: CreateProductData): Promise<Product> {
    return this.db.product.create({
      data: data as any,
    });
  }

  async update(id: string, data: UpdateProductData): Promise<Product> {
    return this.db.product.update({
      where: { id },
      data: data as any,
    });
  }

  async upsertBySku(
    sku: string,
    createData: CreateProductData,
    updateData: UpdateProductData
  ): Promise<Product> {
    return this.db.product.upsert({
      where: { sku },
      update: updateData as any,
      create: createData as any,
    });
  }

  async batchUpsert(
    products: Array<{ sku: string; data: CreateProductData & UpdateProductData }>
  ): Promise<void> {
    // Process in a transaction for atomicity
    await this.db.$transaction(
      products.map(({ sku, data }) =>
        this.db.product.upsert({
          where: { sku },
          update: data as any,
          create: data as any,
        })
      )
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.product.delete({
      where: { id },
    });
  }

  async count(filter: ProductFilter): Promise<number> {
    const where: any = {};

    if (filter.isVisible !== undefined) {
      where.isVisible = filter.isVisible;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.categoryName) {
      where.categoryName = filter.categoryName;
    }

    if (filter.hasImage) {
      where.imageName = { not: null };
    }

    // Add search functionality - search across multiple fields
    if (filter.search) {
      const searchTerm = filter.search;
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { sku: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { categoryName: { contains: searchTerm, mode: 'insensitive' } },
        { brand: { contains: searchTerm, mode: 'insensitive' } },
        { manufacturer: { contains: searchTerm, mode: 'insensitive' } },
        { partNumber: { contains: searchTerm, mode: 'insensitive' } },
        { ean: { contains: searchTerm, mode: 'insensitive' } },
        { upc: { contains: searchTerm, mode: 'insensitive' } },
        { isbn: { contains: searchTerm, mode: 'insensitive' } },
        { slug: { contains: searchTerm, mode: 'insensitive' } },
        // Search in tags array - check if any tag contains the search term
        { tags: { hasSome: [searchTerm] } },
        { tags: { has: searchTerm } },
      ];
    }

    return this.db.product.count({ where });
  }
}

// Singleton instance
let productRepositoryInstance: ProductRepository | null = null;

export function getProductRepository(): ProductRepository {
  if (!productRepositoryInstance) {
    productRepositoryInstance = new ProductRepository();
  }
  return productRepositoryInstance;
}


