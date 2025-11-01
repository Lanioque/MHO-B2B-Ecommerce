import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductService, createProductService } from './product-service';
import { ConflictError, NotFoundError } from '@/lib/errors';
import type { IProductRepository, ProductFilter, PaginationOptions, CreateProductData, UpdateProductData } from '@/lib/domain/interfaces/IProductRepository';
import type { Product } from '@prisma/client';

describe('ProductService', () => {
  let productService: ProductService;
  let mockProductRepository: IProductRepository;

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

  beforeEach(() => {
    mockProductRepository = {
      findById: vi.fn(),
      findBySku: vi.fn(),
      findBySlug: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
    };

    productService = new ProductService(mockProductRepository);
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const filter: ProductFilter = { orgId: 'org-1' };
      const pagination: PaginationOptions = { page: 1, pageSize: 20 };
      const result = {
        items: [mockProduct],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      };

      vi.mocked(mockProductRepository.findMany).mockResolvedValue(result);

      const products = await productService.getProducts(filter, pagination);

      expect(products).toEqual(result);
      expect(mockProductRepository.findMany).toHaveBeenCalledWith(filter, pagination);
    });
  });

  describe('getProductById', () => {
    it('should return product when found', async () => {
      vi.mocked(mockProductRepository.findById).mockResolvedValue(mockProduct);

      const product = await productService.getProductById('product-1');

      expect(product).toEqual(mockProduct);
    });

    it('should throw NotFoundError when product not found', async () => {
      vi.mocked(mockProductRepository.findById).mockResolvedValue(null);

      await expect(
        productService.getProductById('non-existent')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getProductBySku', () => {
    it('should return product when found', async () => {
      vi.mocked(mockProductRepository.findBySku).mockResolvedValue(mockProduct);

      const product = await productService.getProductBySku('SKU-001');

      expect(product).toEqual(mockProduct);
    });

    it('should return null when product not found', async () => {
      vi.mocked(mockProductRepository.findBySku).mockResolvedValue(null);

      const product = await productService.getProductBySku('non-existent');

      expect(product).toBeNull();
    });
  });

  describe('getProductBySlug', () => {
    it('should return product when found', async () => {
      vi.mocked(mockProductRepository.findBySlug).mockResolvedValue(mockProduct);

      const product = await productService.getProductBySlug('test-product');

      expect(product).toEqual(mockProduct);
    });

    it('should return null when product not found', async () => {
      vi.mocked(mockProductRepository.findBySlug).mockResolvedValue(null);

      const product = await productService.getProductBySlug('non-existent');

      expect(product).toBeNull();
    });
  });

  describe('createProduct', () => {
    it('should create product when no duplicates exist', async () => {
      const data: CreateProductData = {
        sku: 'SKU-002',
        slug: 'new-product',
        name: 'New Product',
        priceCents: 2000,
        currency: 'USD',
        vatRate: 0,
        stock: 50,
      };

      vi.mocked(mockProductRepository.findBySku).mockResolvedValue(null);
      vi.mocked(mockProductRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(mockProductRepository.create).mockResolvedValue({
        ...mockProduct,
        ...data,
      });

      const product = await productService.createProduct(data);

      expect(product.sku).toBe('SKU-002');
      expect(mockProductRepository.create).toHaveBeenCalledWith(data);
    });

    it('should throw ConflictError when SKU already exists', async () => {
      const data: CreateProductData = {
        sku: 'SKU-001',
        slug: 'new-product',
        name: 'New Product',
        priceCents: 2000,
        currency: 'USD',
        vatRate: 0,
        stock: 50,
      };

      vi.mocked(mockProductRepository.findBySku).mockResolvedValue(mockProduct);
      vi.mocked(mockProductRepository.findBySlug).mockResolvedValue(null);

      await expect(
        productService.createProduct(data)
      ).rejects.toThrow(ConflictError);

      expect(mockProductRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictError when slug already exists', async () => {
      const data: CreateProductData = {
        sku: 'SKU-002',
        slug: 'test-product',
        name: 'New Product',
        priceCents: 2000,
        currency: 'USD',
        vatRate: 0,
        stock: 50,
      };

      vi.mocked(mockProductRepository.findBySku).mockResolvedValue(null);
      vi.mocked(mockProductRepository.findBySlug).mockResolvedValue(mockProduct);

      await expect(
        productService.createProduct(data)
      ).rejects.toThrow(ConflictError);

      expect(mockProductRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateProduct', () => {
    it('should update product when it exists', async () => {
      const updateData: UpdateProductData = {
        name: 'Updated Product',
        priceCents: 2500,
      };

      const updatedProduct = { ...mockProduct, ...updateData };

      vi.mocked(mockProductRepository.findById).mockResolvedValue(mockProduct);
      vi.mocked(mockProductRepository.update).mockResolvedValue(updatedProduct);

      const result = await productService.updateProduct('product-1', updateData);

      expect(result.name).toBe('Updated Product');
      expect(result.priceCents).toBe(2500);
      expect(mockProductRepository.update).toHaveBeenCalledWith('product-1', updateData);
    });

    it('should throw NotFoundError when product does not exist', async () => {
      const updateData: UpdateProductData = { name: 'Updated' };

      vi.mocked(mockProductRepository.findById).mockResolvedValue(null);

      await expect(
        productService.updateProduct('non-existent', updateData)
      ).rejects.toThrow(NotFoundError);

      expect(mockProductRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteProduct', () => {
    it('should delete product when it exists', async () => {
      vi.mocked(mockProductRepository.findById).mockResolvedValue(mockProduct);
      vi.mocked(mockProductRepository.delete).mockResolvedValue(undefined);

      await productService.deleteProduct('product-1');

      expect(mockProductRepository.delete).toHaveBeenCalledWith('product-1');
    });

    it('should throw NotFoundError when product does not exist', async () => {
      vi.mocked(mockProductRepository.findById).mockResolvedValue(null);

      await expect(
        productService.deleteProduct('non-existent')
      ).rejects.toThrow(NotFoundError);

      expect(mockProductRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('countProducts', () => {
    it('should return product count', async () => {
      const filter: ProductFilter = { orgId: 'org-1' };
      vi.mocked(mockProductRepository.count).mockResolvedValue(10);

      const count = await productService.countProducts(filter);

      expect(count).toBe(10);
      expect(mockProductRepository.count).toHaveBeenCalledWith(filter);
    });
  });

  describe('createProductService factory', () => {
    it('should create service with provided repository', () => {
      const service = createProductService(mockProductRepository);

      expect(service).toBeInstanceOf(ProductService);
    });

    it('should create service with default repository', () => {
      const service = createProductService();

      expect(service).toBeInstanceOf(ProductService);
    });
  });
});



