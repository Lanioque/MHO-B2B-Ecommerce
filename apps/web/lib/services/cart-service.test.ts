import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartService, createCartService } from './cart-service';
import { NotFoundError, ValidationError } from '@/lib/errors';
import type { ICartRepository, CartWithItems, CartIdentifier, AddItemData } from '@/lib/domain/interfaces/ICartRepository';
import type { IProductRepository } from '@/lib/domain/interfaces/IProductRepository';
import type { Product } from '@prisma/client';

describe('CartService', () => {
  let cartService: CartService;
  let mockCartRepository: ICartRepository;
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

  const mockCart: CartWithItems = {
    id: 'cart-1',
    orgId: 'org-1',
    branchId: null,
    userId: null,
    sessionId: 'session-1',
    currency: 'USD',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
  };

  beforeEach(() => {
    mockCartRepository = {
      findByIdentifier: vi.fn(),
      getOrCreate: vi.fn(),
      findById: vi.fn(),
      addItem: vi.fn(),
      updateItemQuantity: vi.fn(),
      removeItem: vi.fn(),
      clearCart: vi.fn(),
    };

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

    cartService = new CartService(mockCartRepository, mockProductRepository);
  });

  describe('getCart', () => {
    it('should get cart from repository', async () => {
      const identifier: CartIdentifier = { orgId: 'org-1', sessionId: 'session-1' };
      vi.mocked(mockCartRepository.getOrCreate).mockResolvedValue(mockCart);

      const result = await cartService.getCart(identifier);

      expect(result).toEqual(mockCart);
      expect(mockCartRepository.getOrCreate).toHaveBeenCalledWith(identifier);
    });
  });

  describe('addItemToCart', () => {
    it('should add item to cart with valid product', async () => {
      const identifier: CartIdentifier = { orgId: 'org-1', sessionId: 'session-1' };
      const cartWithItem: CartWithItems = {
        ...mockCart,
        items: [
          {
            id: 'item-1',
            cartId: 'cart-1',
            productId: 'product-1',
            quantity: 2,
            unitPriceCents: 1000,
            createdAt: new Date(),
            updatedAt: new Date(),
            product: mockProduct as any,
          },
        ],
      };

      vi.mocked(mockProductRepository.findById).mockResolvedValue(mockProduct);
      vi.mocked(mockCartRepository.getOrCreate).mockResolvedValue(mockCart);
      vi.mocked(mockCartRepository.addItem).mockResolvedValue(cartWithItem);

      const result = await cartService.addItemToCart(identifier, 'product-1', 2);

      expect(result).toEqual(cartWithItem);
      expect(mockProductRepository.findById).toHaveBeenCalledWith('product-1');
      expect(mockCartRepository.addItem).toHaveBeenCalledWith('cart-1', {
        productId: 'product-1',
        quantity: 2,
        unitPriceCents: 1000,
      });
    });

    it('should throw ValidationError for zero quantity', async () => {
      const identifier: CartIdentifier = { orgId: 'org-1', sessionId: 'session-1' };

      await expect(
        cartService.addItemToCart(identifier, 'product-1', 0)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for negative quantity', async () => {
      const identifier: CartIdentifier = { orgId: 'org-1', sessionId: 'session-1' };

      await expect(
        cartService.addItemToCart(identifier, 'product-1', -1)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when product does not exist', async () => {
      const identifier: CartIdentifier = { orgId: 'org-1', sessionId: 'session-1' };
      vi.mocked(mockProductRepository.findById).mockResolvedValue(null);

      await expect(
        cartService.addItemToCart(identifier, 'non-existent', 1)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when product is not visible', async () => {
      const identifier: CartIdentifier = { orgId: 'org-1', sessionId: 'session-1' };
      const hiddenProduct = { ...mockProduct, isVisible: false };
      vi.mocked(mockProductRepository.findById).mockResolvedValue(hiddenProduct);

      await expect(
        cartService.addItemToCart(identifier, 'product-1', 1)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when product status is not active', async () => {
      const identifier: CartIdentifier = { orgId: 'org-1', sessionId: 'session-1' };
      const inactiveProduct = { ...mockProduct, status: 'inactive' };
      vi.mocked(mockProductRepository.findById).mockResolvedValue(inactiveProduct);

      await expect(
        cartService.addItemToCart(identifier, 'product-1', 1)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('updateItemQuantity', () => {
    it('should update item quantity successfully', async () => {
      const cartWithItem: CartWithItems = {
        ...mockCart,
        items: [
          {
            id: 'item-1',
            cartId: 'cart-1',
            productId: 'product-1',
            quantity: 3,
            unitPriceCents: 1000,
            createdAt: new Date(),
            updatedAt: new Date(),
            product: mockProduct as any,
          },
        ],
      };

      const mockPrisma = {
        cartItem: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'item-1',
            cart: cartWithItem,
          }),
        },
      };
      
      const prismaModule = await import('@/lib/prisma');
      vi.spyOn(prismaModule, 'prisma', 'get').mockReturnValue(mockPrisma as any);
      
      vi.mocked(mockCartRepository.updateItemQuantity).mockResolvedValue(undefined);

      const result = await cartService.updateItemQuantity('item-1', 5);

      expect(mockCartRepository.updateItemQuantity).toHaveBeenCalledWith('item-1', 5);
      expect(result).toEqual(cartWithItem);
    });

    it('should throw ValidationError for negative quantity', async () => {
      await expect(
        cartService.updateItemQuantity('item-1', -1)
      ).rejects.toThrow(ValidationError);
    });

    it('should remove item when quantity is 0', async () => {
      const cartWithItem: CartWithItems = {
        ...mockCart,
        items: [
          {
            id: 'item-1',
            cartId: 'cart-1',
            productId: 'product-1',
            quantity: 1,
            unitPriceCents: 1000,
            createdAt: new Date(),
            updatedAt: new Date(),
            product: mockProduct as any,
          },
        ],
      };

      // Mock prisma at module level
      const mockPrisma = {
        cartItem: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'item-1',
            cart: cartWithItem,
          }),
        },
      };
      
      // Use dynamic import to avoid hoisting issues
      const prismaModule = await import('@/lib/prisma');
      vi.spyOn(prismaModule, 'prisma', 'get').mockReturnValue(mockPrisma as any);
      
      vi.mocked(mockCartRepository.removeItem).mockResolvedValue(undefined);
      vi.mocked(mockCartRepository.findById).mockResolvedValue({
        ...mockCart,
        items: [],
      });

      await cartService.updateItemQuantity('item-1', 0);

      expect(mockCartRepository.removeItem).toHaveBeenCalledWith('item-1');
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      const cartWithItem: CartWithItems = {
        ...mockCart,
        items: [
          {
            id: 'item-1',
            cartId: 'cart-1',
            productId: 'product-1',
            quantity: 1,
            unitPriceCents: 1000,
            createdAt: new Date(),
            updatedAt: new Date(),
            product: mockProduct as any,
          },
        ],
      };

      // Mock prisma for getCartByItemId
      const mockPrisma = {
        cartItem: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'item-1',
            cart: cartWithItem,
          }),
        },
      };
      
      const prismaModule = await import('@/lib/prisma');
      vi.spyOn(prismaModule, 'prisma', 'get').mockReturnValue(mockPrisma as any);

      const updatedCart: CartWithItems = { ...mockCart, items: [] };
      vi.mocked(mockCartRepository.removeItem).mockResolvedValue(undefined);
      vi.mocked(mockCartRepository.findById).mockResolvedValue(updatedCart);

      const result = await cartService.removeItem('item-1');

      expect(result).toEqual(updatedCart);
      expect(mockCartRepository.removeItem).toHaveBeenCalledWith('item-1');
    });

    it('should throw NotFoundError when cart item not found', async () => {
      const mockPrisma = {
        cartItem: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      };
      
      const prismaModule = await import('@/lib/prisma');
      vi.spyOn(prismaModule, 'prisma', 'get').mockReturnValue(mockPrisma as any);

      await expect(
        cartService.removeItem('non-existent-item')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when cart not found after removing item', async () => {
      const cartWithItem: CartWithItems = {
        ...mockCart,
        items: [
          {
            id: 'item-1',
            cartId: 'cart-1',
            productId: 'product-1',
            quantity: 1,
            unitPriceCents: 1000,
            createdAt: new Date(),
            updatedAt: new Date(),
            product: mockProduct as any,
          },
        ],
      };

      const mockPrisma = {
        cartItem: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'item-1',
            cart: cartWithItem,
          }),
        },
      };
      
      const prismaModule = await import('@/lib/prisma');
      vi.spyOn(prismaModule, 'prisma', 'get').mockReturnValue(mockPrisma as any);

      vi.mocked(mockCartRepository.removeItem).mockResolvedValue(undefined);
      vi.mocked(mockCartRepository.findById).mockResolvedValue(null);

      await expect(
        cartService.removeItem('item-1')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('clearCart', () => {
    it('should clear cart when cart exists', async () => {
      const identifier: CartIdentifier = { orgId: 'org-1', sessionId: 'session-1' };
      vi.mocked(mockCartRepository.findByIdentifier).mockResolvedValue(mockCart);
      vi.mocked(mockCartRepository.clearCart).mockResolvedValue(undefined);

      await cartService.clearCart(identifier);

      expect(mockCartRepository.clearCart).toHaveBeenCalledWith('cart-1');
    });

    it('should not throw error when cart does not exist', async () => {
      const identifier: CartIdentifier = { orgId: 'org-1', sessionId: 'session-1' };
      vi.mocked(mockCartRepository.findByIdentifier).mockResolvedValue(null);

      await expect(cartService.clearCart(identifier)).resolves.not.toThrow();
    });
  });

  describe('calculateTotals', () => {
    it('should calculate subtotal and item count', () => {
      const cartWithItems: CartWithItems = {
        ...mockCart,
        items: [
          {
            id: 'item-1',
            cartId: 'cart-1',
            productId: 'product-1',
            quantity: 2,
            unitPriceCents: 1000,
            createdAt: new Date(),
            updatedAt: new Date(),
            product: mockProduct as any,
          },
          {
            id: 'item-2',
            cartId: 'cart-1',
            productId: 'product-2',
            quantity: 3,
            unitPriceCents: 2000,
            createdAt: new Date(),
            updatedAt: new Date(),
            product: mockProduct as any,
          },
        ],
      };

      const totals = cartService.calculateTotals(cartWithItems);

      expect(totals.subtotalCents).toBe(8000); // (2 * 1000) + (3 * 2000)
      expect(totals.itemCount).toBe(5); // 2 + 3
    });

    it('should return zeros for empty cart', () => {
      const totals = cartService.calculateTotals(mockCart);

      expect(totals.subtotalCents).toBe(0);
      expect(totals.itemCount).toBe(0);
    });
  });

  describe('createCartService factory', () => {
    it('should create service with provided repositories', () => {
      const service = createCartService(mockCartRepository, mockProductRepository);

      expect(service).toBeInstanceOf(CartService);
    });

    it('should create service with default repositories', () => {
      const service = createCartService();

      expect(service).toBeInstanceOf(CartService);
    });
  });
});

