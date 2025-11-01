import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartRepository, getCartRepository } from './cart-repository';
import type { CartIdentifier, AddItemData } from '@/lib/domain/interfaces/ICartRepository';
import type { CartWithItems } from '@/lib/domain/interfaces/ICartRepository';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    cart: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    cartItem: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('CartRepository', () => {
  let cartRepository: CartRepository;
  let mockPrisma: any;

  beforeEach(async () => {
    const { prisma } = await import('@/lib/prisma');
    mockPrisma = prisma;
  });

  const mockCart: CartWithItems = {
    id: 'cart-1',
    orgId: 'org-1',
    branchId: null,
    userId: 'user-1',
    sessionId: null,
    currency: 'USD',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    cartRepository = new CartRepository();
    const { prisma } = await import('@/lib/prisma');
    mockPrisma = prisma as any;
  });

  describe('findByIdentifier', () => {
    it('should find cart by userId', async () => {
      const identifier: CartIdentifier = { orgId: 'org-1', userId: 'user-1' };
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart);

      const result = await cartRepository.findByIdentifier(identifier);

      expect(result).toEqual(mockCart);
      expect(mockPrisma.cart.findFirst).toHaveBeenCalledWith({
        where: {
          orgId: 'org-1',
          status: 'active',
          branchId: null,
          userId: 'user-1',
        },
        include: expect.any(Object),
      });
    });

    it('should find cart by sessionId', async () => {
      const identifier: CartIdentifier = { orgId: 'org-1', sessionId: 'session-1' };
      const sessionCart = { ...mockCart, userId: null, sessionId: 'session-1' };
      mockPrisma.cart.findFirst.mockResolvedValue(sessionCart);

      const result = await cartRepository.findByIdentifier(identifier);

      expect(result).toEqual(sessionCart);
      expect(mockPrisma.cart.findFirst).toHaveBeenCalledWith({
        where: {
          orgId: 'org-1',
          status: 'active',
          branchId: null,
          sessionId: 'session-1',
          userId: null,
        },
        include: expect.any(Object),
      });
    });

    it('should find cart with branchId', async () => {
      const identifier: CartIdentifier = { orgId: 'org-1', userId: 'user-1', branchId: 'branch-1' };
      const branchCart = { ...mockCart, branchId: 'branch-1' };
      mockPrisma.cart.findFirst.mockResolvedValue(branchCart);

      const result = await cartRepository.findByIdentifier(identifier);

      expect(result).toEqual(branchCart);
      expect(mockPrisma.cart.findFirst).toHaveBeenCalledWith({
        where: {
          orgId: 'org-1',
          status: 'active',
          branchId: 'branch-1',
          userId: 'user-1',
        },
        include: expect.any(Object),
      });
    });

    it('should return null when no userId or sessionId provided', async () => {
      const identifier: CartIdentifier = { orgId: 'org-1' };

      const result = await cartRepository.findByIdentifier(identifier);

      expect(result).toBeNull();
    });

    it('should return null when cart not found', async () => {
      const identifier: CartIdentifier = { orgId: 'org-1', userId: 'user-1' };
      mockPrisma.cart.findFirst.mockResolvedValue(null);

      const result = await cartRepository.findByIdentifier(identifier);

      expect(result).toBeNull();
    });
  });

  describe('getOrCreate', () => {
    it('should return existing cart when found', async () => {
      const identifier: CartIdentifier = { orgId: 'org-1', userId: 'user-1' };
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart);

      const result = await cartRepository.getOrCreate(identifier);

      expect(result).toEqual(mockCart);
      expect(mockPrisma.cart.create).not.toHaveBeenCalled();
    });

    it('should create new cart for userId when not found', async () => {
      const identifier: CartIdentifier = { orgId: 'org-1', userId: 'user-1' };
      mockPrisma.cart.findFirst.mockResolvedValue(null);
      mockPrisma.cart.create.mockResolvedValue(mockCart);

      const result = await cartRepository.getOrCreate(identifier);

      expect(result).toEqual(mockCart);
      expect(mockPrisma.cart.create).toHaveBeenCalledWith({
        data: {
          orgId: 'org-1',
          status: 'active',
          userId: 'user-1',
        },
        include: expect.any(Object),
      });
    });

    it('should create new cart for sessionId when not found', async () => {
      const identifier: CartIdentifier = { orgId: 'org-1', sessionId: 'session-1' };
      const sessionCart = { ...mockCart, userId: null, sessionId: 'session-1' };
      mockPrisma.cart.findFirst.mockResolvedValue(null);
      mockPrisma.cart.create.mockResolvedValue(sessionCart);

      const result = await cartRepository.getOrCreate(identifier);

      expect(result).toEqual(sessionCart);
      expect(mockPrisma.cart.create).toHaveBeenCalledWith({
        data: {
          orgId: 'org-1',
          status: 'active',
          sessionId: 'session-1',
        },
        include: expect.any(Object),
      });
    });

    it('should create cart with branchId', async () => {
      const identifier: CartIdentifier = { orgId: 'org-1', userId: 'user-1', branchId: 'branch-1' };
      const branchCart = { ...mockCart, branchId: 'branch-1' };
      mockPrisma.cart.findFirst.mockResolvedValue(null);
      mockPrisma.cart.create.mockResolvedValue(branchCart);

      const result = await cartRepository.getOrCreate(identifier);

      expect(result).toEqual(branchCart);
      expect(mockPrisma.cart.create).toHaveBeenCalledWith({
        data: {
          orgId: 'org-1',
          status: 'active',
          branchId: 'branch-1',
          userId: 'user-1',
        },
        include: expect.any(Object),
      });
    });
  });

  describe('addItem', () => {
    it('should create new item when item does not exist', async () => {
      const data: AddItemData = {
        productId: 'product-1',
        quantity: 2,
        unitPriceCents: 1000,
      };
      mockPrisma.cartItem.findFirst.mockResolvedValue(null);
      mockPrisma.cartItem.create.mockResolvedValue({ id: 'item-1' });
      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);

      const result = await cartRepository.addItem('cart-1', data);

      expect(result).toEqual(mockCart);
      expect(mockPrisma.cartItem.create).toHaveBeenCalledWith({
        data: {
          cartId: 'cart-1',
          productId: 'product-1',
          quantity: 2,
          unitPriceCents: 1000,
        },
      });
    });

    it('should update existing item quantity when item exists', async () => {
      const data: AddItemData = {
        productId: 'product-1',
        quantity: 3,
        unitPriceCents: 1000,
      };
      const existingItem = {
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 2,
        unitPriceCents: 1000,
      };
      mockPrisma.cartItem.findFirst.mockResolvedValue(existingItem);
      mockPrisma.cartItem.update.mockResolvedValue(existingItem);
      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);

      const result = await cartRepository.addItem('cart-1', data);

      expect(result).toEqual(mockCart);
      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: {
          quantity: 5, // 2 + 3
          unitPriceCents: 1000,
        },
      });
    });
  });

  describe('updateItemQuantity', () => {
    it('should update item quantity', async () => {
      const updatedItem = {
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 5,
        unitPriceCents: 1000,
        cart: mockCart,
      };
      mockPrisma.cartItem.update.mockResolvedValue(updatedItem);

      const result = await cartRepository.updateItemQuantity('item-1', 5);

      expect(result).toEqual(updatedItem);
      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { quantity: 5 },
        include: { cart: true },
      });
    });

    it('should remove item when quantity is 0 or negative', async () => {
      mockPrisma.cartItem.delete.mockResolvedValue(undefined);

      await expect(
        cartRepository.updateItemQuantity('item-1', 0)
      ).rejects.toThrow('Item removed');

      expect(mockPrisma.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
    });
  });

  describe('removeItem', () => {
    it('should delete cart item', async () => {
      mockPrisma.cartItem.delete.mockResolvedValue(undefined);

      await cartRepository.removeItem('item-1');

      expect(mockPrisma.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
    });
  });

  describe('clearCart', () => {
    it('should delete all items from cart', async () => {
      mockPrisma.cartItem.deleteMany.mockResolvedValue({ count: 5 });

      await cartRepository.clearCart('cart-1');

      expect(mockPrisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart-1' },
      });
    });
  });

  describe('deleteCart', () => {
    it('should clear cart items and delete cart', async () => {
      mockPrisma.cartItem.deleteMany.mockResolvedValue({ count: 5 });
      mockPrisma.cart.delete.mockResolvedValue(mockCart);

      await cartRepository.deleteCart('cart-1');

      expect(mockPrisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart-1' },
      });
      expect(mockPrisma.cart.delete).toHaveBeenCalledWith({
        where: { id: 'cart-1' },
      });
    });
  });

  describe('findById', () => {
    it('should find cart by id', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);

      const result = await cartRepository.findById('cart-1');

      expect(result).toEqual(mockCart);
      expect(mockPrisma.cart.findUnique).toHaveBeenCalledWith({
        where: { id: 'cart-1' },
        include: expect.any(Object),
      });
    });

    it('should return null when cart not found', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(null);

      const result = await cartRepository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getCartRepository factory', () => {
    it('should return CartRepository instance', () => {
      const repository = getCartRepository();

      expect(repository).toBeInstanceOf(CartRepository);
    });
  });
});

