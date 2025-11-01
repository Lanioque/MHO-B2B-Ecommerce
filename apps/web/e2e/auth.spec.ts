import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Authentication
 * Tests the full login flow
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for error message
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 5000 });
  });

  test('should register a new user', async ({ page }) => {
    // Navigate to register page
    await page.goto('/register');
    
    const timestamp = Date.now();
    const testEmail = `e2e-${timestamp}@example.com`;
    const testPassword = 'TestPassword123';
    const testName = 'E2E Test User';

    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByLabel(/name/i).fill(testName);
    
    await page.getByRole('button', { name: /register/i }).click();

    // Should redirect to onboarding or login
    await expect(page).toHaveURL(/\/onboarding|\/login/, { timeout: 10000 });
  });

  test('should validate password requirements on registration', async ({ page }) => {
    await page.goto('/register');
    
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('weak'); // Too weak
    await page.getByRole('button', { name: /register/i }).click();

    // Should show validation error
    await expect(page.getByText(/password must contain/i)).toBeVisible({ timeout: 5000 });
  });

  test('should validate email format on registration', async ({ page }) => {
    await page.goto('/register');
    
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password/i).fill('Password123');
    await page.getByRole('button', { name: /register/i }).click();

    // Should show validation error
    await expect(page.getByText(/invalid email/i)).toBeVisible({ timeout: 5000 });
  });
});



