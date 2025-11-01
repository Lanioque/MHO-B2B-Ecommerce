# E2E Tests with Playwright

This directory contains end-to-end tests that test the full application flow including authentication and all routes.

## Running Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run tests in headed mode (see browser)
pnpm playwright test --headed

# Run specific test file
pnpm playwright test e2e/routes.spec.ts

# Run tests in debug mode
pnpm playwright test --debug
```

## Test Structure

- `auth.spec.ts` - Authentication flow tests (register, login)
- `routes.spec.ts` - Tests all API routes with authenticated user
- `full-flow.spec.ts` - Complete user journey tests
- `auth-helper.ts` - Helper utilities for authentication in tests

## Prerequisites

1. Make sure the development server is running or configure `webServer` in `playwright.config.ts`
2. Database should be set up and accessible
3. Environment variables should be configured

## Test Coverage

The E2E tests cover:
- User registration and login
- All API routes with authentication
- Full user flows through the application
- Protected route access
- Session persistence

## Configuration

See `playwright.config.ts` for configuration options including:
- Base URL
- Browser configuration
- Retry settings
- Screenshots and traces



