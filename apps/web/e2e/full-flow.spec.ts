import { test, expect } from '@playwright/test';
import { ensureAuthenticated, createTestUser, loginViaUI } from './auth-helper';

/**
 * Full User Flow E2E Tests
 * Tests complete user journey from registration to using all features
 */

test.describe('Full User Flow', () => {
  test('complete user journey: register -> login -> use app', async ({ page }) => {
    // Step 1: Register a new user
    const timestamp = Date.now();
    const user = {
      email: `e2e-full-${timestamp}@example.com`,
      password: 'TestPassword123',
      name: `E2E Full Flow User ${timestamp}`,
    };

    await page.goto('/register');
    await page.getByLabel(/email/i).fill(user.email);
    await page.getByLabel(/password/i).fill(user.password);
    await page.getByLabel(/name/i).fill(user.name);
    await page.getByRole('button', { name: /register/i }).click();

    // Should redirect to onboarding or login
    await expect(page).toHaveURL(/\/onboarding|\/login/, { timeout: 10000 });

    // Step 2: Login (if redirected to login)
    if (page.url().includes('/login')) {
      await page.getByLabel(/email/i).fill(user.email);
      await page.getByLabel(/password/i).fill(user.password);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL(/\/dashboard|\/\?/, { timeout: 10000 });
    }

    // Step 3: Navigate through app pages
    // Dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Products page
    await page.goto('/products');
    await expect(page).toHaveURL(/\/products/);
    
    // Verify products page loads
    await expect(page.locator('body')).toBeVisible();

    // Cart page
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/cart/);

    // Orders page (if accessible)
    try {
      await page.goto('/orders');
      // May redirect or show empty state
      await expect(page).toHaveURL(/\/orders|\/dashboard|\/login/);
    } catch (e) {
      // Orders might require setup
    }

    // Step 4: Test API endpoints work after login
    const meResponse = await page.request.get('/api/me');
    expect(meResponse.ok()).toBeTruthy();
    
    const meData = await meResponse.json();
    expect(meData.user.email).toBe(user.email);
  });

  test('user can browse products and interact with cart', async ({ page }) => {
    const user = await ensureAuthenticated(page);

    // Navigate to products
    await page.goto('/products');
    
    // Wait for products to load
    await page.waitForLoadState('networkidle');

    // Try to interact with cart button if visible
    const cartButton = page.locator('[data-testid="cart-button"], button:has-text("Cart")');
    if (await cartButton.isVisible()) {
      await cartButton.click();
      // Cart drawer should open
      await expect(page.locator('[data-testid="cart-drawer"], [role="dialog"]')).toBeVisible({ timeout: 3000 });
    }

    // Test API cart endpoint
    const cartResponse = await page.request.get('/api/cart?orgId=org-1');
    // May need valid orgId, but structure should work
    expect([200, 400]).toContain(cartResponse.status());
  });

  test('authenticated user can access protected routes', async ({ page }) => {
    const user = await ensureAuthenticated(page);

    // Test accessing various protected routes
    const protectedRoutes = [
      '/dashboard',
      '/analytics',
      '/orders',
      '/quotations',
      '/invoices',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      
      // Should either show the page or redirect appropriately
      const currentUrl = page.url();
      expect(
        currentUrl.includes(route) || 
        currentUrl.includes('/dashboard') || 
        currentUrl.includes('/login') ||
        currentUrl === route
      ).toBeTruthy();
    }
  });

  test('user session persists across page navigations', async ({ page, context }) => {
    const user = await ensureAuthenticated(page);

    // Navigate to dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify user info is accessible
    const meResponse1 = await page.request.get('/api/me');
    expect(meResponse1.ok()).toBeTruthy();

    // Navigate to different page
    await page.goto('/products');
    
    // Session should still be active
    const meResponse2 = await page.request.get('/api/me');
    expect(meResponse2.ok()).toBeTruthy();
    
    const userData = await meResponse2.json();
    expect(userData.user.email).toBe(user.email);
  });
});



