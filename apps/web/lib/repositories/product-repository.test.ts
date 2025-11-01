import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductRepository, getProductRepository } from './product-repository';
import type { ProductFilter, PaginationOptions, CreateProductData, UpdateProductData } from '@/lib/domain/interfaces/IProductRepository';
import type { Product } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('ProductRepository', () => {
  let productRepository: ProductRepository;
  let mockPrisma: any;

  const mockProduct: Product = {
    id: 'product-1',
    orgId: 'org-1',
    sku: 'SKU-001',
    slug: 'test-product',
    name: 'Test Product',
    description: 'Description',
    priceCents: 1000,
    purchaseRate: null,
    currency: 'USD',
    vatRate: 0,
    stock: 100,
    isVisible: true,
    status: 'active',
    imageName: null,
    categoryName: null,
    brand: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    zohoItemId: null,
    ean: null,
    upc: null,
    isbn: null,
    partNumber: null,
    manufacturer: null,
    categoryId: null,
    unit: null,
    source: null,
    itemType: null,
    productType: null,
    taxId: null,
    taxName: null,
    taxPercentage: null,
    isTaxable: false,
    taxExemptionId: null,
    taxExemptionCode: null,
    taxCategoryCode: null,
    taxCategoryName: null,
    trackInventory: false,
    canBeSold: true,
    canBePurchased: true,
    isReturnable: true,
    trackBatchNumber: false,
    isStorageLocationEnabled: false,
    isLinkedWithZohoCRM: false,
    zcrmProductId: null,
    purchaseAccountId: null,
    purchaseAccountName: null,
    accountId: null,
    accountName: null,
    purchaseDescription: null,
    showInStorefront: false,
    length: null,
    width: null,
    height: null,
    weight: null,
    weightUnit: null,
    dimensionUnit: null,
    isComboProduct: false,
    hasAttachment: false,
    imageType: null,
    imageDocumentId: null,
    tags: [],
    zohoCreatedTime: null,
    zohoLastModifiedTime: null,
    lastStockSync: null,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    productRepository = new ProductRepository();
    const { prisma } = await import('@/lib/prisma');
    mockPrisma = prisma as any;
  });

  describe('findById', () => {
    it('should find product by id', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await productRepository.findById('product-1');

      expect(result).toEqual(mockProduct);
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-1' },
      });
    });

    it('should return null when product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const result = await productRepository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findBySku', () => {
    it('should find product by sku', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await productRepository.findBySku('SKU-001');

      expect(result).toEqual(mockProduct);
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { sku: 'SKU-001' },
      });
    });
  });

  describe('findBySlug', () => {
    it('should find product by slug', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await productRepository.findBySlug('test-product');

      expect(result).toEqual(mockProduct);
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-product' },
      });
    });
  });

  describe('findByZohoItemId', () => {
    it('should find product by zoho item id', async () => {
      const zohoProduct = { ...mockProduct, zohoItemId: 'zoho-123' };
      mockPrisma.product.findUnique.mockResolvedValue(zohoProduct);

      const result = await productRepository.findByZohoItemId('zoho-123');

      expect(result).toEqual(zohoProduct);
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { zohoItemId: 'zoho-123' },
      });
    });
  });

  describe('findMany', () => {
    it('should find products with basic filter', async () => {
      const filter: ProductFilter = { orgId: 'org-1' };
      const pagination: PaginationOptions = { page: 1, pageSize: 20 };
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.product.count.mockResolvedValue(1);

      const result = await productRepository.findMany(filter, pagination);

      expect(result.items).toEqual([mockProduct]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by isVisible', async () => {
      const filter: ProductFilter = { orgId: 'org-1', isVisible: true };
      const pagination: PaginationOptions = { page: 1, pageSize: 20 };
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.product.count.mockResolvedValue(1);

      await productRepository.findMany(filter, pagination);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isVisible: true }),
        })
      );
    });

    it('should filter by status', async () => {
      const filter: ProductFilter = { orgId: 'org-1', status: 'active' };
      const pagination: PaginationOptions = { page: 1, pageSize: 20 };
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.product.count.mockResolvedValue(1);

      await productRepository.findMany(filter, pagination);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        })
      );
    });

    it('should filter by categoryName', async () => {
      const filter: ProductFilter = { orgId: 'org-1', categoryName: 'Electronics' };
      const pagination: PaginationOptions = { page: 1, pageSize: 20 };
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.product.count.mockResolvedValue(1);

      await productRepository.findMany(filter, pagination);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryName: 'Electronics' }),
        })
      );
    });

    it('should filter by hasImage', async () => {
      const filter: ProductFilter = { orgId: 'org-1', hasImage: true };
      const pagination: PaginationOptions = { page: 1, pageSize: 20 };
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.product.count.mockResolvedValue(1);

      await productRepository.findMany(filter, pagination);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ imageName: { not: null } }),
        })
      );
    });

    it('should handle search filter', async () => {
      const filter: ProductFilter = { orgId: 'org-1', search: 'test' };
      const pagination: PaginationOptions = { page: 1, pageSize: 20 };
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.product.count.mockResolvedValue(1);

      await productRepository.findMany(filter, pagination);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        })
      );
    });

    it('should sort by price-low', async () => {
      const filter: ProductFilter = { orgId: 'org-1', sortBy: 'price-low' };
      const pagination: PaginationOptions = { page: 1, pageSize: 20 };
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.product.count.mockResolvedValue(1);

      await productRepository.findMany(filter, pagination);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { priceCents: 'asc' } })
      );
    });

    it('should sort by price-high', async () => {
      const filter: ProductFilter = { orgId: 'org-1', sortBy: 'price-high' };
      const pagination: PaginationOptions = { page: 1, pageSize: 20 };
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.product.count.mockResolvedValue(1);

      await productRepository.findMany(filter, pagination);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { priceCents: 'desc' } })
      );
    });

    it('should sort by name-asc', async () => {
      const filter: ProductFilter = { orgId: 'org-1', sortBy: 'name-asc' };
      const pagination: PaginationOptions = { page: 1, pageSize: 20 };
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.product.count.mockResolvedValue(1);

      await productRepository.findMany(filter, pagination);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { name: 'asc' } })
      );
    });

    it('should sort by name-desc', async () => {
      const filter: ProductFilter = { orgId: 'org-1', sortBy: 'name-desc' };
      const pagination: PaginationOptions = { page: 1, pageSize: 20 };
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.product.count.mockResolvedValue(1);

      await productRepository.findMany(filter, pagination);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { name: 'desc' } })
      );
    });

    it('should handle pagination', async () => {
      const filter: ProductFilter = { orgId: 'org-1' };
      const pagination: PaginationOptions = { page: 2, pageSize: 10 };
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.product.count.mockResolvedValue(25);

      const result = await productRepository.findMany(filter, pagination);

      expect(result.totalPages).toBe(3); // Math.ceil(25 / 10)
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 })
      );
    });
  });

  describe('create', () => {
    it('should create product', async () => {
      const data: CreateProductData = {
        sku: 'SKU-002',
        slug: 'new-product',
        name: 'New Product',
        priceCents: 2000,
        currency: 'USD',
        vatRate: 0,
        stock: 50,
      };
      mockPrisma.product.create.mockResolvedValue({ ...mockProduct, ...data });

      const result = await productRepository.create(data);

      expect(result.sku).toBe('SKU-002');
      expect(mockPrisma.product.create).toHaveBeenCalledWith({ data });
    });
  });

  describe('update', () => {
    it('should update product', async () => {
      const data: UpdateProductData = { name: 'Updated Product' };
      const updatedProduct = { ...mockProduct, ...data };
      mockPrisma.product.update.mockResolvedValue(updatedProduct);

      const result = await productRepository.update('product-1', data);

      expect(result.name).toBe('Updated Product');
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data,
      });
    });
  });

  describe('upsertBySku', () => {
    it('should upsert product by sku', async () => {
      const createData: CreateProductData = {
        sku: 'SKU-003',
        slug: 'upsert-product',
        name: 'Upsert Product',
        priceCents: 3000,
        currency: 'USD',
        vatRate: 0,
        stock: 75,
      };
      const updateData: UpdateProductData = { name: 'Updated' };
      mockPrisma.product.upsert.mockResolvedValue({ ...mockProduct, ...createData });

      const result = await productRepository.upsertBySku('SKU-003', createData, updateData);

      expect(result.sku).toBe('SKU-003');
      expect(mockPrisma.product.upsert).toHaveBeenCalledWith({
        where: { sku: 'SKU-003' },
        update: updateData,
        create: createData,
      });
    });
  });

  describe('batchUpsert', () => {
    it('should batch upsert products', async () => {
      const products = [
        { sku: 'SKU-001', data: { name: 'Product 1', priceCents: 1000 } as CreateProductData & UpdateProductData },
        { sku: 'SKU-002', data: { name: 'Product 2', priceCents: 2000 } as CreateProductData & UpdateProductData },
      ];
      mockPrisma.$transaction.mockResolvedValue(undefined);

      await productRepository.batchUpsert(products);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete product', async () => {
      mockPrisma.product.delete.mockResolvedValue(mockProduct);

      await productRepository.delete('product-1');

      expect(mockPrisma.product.delete).toHaveBeenCalledWith({
        where: { id: 'product-1' },
      });
    });
  });

  describe('count', () => {
    it('should count products with filter', async () => {
      const filter: ProductFilter = { orgId: 'org-1', isVisible: true };
      mockPrisma.product.count.mockResolvedValue(10);

      const count = await productRepository.count(filter);

      expect(count).toBe(10);
      expect(mockPrisma.product.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ isVisible: true }),
      });
    });

    it('should handle search in count', async () => {
      const filter: ProductFilter = { orgId: 'org-1', search: 'test' };
      mockPrisma.product.count.mockResolvedValue(5);

      const count = await productRepository.count(filter);

      expect(count).toBe(5);
      expect(mockPrisma.product.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      });
    });
  });

  describe('getProductRepository factory', () => {
    it('should return singleton instance', () => {
      const instance1 = getProductRepository();
      const instance2 = getProductRepository();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(ProductRepository);
    });
  });
});



