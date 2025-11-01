import { describe, it, expect } from 'vitest';
import { ProductMapper, CartMapper } from './mapper';
import type { Product } from '@prisma/client';
import type { CartWithItems } from '@/lib/domain/interfaces/ICartRepository';

describe('ProductMapper', () => {
  describe('toResponseDto', () => {
    it('should map Product to ProductResponseDto', () => {
      const product: Product = {
        id: 'product-1',
        sku: 'SKU-001',
        slug: 'test-product',
        name: 'Test Product',
        description: 'Test Description',
        priceCents: 1000,
        currency: 'USD',
        vatRate: 0.05,
        stock: 100,
        isVisible: true,
        imageName: 'image.jpg',
        categoryName: 'Category',
        brand: 'Brand',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        // All optional Prisma fields
        orgId: null,
        zohoItemId: null,
        purchaseRate: null,
        ean: null,
        upc: null,
        isbn: null,
        partNumber: null,
        manufacturer: null,
        categoryId: null,
        unit: null,
        status: 'active',
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

      const dto = ProductMapper.toResponseDto(product);

      expect(dto.id).toBe(product.id);
      expect(dto.sku).toBe(product.sku);
      expect(dto.slug).toBe(product.slug);
      expect(dto.name).toBe(product.name);
      expect(dto.description).toBe(product.description);
      expect(dto.priceCents).toBe(product.priceCents);
      expect(dto.currency).toBe(product.currency);
      expect(dto.vatRate).toBe(product.vatRate);
      expect(dto.stock).toBe(product.stock);
      expect(dto.isVisible).toBe(product.isVisible);
      expect(dto.imageName).toBe(product.imageName);
      expect(dto.categoryName).toBe(product.categoryName);
      expect(dto.brand).toBe(product.brand);
      expect(dto.createdAt).toBe(product.createdAt);
      expect(dto.updatedAt).toBe(product.updatedAt);
    });

    it('should handle null optional fields', () => {
      const product: Product = {
        id: 'product-2',
        sku: 'SKU-002',
        slug: 'test-product-2',
        name: 'Test Product 2',
        description: null,
        priceCents: 2000,
        currency: 'AED',
        vatRate: 0,
        stock: 0,
        isVisible: false,
        imageName: null,
        categoryName: null,
        brand: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Minimal required fields
        orgId: null,
        zohoItemId: null,
        purchaseRate: null,
        ean: null,
        upc: null,
        isbn: null,
        partNumber: null,
        manufacturer: null,
        categoryId: null,
        unit: null,
        status: 'active',
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

      const dto = ProductMapper.toResponseDto(product);

      expect(dto.description).toBeNull();
      expect(dto.imageName).toBeNull();
      expect(dto.categoryName).toBeNull();
      expect(dto.brand).toBeNull();
    });
  });

  describe('toResponseDtoList', () => {
    it('should map array of Products to ProductResponseDto array', () => {
      const products: Product[] = [
        {
          id: 'product-1',
          sku: 'SKU-001',
          slug: 'product-1',
          name: 'Product 1',
          description: 'Description 1',
          priceCents: 1000,
          currency: 'USD',
          vatRate: 0,
          stock: 10,
          isVisible: true,
          imageName: null,
          categoryName: null,
          brand: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          orgId: null,
          zohoItemId: null,
          purchaseRate: null,
          ean: null,
          upc: null,
          isbn: null,
          partNumber: null,
          manufacturer: null,
          categoryId: null,
          unit: null,
          status: 'active',
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
        },
        {
          id: 'product-2',
          sku: 'SKU-002',
          slug: 'product-2',
          name: 'Product 2',
          description: null,
          priceCents: 2000,
          currency: 'AED',
          vatRate: 0.05,
          stock: 20,
          isVisible: true,
          imageName: 'image2.jpg',
          categoryName: 'Category',
          brand: 'Brand',
          createdAt: new Date(),
          updatedAt: new Date(),
          orgId: null,
          zohoItemId: null,
          purchaseRate: null,
          ean: null,
          upc: null,
          isbn: null,
          partNumber: null,
          manufacturer: null,
          categoryId: null,
          unit: null,
          status: 'active',
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
        },
      ];

      const dtos = ProductMapper.toResponseDtoList(products);

      expect(dtos).toHaveLength(2);
      expect(dtos[0].id).toBe('product-1');
      expect(dtos[1].id).toBe('product-2');
    });

    it('should return empty array for empty input', () => {
      const dtos = ProductMapper.toResponseDtoList([]);
      expect(dtos).toEqual([]);
    });
  });
});

describe('CartMapper', () => {
  describe('toItemResponseDto', () => {
    it('should map cart item to CartItemResponseDto', () => {
      const cartItem: CartWithItems['items'][0] = {
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 5,
        unitPriceCents: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
        product: {
          id: 'product-1',
          name: 'Test Product',
          sku: 'SKU-001',
          imageName: 'image.jpg',
        } as any,
      };

      const dto = CartMapper.toItemResponseDto(cartItem);

      expect(dto.id).toBe('item-1');
      expect(dto.productId).toBe('product-1');
      expect(dto.productName).toBe('Test Product');
      expect(dto.productSku).toBe('SKU-001');
      expect(dto.productImage).toBe('image.jpg');
      expect(dto.quantity).toBe(5);
      expect(dto.unitPriceCents).toBe(1000);
      expect(dto.subtotalCents).toBe(5000); // 5 * 1000
    });

    it('should calculate subtotal correctly', () => {
      const cartItem: CartWithItems['items'][0] = {
        id: 'item-2',
        cartId: 'cart-1',
        productId: 'product-2',
        quantity: 3,
        unitPriceCents: 2500,
        createdAt: new Date(),
        updatedAt: new Date(),
        product: {
          id: 'product-2',
          name: 'Product 2',
          sku: 'SKU-002',
          imageName: null,
        } as any,
      };

      const dto = CartMapper.toItemResponseDto(cartItem);

      expect(dto.subtotalCents).toBe(7500); // 3 * 2500
    });

    it('should handle null product image', () => {
      const cartItem: CartWithItems['items'][0] = {
        id: 'item-3',
        cartId: 'cart-1',
        productId: 'product-3',
        quantity: 1,
        unitPriceCents: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
        product: {
          id: 'product-3',
          name: 'Product 3',
          sku: 'SKU-003',
          imageName: null,
        } as any,
      };

      const dto = CartMapper.toItemResponseDto(cartItem);

      expect(dto.productImage).toBeNull();
    });
  });

  describe('toResponseDto', () => {
    it('should map cart with items to CartResponseDto', () => {
      const cart: CartWithItems = {
        id: 'cart-1',
        orgId: 'org-1',
        branchId: null,
        currency: 'USD',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        items: [
          {
            id: 'item-1',
            cartId: 'cart-1',
            productId: 'product-1',
            quantity: 2,
            unitPriceCents: 1000,
            createdAt: new Date(),
            updatedAt: new Date(),
            product: {
              id: 'product-1',
              name: 'Product 1',
              sku: 'SKU-001',
              imageName: 'image1.jpg',
            } as any,
          },
          {
            id: 'item-2',
            cartId: 'cart-1',
            productId: 'product-2',
            quantity: 3,
            unitPriceCents: 2000,
            createdAt: new Date(),
            updatedAt: new Date(),
            product: {
              id: 'product-2',
              name: 'Product 2',
              sku: 'SKU-002',
              imageName: null,
            } as any,
          },
        ],
      };

      const dto = CartMapper.toResponseDto(cart);

      expect(dto.id).toBe('cart-1');
      expect(dto.items).toHaveLength(2);
      expect(dto.subtotalCents).toBe(8000); // (2 * 1000) + (3 * 2000)
      expect(dto.itemCount).toBe(5); // 2 + 3
      expect(dto.currency).toBe('USD');
      expect(dto.createdAt).toEqual(cart.createdAt);
      expect(dto.updatedAt).toEqual(cart.updatedAt);
    });

    it('should handle empty cart', () => {
      const cart: CartWithItems = {
        id: 'cart-2',
        orgId: 'org-1',
        branchId: null,
        currency: 'AED',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
      };

      const dto = CartMapper.toResponseDto(cart);

      expect(dto.items).toEqual([]);
      expect(dto.subtotalCents).toBe(0);
      expect(dto.itemCount).toBe(0);
    });

    it('should calculate totals correctly for multiple items', () => {
      const cart: CartWithItems = {
        id: 'cart-3',
        orgId: 'org-1',
        branchId: null,
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: 'item-1',
            cartId: 'cart-3',
            productId: 'product-1',
            quantity: 10,
            unitPriceCents: 500,
            createdAt: new Date(),
            updatedAt: new Date(),
            product: {
              id: 'product-1',
              name: 'Product 1',
              sku: 'SKU-001',
              imageName: null,
            } as any,
          },
          {
            id: 'item-2',
            cartId: 'cart-3',
            productId: 'product-2',
            quantity: 5,
            unitPriceCents: 1200,
            createdAt: new Date(),
            updatedAt: new Date(),
            product: {
              id: 'product-2',
              name: 'Product 2',
              sku: 'SKU-002',
              imageName: null,
            } as any,
          },
          {
            id: 'item-3',
            cartId: 'cart-3',
            productId: 'product-3',
            quantity: 1,
            unitPriceCents: 3000,
            createdAt: new Date(),
            updatedAt: new Date(),
            product: {
              id: 'product-3',
              name: 'Product 3',
              sku: 'SKU-003',
              imageName: null,
            } as any,
          },
        ],
      };

      const dto = CartMapper.toResponseDto(cart);

      expect(dto.subtotalCents).toBe(14000); // (10 * 500) + (5 * 1200) + (1 * 3000)
      expect(dto.itemCount).toBe(16); // 10 + 5 + 1
    });
  });
});



