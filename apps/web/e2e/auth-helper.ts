import { Page } from '@playwright/test';

/**
 * Authentication Helper for E2E Tests
 * Provides utilities to authenticate users in tests
 */

export interface TestUser {
  email: string;
  password: string;
  name?: string;
}

/**
 * Create a test user via API registration
 */
export async function createTestUser(page: Page): Promise<TestUser> {
  const timestamp = Date.now();
  const user: TestUser = {
    email: `e2e-${timestamp}@example.com`,
    password: 'TestPassword123',
    name: `E2E Test User ${timestamp}`,
  };

  // Register user via API
  const response = await page.request.post('/api/auth/register', {
    data: {
      email: user.email,
      password: user.password,
      name: user.name,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create test user: ${response.status()}`);
  }

  return user;
}

/**
 * Login user via UI
 */
export async function loginViaUI(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait for successful login (redirect to dashboard or homepage)
  await page.waitForURL(/\/dashboard|\/\?/, { timeout: 10000 });
}

/**
 * Login user via API and set session cookie
 */
export async function loginViaAPI(page: Page, user: TestUser): Promise<void> {
  // Try to authenticate via API
  // Note: This depends on your auth implementation
  const response = await page.request.post('/api/auth/callback/credentials', {
    data: {
      email: user.email,
      password: user.password,
      redirect: false,
    },
  });

  // If auth uses cookies, they'll be set automatically by Playwright
  // If using tokens, you may need to store them in localStorage
  if (!response.ok() && response.status() !== 200) {
    // Fallback to UI login
    await loginViaUI(page, user);
  }
}

/**
 * Ensure user is authenticated, creating and logging in if needed
 */
export async function ensureAuthenticated(page: Page, existingUser?: TestUser): Promise<TestUser> {
  let user = existingUser;

  if (!user) {
    user = await createTestUser(page);
  }

  // Check if already logged in by checking for auth indicators
  const isLoggedIn = await page.locator('[data-testid="user-menu"], [data-testid="nav-user"]').count() > 0
    || page.url().includes('/dashboard')
    || page.url().includes('/login') === false;

  if (!isLoggedIn) {
    await loginViaUI(page, user);
  }

  return user;
}



