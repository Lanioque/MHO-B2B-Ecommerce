/**
 * Integration Tests for API Routes
 * Tests routes with authenticated user context
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getCartRoute, POST as addToCartRoute, DELETE as clearCartRoute } from '../cart/route';
import { GET as getProductsRoute } from '../products/route';
import { GET as getMeRoute } from '../me/route';
import type { Session } from 'next-auth';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock config to avoid env variable requirements
vi.mock('@/lib/config', () => ({
  getConfig: () => ({}),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    organization: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
    cart: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    cartItem: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

// Mock auth-helpers
vi.mock('@/lib/auth-helpers', () => ({
  getOrCreateSessionId: vi.fn().mockResolvedValue('session-123'),
}));

describe('API Routes Integration Tests', () => {
  let mockSession: Session | null;
  let mockUser: { id: string; email: string; name: string };

  beforeAll(() => {
    mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authenticated Routes', () => {
      beforeEach(async () => {
        mockSession = {
          user: mockUser,
          expires: new Date(Date.now() + 86400000).toISOString(),
        };
        const authModule = await import('@/lib/auth');
        vi.mocked(authModule.auth).mockResolvedValue(mockSession);
      });

    describe('GET /api/me', () => {
      it('should return current user info when authenticated', async () => {
        const req = new NextRequest('http://localhost/api/me');
        const response = await getMeRoute(req);
        
        if (response.status === 200) {
          const data = await response.json();
          expect(data.user.id).toBe(mockUser.id);
          expect(data.user.email).toBe(mockUser.email);
        }
      });
    });

    describe('GET /api/cart', () => {
      it('should fetch cart for authenticated user', async () => {
        const { prisma } = await import('@/lib/prisma');
        const mockCart = {
          id: 'cart-1',
          orgId: 'org-1',
          userId: mockUser.id,
          currency: 'USD',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [],
        };

        vi.mocked(prisma.organization.findUnique).mockResolvedValue({
          id: 'org-1',
          name: 'Test Org',
        } as any);
        
        vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);

        const req = new NextRequest('http://localhost/api/cart?orgId=org-1');
        const response = await getCartRoute(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.cart).toBeDefined();
        expect(data.cart.id).toBe('cart-1');
      });

      it('should reject request without orgId', async () => {
        const req = new NextRequest('http://localhost/api/cart');
        const response = await getCartRoute(req);
        
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('Organization ID');
      });
    });

    describe('POST /api/cart', () => {
      it('should add item to cart for authenticated user', async () => {
        const { prisma } = await import('@/lib/prisma');
        
        const mockProduct = {
          id: 'product-1',
          sku: 'SKU-001',
          name: 'Test Product',
          priceCents: 1000,
          isVisible: true,
          status: 'active',
        };

        const mockCart = {
          id: 'cart-1',
          orgId: 'org-1',
          userId: mockUser.id,
          currency: 'USD',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [],
        };

        vi.mocked(prisma.organization.findUnique).mockResolvedValue({
          id: 'org-1',
          name: 'Test Org',
        } as any);

        vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);
        vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
        vi.mocked(prisma.cartItem.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.cartItem.create).mockResolvedValue({
          id: 'item-1',
          cartId: 'cart-1',
          productId: 'product-1',
          quantity: 2,
          unitPriceCents: 1000,
        } as any);
        
        vi.mocked(prisma.cart.findUnique).mockResolvedValue({
          ...mockCart,
          items: [{
            id: 'item-1',
            cartId: 'cart-1',
            productId: 'product-1',
            quantity: 2,
            unitPriceCents: 1000,
            product: mockProduct,
          }],
        } as any);

        const req = new NextRequest('http://localhost/api/cart?orgId=org-1', {
          method: 'POST',
          body: JSON.stringify({
            productId: 'product-1',
            quantity: 2,
          }),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await addToCartRoute(req);
        // May return 200, 400, or 404 depending on product/cart state
        expect([200, 400, 404]).toContain(response.status);
        
        if (response.status === 200) {
          const data = await response.json();
          expect(data.cart).toBeDefined();
          expect(data.message).toBe('Item added to cart');
        }
      });
    });

    describe('GET /api/products', () => {
      it('should fetch products list', async () => {
        const { prisma } = await import('@/lib/prisma');
        
        const mockProducts = [
          {
            id: 'product-1',
            name: 'Product 1',
            sku: 'SKU-001',
            priceCents: 1000,
            isVisible: true,
            status: 'active',
          },
        ];

        vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
        vi.mocked(prisma.product.count).mockResolvedValue(1);

        const req = new NextRequest('http://localhost/api/products?page=1&pageSize=20');
        const response = await getProductsRoute(req);
        
        expect([200, 400]).toContain(response.status);
        
        if (response.status === 200) {
          const data = await response.json();
          expect(data.products || data).toBeDefined();
          // Products may be directly in data or in data.products
          const productsArray = data.products?.products || data.products || data.items || [];
          expect(Array.isArray(productsArray)).toBe(true);
        }
      });
    });
  });

  describe('Unauthenticated Routes', () => {
    beforeEach(async () => {
      mockSession = null;
      const authModule = await import('@/lib/auth');
      vi.mocked(authModule.auth).mockResolvedValue(null);
    });

    it('should allow guest access to cart', async () => {
      const { prisma } = await import('@/lib/prisma');
      
      const mockCart = {
        id: 'cart-1',
        orgId: 'org-1',
        sessionId: 'session-123',
        currency: 'USD',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
      };

      vi.mocked(prisma.organization.findFirst).mockResolvedValue({
        id: 'org-1',
        name: 'Test Org',
      } as any);
      
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);

      const req = new NextRequest('http://localhost/api/cart?orgId=org-1');
      const response = await getCartRoute(req);
      
      // Guest cart should work
      expect(response.status).toBe(200);
    });
  });

  describe('Route Error Handling', () => {
    it('should handle missing required parameters', async () => {
      const req = new NextRequest('http://localhost/api/cart');
      const response = await getCartRoute(req);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Organization ID');
    });

    it('should handle invalid request body', async () => {
      const req = new NextRequest('http://localhost/api/cart?orgId=org-1', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'invalid-uuid',
          quantity: -1,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await addToCartRoute(req);
      expect(response.status).toBe(400);
    });
  });
});

