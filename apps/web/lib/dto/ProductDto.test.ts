import { describe, it, expect } from 'vitest';
import { CreateProductSchema, type ProductResponseDto, type ProductListResponseDto } from './ProductDto';

describe('ProductDto', () => {
  describe('CreateProductSchema', () => {
    it('should validate valid product data', () => {
      const validData = {
        sku: 'SKU-001',
        name: 'Test Product',
        slug: 'test-product',
        priceCents: 1000,
      };

      const result = CreateProductSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sku).toBe('SKU-001');
        expect(result.data.name).toBe('Test Product');
        expect(result.data.currency).toBe('USD'); // default value
        expect(result.data.vatRate).toBe(0); // default value
        expect(result.data.isVisible).toBe(true); // default value
      }
    });

    it('should validate product with all fields', () => {
      const validData = {
        sku: 'SKU-002',
        name: 'Complete Product',
        slug: 'complete-product',
        description: 'A complete product description',
        priceCents: 2500,
        currency: 'AED',
        vatRate: 0.05,
        zohoItemId: 'zoho-123',
        isVisible: false,
      };

      const result = CreateProductSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject(validData);
      }
    });

    it('should reject empty sku', () => {
      const invalidData = {
        sku: '',
        name: 'Test Product',
        slug: 'test-product',
        priceCents: 1000,
      };

      const result = CreateProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const invalidData = {
        sku: 'SKU-001',
        name: '',
        slug: 'test-product',
        priceCents: 1000,
      };

      const result = CreateProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty slug', () => {
      const invalidData = {
        sku: 'SKU-001',
        name: 'Test Product',
        slug: '',
        priceCents: 1000,
      };

      const result = CreateProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative priceCents', () => {
      const invalidData = {
        sku: 'SKU-001',
        name: 'Test Product',
        slug: 'test-product',
        priceCents: -100,
      };

      const result = CreateProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject zero priceCents', () => {
      const invalidData = {
        sku: 'SKU-001',
        name: 'Test Product',
        slug: 'test-product',
        priceCents: 0,
      };

      const result = CreateProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer priceCents', () => {
      const invalidData = {
        sku: 'SKU-001',
        name: 'Test Product',
        slug: 'test-product',
        priceCents: 10.5,
      };

      const result = CreateProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject vatRate greater than 1', () => {
      const invalidData = {
        sku: 'SKU-001',
        name: 'Test Product',
        slug: 'test-product',
        priceCents: 1000,
        vatRate: 1.5,
      };

      const result = CreateProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative vatRate', () => {
      const invalidData = {
        sku: 'SKU-001',
        name: 'Test Product',
        slug: 'test-product',
        priceCents: 1000,
        vatRate: -0.1,
      };

      const result = CreateProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept optional description', () => {
      const validData = {
        sku: 'SKU-001',
        name: 'Test Product',
        slug: 'test-product',
        priceCents: 1000,
        description: 'Optional description',
      };

      const result = CreateProductSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('Optional description');
      }
    });

    it('should accept missing description', () => {
      const validData = {
        sku: 'SKU-001',
        name: 'Test Product',
        slug: 'test-product',
        priceCents: 1000,
      };

      const result = CreateProductSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
      }
    });
  });

  describe('ProductResponseDto type', () => {
    it('should have correct type structure', () => {
      const product: ProductResponseDto = {
        id: 'product-1',
        sku: 'SKU-001',
        slug: 'test-product',
        name: 'Test Product',
        description: 'Description',
        priceCents: 1000,
        currency: 'USD',
        vatRate: 0,
        stock: 100,
        isVisible: true,
        imageName: 'image.jpg',
        categoryName: 'Category',
        brand: 'Brand',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(product.id).toBe('product-1');
      expect(product.stock).toBe(100);
    });
  });

  describe('ProductListResponseDto type', () => {
    it('should have correct type structure', () => {
      const list: ProductListResponseDto = {
        products: [],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 0,
        },
      };

      expect(list.products).toEqual([]);
      expect(list.pagination.page).toBe(1);
    });
  });
});



