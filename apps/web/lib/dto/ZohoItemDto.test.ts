import { describe, it, expect } from 'vitest';
import { mapZohoItemToProduct } from './ZohoItemDto';
import type { ZohoItem } from '@/lib/domain/interfaces/IZohoClient';

describe('ZohoItemDto', () => {
  describe('mapZohoItemToProduct', () => {
    it('should map basic Zoho item to product data', () => {
      const zohoItem: ZohoItem = {
        item_id: 'zoho-123',
        item_name: 'Test Item',
        name: 'Test Item',
        sku: 'SKU-001',
        rate: 10.50,
        stock_on_hand: 100,
      };

      const product = mapZohoItemToProduct(zohoItem);

      expect(product.sku).toBe('SKU-001');
      expect(product.name).toBe('Test Item');
      expect(product.priceCents).toBe(1050); // 10.50 * 100
      expect(product.stock).toBe(100);
      expect(product.currency).toBe('AED');
      expect(product.zohoItemId).toBe('zoho-123');
      expect(product.slug).toContain('sku-001');
      expect(product.slug).toContain('zoho-123');
    });

    it('should use item_id as sku fallback', () => {
      const zohoItem: ZohoItem = {
        item_id: 'zoho-456',
        item_name: 'Item Without SKU',
        name: 'Item Without SKU',
        rate: 20.00,
        stock_on_hand: 50,
      };

      const product = mapZohoItemToProduct(zohoItem);

      expect(product.sku).toBe('zoho-456');
    });

    it('should generate slug from sku, name, or item_id', () => {
      const zohoItem: ZohoItem = {
        item_id: 'zoho-789',
        item_name: 'Test Product Name',
        name: 'Test Product Name',
        sku: 'TEST-SKU',
        rate: 15.00,
        stock_on_hand: 25,
      };

      const product = mapZohoItemToProduct(zohoItem);

      expect(product.slug).toContain('test-sku');
      expect(product.slug).toContain('zoho-789');
      expect(product.slug.length).toBeLessThanOrEqual(191); // MAX_SLUG_LENGTH
    });

    it('should handle zero rate', () => {
      const zohoItem: ZohoItem = {
        item_id: 'zoho-zero',
        item_name: 'Free Item',
        name: 'Free Item',
        sku: 'FREE-001',
        rate: 0,
        stock_on_hand: 10,
      };

      const product = mapZohoItemToProduct(zohoItem);

      expect(product.priceCents).toBe(0);
    });

    it('should handle missing rate', () => {
      const zohoItem: ZohoItem = {
        item_id: 'zoho-no-rate',
        item_name: 'No Rate Item',
        name: 'No Rate Item',
        sku: 'NO-RATE',
        stock_on_hand: 5,
      };

      const product = mapZohoItemToProduct(zohoItem);

      expect(product.priceCents).toBe(0);
    });

    it('should handle purchase_rate', () => {
      const zohoItem: ZohoItem = {
        item_id: 'zoho-123',
        item_name: 'Item with Purchase Rate',
        name: 'Item with Purchase Rate',
        sku: 'SKU-PR',
        rate: 20.00,
        purchase_rate: 15.00,
        stock_on_hand: 30,
      };

      const product = mapZohoItemToProduct(zohoItem);

      expect(product.purchaseRate).toBe(15.00);
    });

    it('should handle description', () => {
      const zohoItem: ZohoItem = {
        item_id: 'zoho-desc',
        item_name: 'Item with Description',
        name: 'Item with Description',
        sku: 'SKU-DESC',
        description: 'This is a test description',
        rate: 25.00,
        stock_on_hand: 15,
      };

      const product = mapZohoItemToProduct(zohoItem);

      expect(product.description).toBe('This is a test description');
    });

    it('should handle null description', () => {
      const zohoItem: ZohoItem = {
        item_id: 'zoho-no-desc',
        item_name: 'Item without Description',
        name: 'Item without Description',
        sku: 'SKU-NO-DESC',
        rate: 30.00,
        stock_on_hand: 20,
      };

      const product = mapZohoItemToProduct(zohoItem);

      expect(product.description).toBeNull();
    });

    it('should map brand and manufacturer', () => {
      const zohoItem: ZohoItem = {
        item_id: 'zoho-brand',
        item_name: 'Branded Item',
        name: 'Branded Item',
        sku: 'SKU-BRAND',
        brand: 'Test Brand',
        manufacturer: 'Test Manufacturer',
        rate: 40.00,
        stock_on_hand: 40,
      };

      const product = mapZohoItemToProduct(zohoItem);

      expect(product.brand).toBe('Test Brand');
      expect(product.manufacturer).toBe('Test Manufacturer');
    });

    it('should map category information', () => {
      const zohoItem: ZohoItem = {
        item_id: 'zoho-cat',
        item_name: 'Categorized Item',
        name: 'Categorized Item',
        sku: 'SKU-CAT',
        category_id: 'cat-123',
        category_name: 'Test Category',
        unit: 'piece',
        rate: 50.00,
        stock_on_hand: 50,
      };

      const product = mapZohoItemToProduct(zohoItem);

      expect(product.categoryId).toBe('cat-123');
      expect(product.categoryName).toBe('Test Category');
      expect(product.unit).toBe('piece');
    });

    it('should map tax information', () => {
      const zohoItem: ZohoItem = {
        item_id: 'zoho-tax',
        item_name: 'Taxable Item',
        name: 'Taxable Item',
        sku: 'SKU-TAX',
        tax_id: 'tax-123',
        tax_name: 'VAT',
        tax_percentage: 5,
        is_taxable: true,
        rate: 60.00,
        stock_on_hand: 60,
      };

      const product = mapZohoItemToProduct(zohoItem);

      expect(product.taxId).toBe('tax-123');
      expect(product.taxName).toBe('VAT');
      expect(product.taxPercentage).toBe(5);
      expect(product.isTaxable).toBe(true);
    });

    it('should map inventory flags', () => {
      const zohoItem: ZohoItem = {
        item_id: 'zoho-inv',
        item_name: 'Inventory Item',
        name: 'Inventory Item',
        sku: 'SKU-INV',
        track_inventory: true,
        can_be_sold: true,
        can_be_purchased: false,
        is_returnable: false,
        rate: 70.00,
        stock_on_hand: 70,
      };

      const product = mapZohoItemToProduct(zohoItem);

      expect(product.trackInventory).toBe(true);
      expect(product.canBeSold).toBe(true);
      expect(product.canBePurchased).toBe(false);
      expect(product.isReturnable).toBe(false);
    });

    it('should map physical attributes', () => {
      const zohoItem: ZohoItem = {
        item_id: 'zoho-phys',
        item_name: 'Physical Item',
        name: 'Physical Item',
        sku: 'SKU-PHYS',
        length: 10,
        width: 5,
        height: 3,
        weight: 1.5,
        weight_unit: 'kg',
        dimension_unit: 'cm',
        rate: 80.00,
        stock_on_hand: 80,
      };

      const product = mapZohoItemToProduct(zohoItem);

      expect(product.length).toBe(10);
      expect(product.width).toBe(5);
      expect(product.height).toBe(3);
      expect(product.weight).toBe(1.5);
      expect(product.weightUnit).toBe('kg');
      expect(product.dimensionUnit).toBe('cm');
    });

    it('should map image information', () => {
      const zohoItem: ZohoItem = {
        item_id: 'zoho-img',
        item_name: 'Image Item',
        name: 'Image Item',
        sku: 'SKU-IMG',
        image_name: 'product.jpg',
        image_type: 'jpg',
        image_document_id: 'img-doc-123',
        rate: 90.00,
        stock_on_hand: 90,
      };

      const product = mapZohoItemToProduct(zohoItem);

      expect(product.imageName).toBe('product.jpg');
      expect(product.imageType).toBe('jpg');
      expect(product.imageDocumentId).toBe('img-doc-123');
    });

    it('should map timestamps', () => {
      const createdTime = '2024-01-01T00:00:00Z';
      const modifiedTime = '2024-01-02T00:00:00Z';

      const zohoItem: ZohoItem = {
        item_id: 'zoho-time',
        item_name: 'Timed Item',
        name: 'Timed Item',
        sku: 'SKU-TIME',
        created_time: createdTime,
        last_modified_time: modifiedTime,
        rate: 100.00,
        stock_on_hand: 100,
      };

      const product = mapZohoItemToProduct(zohoItem);

      expect(product.zohoCreatedTime).toEqual(new Date(createdTime));
      expect(product.zohoLastModifiedTime).toEqual(new Date(modifiedTime));
      expect(product.lastStockSync).toBeInstanceOf(Date);
    });

    it('should set default values for missing fields', () => {
      const zohoItem: ZohoItem = {
        item_id: 'zoho-minimal',
        item_name: 'Minimal Item',
        name: 'Minimal Item',
        sku: 'SKU-MIN',
        rate: 5.00,
        stock_on_hand: 5,
      };

      const product = mapZohoItemToProduct(zohoItem);

      expect(product.currency).toBe('AED');
      expect(product.vatRate).toBe(0);
      expect(product.unit).toBe('unit');
      expect(product.status).toBe('active');
      expect(product.isTaxable).toBe(false);
      expect(product.trackInventory).toBe(false);
      expect(product.canBeSold).toBe(true);
      expect(product.canBePurchased).toBe(true);
      expect(product.isReturnable).toBe(true);
      expect(product.tags).toEqual([]);
    });

    it('should handle non-numeric stock_on_hand', () => {
      const zohoItem: ZohoItem = {
        item_id: 'zoho-stock',
        item_name: 'Stock Item',
        name: 'Stock Item',
        sku: 'SKU-STOCK',
        rate: 10.00,
        stock_on_hand: '100' as any, // Non-numeric string
      };

      const product = mapZohoItemToProduct(zohoItem);

      expect(product.stock).toBe(0); // Should default to 0 for non-numeric
    });

    it('should truncate slug to MAX_SLUG_LENGTH', () => {
      const longName = 'A'.repeat(300);
      const zohoItem: ZohoItem = {
        item_id: 'zoho-long',
        item_name: longName,
        name: longName,
        sku: 'SKU-LONG',
        rate: 10.00,
        stock_on_hand: 10,
      };

      const product = mapZohoItemToProduct(zohoItem);

      expect(product.slug.length).toBeLessThanOrEqual(191);
    });
  });
});

