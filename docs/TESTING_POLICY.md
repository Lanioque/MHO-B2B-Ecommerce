# Testing Policy

## Table of Contents
1. [Overview](#overview)
2. [Testing Philosophy](#testing-philosophy)
3. [Testing Levels](#testing-levels)
4. [Testing Tools & Frameworks](#testing-tools--frameworks)
5. [Code Coverage Requirements](#code-coverage-requirements)
6. [Testing Standards](#testing-standards)
7. [Test Organization](#test-organization)
8. [Testing Guidelines by Component Type](#testing-guidelines-by-component-type)
9. [Mocking & Test Data](#mocking--test-data)
10. [CI/CD Integration](#cicd-integration)
11. [Best Practices](#best-practices)
12. [Testing Checklist](#testing-checklist)

## Overview

This document defines the testing policy for the MHO B2B E-commerce Platform. All code contributions must follow these guidelines to ensure code quality, reliability, and maintainability.

**Key Principles:**
- Tests are first-class citizens alongside source code
- All new features must include appropriate tests
- Tests must be fast, reliable, and maintainable
- Test coverage is measured and maintained
- Tests serve as living documentation

## Testing Philosophy

### Testing Pyramid

```
        /\
       /  \      E2E Tests (Few)
      /----\
     /      \    Integration Tests (Some)
    /--------\
   /          \  Unit Tests (Many)
  /------------\
```

1. **Unit Tests (70%)** - Fast, isolated tests for individual functions/classes
2. **Integration Tests (20%)** - Test interactions between components
3. **E2E Tests (10%)** - Test complete user workflows

### Test-Driven Development (TDD)

- **Recommended** for critical business logic
- Write failing test → Implement → Refactor
- Not required for UI components (component-first approach acceptable)

### Behavior-Driven Development (BDD)

- Use for user-facing features and API endpoints
- Describe behavior in natural language
- Makes tests readable as documentation

## Testing Levels

### 1. Unit Tests

**Purpose:** Test individual functions, methods, and classes in isolation.

**Scope:**
- Service layer methods
- Utility functions
- Business logic
- Helper functions
- Pure functions

**Requirements:**
- Fast execution (< 10ms per test)
- No external dependencies (database, API calls)
- Mock all external services
- Test edge cases and error conditions
- Aim for 100% coverage of critical paths

**Example:**
```typescript
// lib/services/auth-service.test.ts
describe('AuthService', () => {
  describe('registerUser', () => {
    it('should throw ConflictError when user already exists', async () => {
      const mockRepo = {
        findByEmail: jest.fn().mockResolvedValue({ id: '1', email: 'test@example.com' })
      };
      const service = new AuthService(mockRepo);
      
      await expect(
        service.registerUser({ email: 'test@example.com', password: 'password' })
      ).rejects.toThrow(ConflictError);
    });

    it('should hash password before storing', async () => {
      // Test implementation
    });
  });
});
```

### 2. Integration Tests

**Purpose:** Test interactions between multiple components/systems.

**Scope:**
- API routes (Next.js route handlers)
- Repository implementations with database
- Service layer with repositories
- External API integrations (Zoho)
- Transaction handling (Unit of Work)

**Requirements:**
- Use test database (separate from dev/staging)
- Clean up test data after each test
- Test real database operations
- Mock external APIs (Zoho, payment gateways)
- Test error scenarios and rollbacks

**Example:**
```typescript
// app/api/auth/register/route.test.ts
describe('POST /api/auth/register', () => {
  beforeEach(async () => {
    await cleanTestDatabase();
  });

  it('should create user and return 201', async () => {
    const response = await POST(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'SecurePass123',
          name: 'Test User'
        })
      })
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.user.email).toBe('newuser@example.com');
    expect(data.user.password).toBeUndefined();
  });
});
```

### 3. End-to-End (E2E) Tests

**Purpose:** Test complete user workflows from user perspective.

**Scope:**
- Critical user journeys
- Complete business processes
- Cross-browser compatibility
- Performance benchmarks
- Accessibility testing

**Requirements:**
- Use real browser automation (Playwright/Cypress)
- Test against staging environment
- Include happy paths and common error scenarios
- Keep tests independent and isolated
- Use realistic test data

**Example:**
```typescript
// e2e/order-flow.spec.ts
test('complete order flow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'customer@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Browse products
  await page.goto('/products');
  await page.click('[data-testid="product-card-1"]');
  await page.click('button:has-text("Add to Cart")');

  // Checkout
  await page.goto('/checkout');
  await page.selectOption('[name="branchId"]', 'branch-1');
  await page.click('button:has-text("Place Order")');

  // Verify order created
  await expect(page.locator('[data-testid="order-success"]')).toBeVisible();
});
```

## Testing Tools & Frameworks

### Recommended Stack

#### Unit & Integration Testing
- **Framework:** [Vitest](https://vitest.dev/) (fast, Vite-native, Jest-compatible)
- **Assertions:** Vitest built-in (compatible with Jest)
- **Mocking:** Vitest mocks + MSW for API mocking
- **Coverage:** `@vitest/coverage-v8` (c8/istanbul)

#### E2E Testing
- **Framework:** [Playwright](https://playwright.dev/) (modern, reliable, fast)
- **Alternative:** Cypress (if team preference)

#### API Testing
- **MSW (Mock Service Worker)** for mocking HTTP requests
- **supertest** for Express-like API testing (if needed)

#### Component Testing
- **React Testing Library** for component tests
- **Vitest** as test runner

### Installation

```bash
# Unit & Integration Testing
pnpm add -D vitest @vitest/ui @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom

# E2E Testing
pnpm add -D @playwright/test

# API Mocking
pnpm add -D msw

# Test utilities
pnpm add -D @types/node @testing-library/user-event
```

### Configuration

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '**/*.config.{ts,js}',
        '**/dist/**',
        '**/.next/**',
        '**/coverage/**',
        '**/prisma/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/web'),
    },
  },
});
```

**playwright.config.ts:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.TEST_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Code Coverage Requirements

### Minimum Coverage Thresholds

| Component Type | Lines | Functions | Branches | Statements |
|---------------|-------|-----------|----------|------------|
| Services | 90% | 90% | 85% | 90% |
| Repositories | 85% | 85% | 80% | 85% |
| API Routes | 80% | 80% | 75% | 80% |
| Utilities | 95% | 95% | 90% | 95% |
| Components | 70% | 70% | 65% | 70% |
| Hooks | 80% | 80% | 75% | 80% |
| **Overall** | **80%** | **80%** | **75%** | **80%** |

### Coverage Exclusions

The following are excluded from coverage requirements:
- Type definitions (`*.d.ts`)
- Configuration files
- Migration scripts
- Seed scripts
- Generated code
- Test files themselves

### Coverage Reports

- Coverage reports generated on every test run
- HTML coverage reports in `coverage/` directory
- Coverage badges in CI/CD pipeline
- Coverage tracked per PR

## Testing Standards

### Naming Conventions

**Test Files:**
- Unit/Integration: `*.test.ts` or `*.test.tsx`
- E2E: `*.spec.ts` (Playwright convention)
- Co-located: Next to source file or in `__tests__/` directory

**Test Structure:**
```typescript
describe('ComponentName', () => {
  describe('methodName or feature', () => {
    it('should do something specific', () => {
      // Test implementation
    });
  });
});
```

**Naming Pattern:**
- Test descriptions: "should [expected behavior] when [condition]"
- Example: `it('should throw error when user is not found', ...)`
- Use descriptive names that read like documentation

### Test Organization

```
apps/web/
├── lib/
│   ├── services/
│   │   ├── auth-service.ts
│   │   └── auth-service.test.ts          # Co-located
│   └── utils/
│       ├── utils.ts
│       └── __tests__/
│           └── utils.test.ts             # __tests__ folder
├── app/
│   └── api/
│       └── auth/
│           └── register/
│               ├── route.ts
│               └── route.test.ts         # Co-located
├── components/
│   └── ui/
│       ├── button.tsx
│       └── __tests__/
│           └── button.test.tsx
└── e2e/                                   # E2E tests separate
    ├── order-flow.spec.ts
    └── auth-flow.spec.ts
```

### Test Structure (AAA Pattern)

```typescript
describe('FeatureName', () => {
  it('should behave correctly', () => {
    // Arrange - Set up test data and dependencies
    const mockData = { id: '1', name: 'Test' };
    const mockService = createMockService();

    // Act - Execute the code under test
    const result = feature.doSomething(mockData);

    // Assert - Verify the outcome
    expect(result).toEqual(expected);
    expect(mockService.method).toHaveBeenCalledWith(mockData);
  });
});
```

## Testing Guidelines by Component Type

### Service Layer

**Focus:**
- Business logic validation
- Error handling
- Input validation
- Edge cases

**Example:**
```typescript
describe('OrderService', () => {
  describe('createOrder', () => {
    it('should create order with valid data', async () => {
      // Test happy path
    });

    it('should throw error when cart is empty', async () => {
      // Test validation
    });

    it('should calculate total correctly', async () => {
      // Test business logic
    });

    it('should rollback on repository error', async () => {
      // Test error handling
    });
  });
});
```

### Repository Layer

**Focus:**
- Database queries
- Data transformation
- Error handling
- Transaction handling

**Note:** Use test database, not mocks for repositories

**Example:**
```typescript
describe('OrderRepository', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTestData();
  });

  it('should find orders by orgId', async () => {
    const orders = await repository.findByOrgId('org-1');
    expect(orders).toHaveLength(2);
  });
});
```

### API Routes (Next.js Route Handlers)

**Focus:**
- Request validation
- Authentication/Authorization
- Response format
- Error responses
- Status codes

**Example:**
```typescript
describe('POST /api/orders', () => {
  it('should return 401 when not authenticated', async () => {
    const response = await POST(new Request('...'));
    expect(response.status).toBe(401);
  });

  it('should create order for authenticated user', async () => {
    const session = await createTestSession();
    const response = await POST(/* ... with auth */);
    expect(response.status).toBe(201);
  });

  it('should validate request body', async () => {
    const response = await POST(/* invalid body */);
    expect(response.status).toBe(400);
  });
});
```

### React Components

**Focus:**
- Rendering
- User interactions
- Props handling
- Conditional rendering
- Accessibility

**Example:**
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ProductCard', () => {
  it('should render product information', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
  });

  it('should call onAddToCart when button clicked', async () => {
    const onAddToCart = vi.fn();
    render(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />);
    
    await userEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    expect(onAddToCart).toHaveBeenCalledWith(mockProduct.id);
  });
});
```

### Custom Hooks

**Focus:**
- State management
- Side effects
- Return values
- Error states

**Example:**
```typescript
import { renderHook, waitFor } from '@testing-library/react';

describe('useCart', () => {
  it('should return cart data', async () => {
    const { result } = renderHook(() => useCart());
    await waitFor(() => {
      expect(result.current.cart).toBeDefined();
    });
  });
});
```

## Mocking & Test Data

### Mocking Strategy

1. **External APIs** - Always mock (Zoho, Payment Gateways)
2. **Database** - Use test database for integration tests
3. **Time/Date** - Mock for deterministic tests
4. **Random values** - Use fixed seeds
5. **File system** - Mock for unit tests
6. **Next.js modules** - Mock router, session, etc.

### Mock Service Worker (MSW)

For API mocking:

```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/products', () => {
    return HttpResponse.json({
      success: true,
      products: [/* mock products */]
    });
  }),
];
```

### Test Data Factory

Create reusable test data factories:

```typescript
// test-utils/factories.ts
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides,
});

export const createMockOrder = (overrides?: Partial<Order>): Order => ({
  id: 'order-1',
  number: 'ORD-001',
  totalCents: 10000,
  status: 'PENDING',
  ...overrides,
});
```

### Database Seeding

```typescript
// test-utils/seed.ts
export async function seedTestDatabase() {
  await prisma.organization.create({
    data: {
      id: 'test-org-1',
      name: 'Test Organization',
      // ... other fields
    },
  });
}

export async function cleanTestDatabase() {
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.organization.deleteMany(),
  ]);
}
```

## CI/CD Integration

### Pre-commit Hooks

Use Husky + lint-staged:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "vitest --run related"
    ]
  }
}
```

### CI Pipeline

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: pnpm install
      - run: pnpm test:unit
      - run: pnpm test:integration
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3
```

### Test Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --reporter=verbose",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:watch": "vitest watch"
  }
}
```

## Best Practices

### DO ✅

- Write tests that are easy to understand and maintain
- Test behavior, not implementation details
- Use descriptive test names
- Keep tests independent (no shared state between tests)
- Clean up after tests (especially database tests)
- Mock external dependencies
- Test edge cases and error scenarios
- Keep tests fast (< 100ms for unit tests)
- Use test data factories
- Write tests before fixing bugs (regression tests)

### DON'T ❌

- Don't test framework code (React, Next.js internals)
- Don't write tests that are too complex
- Don't use real API keys or credentials in tests
- Don't test implementation details
- Don't write flaky tests (non-deterministic)
- Don't skip cleanup in integration tests
- Don't test multiple concerns in one test
- Don't use `any` types in tests
- Don't commit tests with `.skip()` or `.only()`
- Don't test third-party library code

### Test Independence

Each test should:
- Set up its own data
- Not depend on other tests
- Not share mutable state
- Clean up after itself

```typescript
// ❌ BAD - Shared state
let user: User;
beforeAll(async () => {
  user = await createUser(); // Shared across all tests
});

// ✅ GOOD - Isolated state
beforeEach(async () => {
  await cleanDatabase();
  await seedTestData();
});
```

### Performance

- Unit tests: < 10ms each
- Integration tests: < 500ms each
- E2E tests: < 5s each
- Full test suite: < 5 minutes

## Testing Checklist

Before submitting code:

- [ ] Unit tests written for new business logic
- [ ] Integration tests for new API routes
- [ ] Component tests for new React components
- [ ] E2E tests for critical user flows
- [ ] Error cases covered
- [ ] Edge cases covered
- [ ] Test coverage meets thresholds
- [ ] All tests passing
- [ ] No flaky tests
- [ ] Tests are fast and maintainable
- [ ] Test data properly cleaned up
- [ ] Mocking used appropriately
- [ ] Tests read like documentation

## Code Review Checklist

When reviewing PRs:

- [ ] New features include appropriate tests
- [ ] Test coverage doesn't decrease
- [ ] Tests are well-written and maintainable
- [ ] Tests are not flaky
- [ ] Error scenarios are tested
- [ ] Test names are descriptive
- [ ] Test organization follows conventions
- [ ] No test code smells (complex setup, shared state, etc.)

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Questions?

For questions about testing policies or best practices, contact the development team or open a discussion in the repository.

---

**Last Updated:** 2024
**Policy Version:** 1.0



