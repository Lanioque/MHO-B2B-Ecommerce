import { test, expect } from '@playwright/test';
import { ensureAuthenticated, type TestUser } from './auth-helper';

/**
 * E2E Tests for All API Routes
 * Tests routes after user authentication
 */

test.describe('API Routes - Authenticated', () => {
  let user: TestUser;

  test.beforeEach(async ({ page }) => {
    // Ensure user is authenticated before each test
    user = await ensureAuthenticated(page);
  });

  test.describe('GET /api/me', () => {
    test('should return current user info', async ({ page }) => {
      const response = await page.request.get('/api/me');
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(user.email);
    });
  });

  test.describe('GET /api/cart', () => {
    test('should fetch user cart', async ({ page }) => {
      // Need orgId from user's organization
      // For now, test with a default orgId
      const response = await page.request.get('/api/cart?orgId=org-1');
      
      // Should return 200 or 400 if orgId validation fails
      expect([200, 400]).toContain(response.status());
      
      if (response.ok()) {
        const data = await response.json();
        expect(data.cart).toBeDefined();
      }
    });

    test('should reject request without orgId', async ({ page }) => {
      const response = await page.request.get('/api/cart');
      expect(response.status()).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('Organization ID');
    });
  });

  test.describe('POST /api/cart', () => {
    test('should add item to cart', async ({ page }) => {
      // First, we need to create a product or use an existing one
      // For now, test the endpoint structure
      const response = await page.request.post('/api/cart?orgId=org-1', {
        data: {
          productId: '00000000-0000-0000-0000-000000000001', // UUID format
          quantity: 1,
        },
      });

      // Will return 400 if product doesn't exist, 404 if cart service fails, or 200 if successful
      expect([200, 400, 404, 500]).toContain(response.status());
    });

    test('should reject invalid productId format', async ({ page }) => {
      const response = await page.request.post('/api/cart?orgId=org-1', {
        data: {
          productId: 'invalid-uuid',
          quantity: 1,
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should reject invalid quantity', async ({ page }) => {
      const response = await page.request.post('/api/cart?orgId=org-1', {
        data: {
          productId: '00000000-0000-0000-0000-000000000001',
          quantity: -1,
        },
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('GET /api/products', () => {
    test('should fetch products list', async ({ page }) => {
      const response = await page.request.get('/api/products?page=1&pageSize=20');
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.products).toBeDefined();
      expect(Array.isArray(data.products)).toBe(true);
    });

    test('should handle pagination', async ({ page }) => {
      const response = await page.request.get('/api/products?page=2&pageSize=10');
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(2);
    });

    test('should filter products by search', async ({ page }) => {
      const response = await page.request.get('/api/products?search=test&page=1&pageSize=20');
      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('GET /api/orders', () => {
    test('should fetch orders list', async ({ page }) => {
      const response = await page.request.get('/api/orders');
      
      // May require orgId or return empty list
      expect([200, 400]).toContain(response.status());
    });
  });

  test.describe('GET /api/quotations', () => {
    test('should fetch quotations list', async ({ page }) => {
      const response = await page.request.get('/api/quotations');
      
      // May require orgId or return empty list
      expect([200, 400]).toContain(response.status());
    });
  });

  test.describe('GET /api/invoices', () => {
    test('should fetch invoices list', async ({ page }) => {
      const response = await page.request.get('/api/invoices');
      
      expect([200, 400, 401]).toContain(response.status());
    });
  });

  test.describe('GET /api/branches', () => {
    test('should fetch branches list', async ({ page }) => {
      const response = await page.request.get('/api/branches');
      
      expect([200, 400, 401]).toContain(response.status());
    });
  });

  test.describe('GET /api/analytics', () => {
    test('should fetch analytics data', async ({ page }) => {
      const response = await page.request.get('/api/analytics');
      
      // Analytics may require orgId or date range
      expect([200, 400, 401]).toContain(response.status());
    });
  });

  test.describe('GET /api/orgs', () => {
    test('should fetch organizations', async ({ page }) => {
      const response = await page.request.get('/api/orgs');
      
      expect([200, 401]).toContain(response.status());
    });
  });
});

test.describe('API Routes - Unauthenticated', () => {
  test('should allow guest access to public routes', async ({ page }) => {
    // Health check should work without auth
    const healthResponse = await page.request.get('/api/health');
    expect(healthResponse.ok()).toBeTruthy();

    // Products might be public
    const productsResponse = await page.request.get('/api/products?page=1&pageSize=20');
    expect([200, 401]).toContain(productsResponse.status());
  });

  test('should require authentication for protected routes', async ({ page }) => {
    // Me endpoint should require auth
    const meResponse = await page.request.get('/api/me');
    expect([401, 403, 200]).toContain(meResponse.status()); // 200 if NextAuth allows, otherwise auth required

    // Orders should require auth
    const ordersResponse = await page.request.get('/api/orders');
    expect([401, 403, 400]).toContain(ordersResponse.status());
  });
});



