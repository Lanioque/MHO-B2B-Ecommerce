# MHO B2B E-commerce Platform - Development Rules & Guidelines

> **Last Updated:** November 2024  
> **Project:** MHO B2B E-commerce Platform  
> **Architecture:** Clean Architecture with Domain-Driven Design  
> **Framework:** Next.js 16 + React 19 + TypeScript + Prisma + Docker

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [SOLID Principles](#solid-principles)
4. [Law of Demeter](#law-of-demeter)
5. [Docker Development](#docker-development)
6. [Code Organization](#code-organization)
7. [Best Practices](#best-practices)
8. [Testing Requirements](#testing-requirements)
9. [Performance Guidelines](#performance-guidelines)
10. [Security Guidelines](#security-guidelines)

---

## Project Overview

### What is MHO?

MHO is a **B2B (Business-to-Business) E-commerce Platform** that provides:
- **Multi-tenant architecture** for organizations with multiple branches
- **Real-time Zoho Inventory integration** for product sync
- **Zoho Books integration** for sales orders and invoices
- **Shopping cart** with branch-specific ordering
- **Quotation management** with conversion to orders
- **Analytics dashboard** with financial insights
- **Role-based access control** (OWNER, ADMIN, STAFF, CUSTOMER)

### Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- React 19 with React Compiler
- TypeScript 5.0+
- Tailwind CSS 4
- Shadcn/Radix UI components
- Zustand for state management

**Backend:**
- Next.js API Routes (RESTful)
- Prisma ORM (PostgreSQL)
- Redis (Sessions & Caching)
- NextAuth.js (Authentication)

**Infrastructure:**
- Docker + Docker Compose
- PostgreSQL 16
- Redis 7
- pnpm (Package manager)

---

## Architecture Patterns

### Clean Architecture Layers

The codebase follows **Clean Architecture** with strict separation of concerns:

```
┌─────────────────────────────────────────┐
│        API Routes (Presentation)        │  ← Next.js API Routes
├─────────────────────────────────────────┤
│      Services (Application Layer)       │  ← Business logic
├─────────────────────────────────────────┤
│  Repositories (Infrastructure Layer)    │  ← Data access (Prisma)
├─────────────────────────────────────────┤
│   Domain Interfaces (Domain Layer)      │  ← Contracts & Types
└─────────────────────────────────────────┘
         PostgreSQL + Redis
```

### Layer Responsibilities

#### 1. API Routes (`apps/web/app/api/`)
**Purpose:** Handle HTTP requests, validate input, return responses

**Responsibilities:**
- Request validation (use Zod schemas)
- Authentication/authorization checks
- Call appropriate services
- Return properly formatted responses
- Handle errors with `withErrorHandler`

**Example Structure:**
```typescript
// app/api/orders/route.ts
import { withErrorHandler } from '@/lib/middleware/error-handler';
import { getOrderService } from '@/lib/services/order-service';
import { z } from 'zod';

const createOrderSchema = z.object({
  cartId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
});

async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const validated = createOrderSchema.parse(body);

  const orderService = getOrderService();
  const order = await orderService.createOrder({
    userId: session.user.id,
    ...validated,
  });

  return NextResponse.json({ order }, { status: 201 });
}

export const POST = withErrorHandler(POST);
```

**DO:**
✅ Validate all inputs with Zod  
✅ Use `withErrorHandler` for error handling  
✅ Return proper HTTP status codes  
✅ Keep controllers thin (delegate to services)

**DON'T:**
❌ Put business logic in API routes  
❌ Access Prisma directly  
❌ Return sensitive data without filtering  
❌ Skip authentication checks

---

#### 2. Services (`apps/web/lib/services/`)
**Purpose:** Implement business logic and orchestrate operations

**Responsibilities:**
- Execute business rules
- Coordinate between repositories
- Handle transactions via Unit of Work
- Validate business constraints
- Transform data as needed

**Service Pattern:**
```typescript
// lib/services/cart-service.ts
import { ICartRepository } from '@/lib/domain/interfaces/ICartRepository';
import { IProductRepository } from '@/lib/domain/interfaces/IProductRepository';
import { NotFoundError, ValidationError } from '@/lib/errors';

export class CartService {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async addItemToCart(
    identifier: CartIdentifier,
    productId: string,
    quantity: number
  ): Promise<CartWithItems> {
    // Validate business rules
    if (quantity <= 0) {
      throw new ValidationError('Quantity must be greater than 0');
    }

    // Get product
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Business logic: check stock
    if (product.stock < quantity) {
      throw new ValidationError('Insufficient stock');
    }

    // Delegate to repository
    return this.cartRepository.addItem(identifier, {
      productId,
      quantity,
      unitPriceCents: product.priceCents,
    });
  }
}

// Factory function for singleton
let cartServiceInstance: CartService | null = null;
export function getCartService(): CartService {
  if (!cartServiceInstance) {
    cartServiceInstance = new CartService(
      getCartRepository(),
      getProductRepository()
    );
  }
  return cartServiceInstance;
}
```

**Service Rules:**
- **One responsibility** per service (e.g., `CartService`, `OrderService`)
- **No direct Prisma access** (use repositories)
- **Dependency injection** via constructor
- **Singleton pattern** via factory function
- **Business validation** before database operations

**DO:**
✅ One service per aggregate (Cart, Order, Organization, etc.)  
✅ Inject dependencies through constructor  
✅ Use factory functions for singleton instances  
✅ Throw domain-specific errors (NotFoundError, ValidationError)  
✅ Validate business rules

**DON'T:**
❌ Mix concerns (e.g., payment logic in cart service)  
❌ Access database directly (use repositories)  
❌ Put UI logic in services  
❌ Create services with `new` everywhere (use getters)

---

#### 3. Repositories (`apps/web/lib/repositories/`)
**Purpose:** Abstract data access layer

**Responsibilities:**
- Execute database queries
- Transform between domain and database models
- Handle transaction operations
- Maintain data consistency

**Repository Pattern:**
```typescript
// lib/repositories/cart-repository.ts
import { ICartRepository } from '@/lib/domain/interfaces/ICartRepository';
import { prisma } from '@/lib/prisma';

export class CartRepository implements ICartRepository {
  async findByIdentifier(
    identifier: CartIdentifier
  ): Promise<CartWithItems | null> {
    const where: any = {
      orgId: identifier.orgId,
      status: 'active',
    };

    if (identifier.branchId) {
      where.branchId = identifier.branchId;
    }

    if (identifier.userId) {
      where.userId = identifier.userId;
    } else if (identifier.sessionId) {
      where.sessionId = identifier.sessionId;
      where.userId = null;
    }

    return prisma.cart.findFirst({
      where,
      include: { items: { include: { product: true } } },
    });
  }

  async addItem(
    identifier: CartIdentifier,
    data: AddItemData
  ): Promise<CartWithItems> {
    // Upsert cart if doesn't exist
    const cart = await this.getOrCreate(identifier);

    // Add item
    await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: data.productId,
        },
      },
      update: { quantity: data.quantity },
      create: {
        cartId: cart.id,
        productId: data.productId,
        quantity: data.quantity,
        unitPriceCents: data.unitPriceCents,
      },
    });

    return this.findByIdentifier(identifier)!;
  }
}

export function getCartRepository(): CartRepository {
  if (!cartRepositoryInstance) {
    cartRepositoryInstance = new CartRepository();
  }
  return cartRepositoryInstance;
}
```

**Repository Rules:**
- **Implement domain interfaces** (`ICartRepository`, `IOrderRepository`, etc.)
- **One repository per aggregate**
- **Use Prisma client** for all queries
- **No business logic** (pure data access)
- **Return domain models**, not Prisma types

**DO:**
✅ Implement domain interfaces  
✅ Use transactions for multi-table operations  
✅ Handle null/undefined properly  
✅ Return proper types (not raw Prisma)  
✅ Use Prisma's `include` for eager loading

**DON'T:**
❌ Add business logic to repositories  
❌ Expose Prisma-specific types  
❌ Use `any` types  
❌ Create repositories without interfaces

---

#### 4. Domain Interfaces (`apps/web/lib/domain/interfaces/`)
**Purpose:** Define contracts between layers

**Interfaces define:**
- Repository contracts (`ICartRepository`, `IOrderRepository`)
- Client contracts (`IZohoClient`)
- Service inputs/outputs
- Domain models and types

**Interface Pattern:**
```typescript
// lib/domain/interfaces/ICartRepository.ts
export interface CartWithItems extends Cart {
  items: Array<CartItem & { product: Product }>;
}

export interface CartIdentifier {
  orgId: string;
  branchId?: string;
  userId?: string;
  sessionId?: string;
}

export interface AddItemData {
  productId: string;
  quantity: number;
  unitPriceCents: number;
}

export interface ICartRepository {
  findByIdentifier(identifier: CartIdentifier): Promise<CartWithItems | null>;
  getOrCreate(identifier: CartIdentifier): Promise<CartWithItems>;
  addItem(identifier: CartIdentifier, data: AddItemData): Promise<CartWithItems>;
  removeItem(cartId: string, productId: string): Promise<void>;
  updateItemQuantity(cartId: string, productId: string, quantity: number): Promise<void>;
  clear(cartId: string): Promise<void>;
}
```

**Interface Rules:**
- **Pure TypeScript interfaces** (no implementations)
- **Domain-focused** (business concepts, not technical)
- **Comprehensive** (all public methods)
- **Well-documented** (JSDoc comments)

---

#### 5. Unit of Work Pattern

For complex transactions across multiple repositories:

```typescript
// lib/repositories/unit-of-work.ts
import { IUnitOfWork } from '@/lib/domain/interfaces/IUnitOfWork';

export class UnitOfWork implements IUnitOfWork {
  private constructor(private readonly tx: PrismaClient) {}

  static async create(): Promise<UnitOfWork> {
    const prisma = getPrismaInstance();
    const tx = await prisma.$transaction((tx) => tx);
    return new UnitOfWork(tx);
  }

  async commit(): Promise<void> {
    // Transaction automatically commits
  }

  async rollback(): Promise<void> {
    // Transaction automatically rolls back on error
  }

  getProductRepository(): IProductRepository {
    return new ProductRepository(this.tx);
  }

  getCartRepository(): ICartRepository {
    return new CartRepository(this.tx);
  }
}

// Usage in service
export class OrderService {
  async createOrder(data: CreateOrderData): Promise<Order> {
    const unitOfWork = await UnitOfWork.create();
    
    try {
      const cart = await unitOfWork.getCartRepository().findById(data.cartId);
      const order = await unitOfWork.getOrderRepository().create(orderData);
      await unitOfWork.getCartRepository().clear(cart.id);
      
      await unitOfWork.commit();
      return order;
    } catch (error) {
      await unitOfWork.rollback();
      throw error;
    }
  }
}
```

---

## SOLID Principles

### Single Responsibility Principle (SRP)

**Every class should have only one reason to change.**

**✅ GOOD:**
```typescript
// lib/services/cart-service.ts - Only cart business logic
export class CartService {
  async addItemToCart(...) { /* cart logic only */ }
  async removeItemFromCart(...) { /* cart logic only */ }
  async updateQuantity(...) { /* cart logic only */ }
}

// lib/services/order-service.ts - Only order business logic
export class OrderService {
  async createOrder(...) { /* order logic only */ }
  async updateStatus(...) { /* order logic only */ }
}
```

**❌ BAD:**
```typescript
// Mixing cart and order logic
export class ShoppingService {
  async addToCart(...) { /* */ }
  async createOrder(...) { /* */ }  // WRONG - different responsibility
  async processPayment(...) { /* */ }  // WRONG - different responsibility
}
```

**Enforcement:**
- One service per aggregate (Cart, Order, Product, etc.)
- Services should be < 300 lines
- If a service gets too big, split by use case

---

### Open/Closed Principle (OCP)

**Open for extension, closed for modification.**

**✅ GOOD:**
```typescript
// lib/domain/interfaces/IProductRepository.ts
export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findByCategory(category: string): Promise<Product[]>;
  findBySku(sku: string): Promise<Product | null>;
  // Easy to extend with new query methods without changing implementation
}

// lib/services/product-service.ts
export class ProductService {
  constructor(private readonly productRepo: IProductRepository) {}
  // Service depends on interface, not concrete implementation
}
```

**❌ BAD:**
```typescript
// Tight coupling to concrete implementation
export class ProductService {
  constructor() {
    this.repo = prisma.product;  // Direct Prisma access - cannot extend
  }
}
```

**Enforcement:**
- Always depend on interfaces, not concrete classes
- Use dependency injection
- Add new features by adding new classes, not modifying existing ones

---

### Liskov Substitution Principle (LSP)

**Derived classes must be substitutable for their base classes.**

**In this project:** Applies to repository implementations

**✅ GOOD:**
```typescript
export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
}

export class ProductRepository implements IProductRepository {
  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({ where: { id } });
  }
  // Any implementation must return null if not found, not throw error
}
```

**❌ BAD:**
```typescript
export class BadProductRepository implements IProductRepository {
  async findById(id: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new Error('Not found');  // WRONG - violates interface contract
    }
    return product;
  }
}
```

**Enforcement:**
- Follow interface contracts exactly
- Return types must match
- Error handling must be consistent

---

### Interface Segregation Principle (ISP)

**Clients should not depend on interfaces they don't use.**

**✅ GOOD:**
```typescript
// Separate interfaces for different clients
export interface IProductReadRepository {
  findById(id: string): Promise<Product | null>;
  findByCategory(category: string): Promise<Product[]>;
  findBySku(sku: string): Promise<Product | null>;
}

export interface IProductWriteRepository {
  create(data: CreateProductData): Promise<Product>;
  update(id: string, data: UpdateProductData): Promise<Product>;
  delete(id: string): Promise<void>;
}

// Clients depend only on what they need
export class ProductReadService {
  constructor(private readonly repo: IProductReadRepository) {}
}

export class ProductWriteService {
  constructor(private readonly repo: IProductWriteRepository) {}
}
```

**❌ BAD:**
```typescript
// Fat interface - forces clients to depend on unused methods
export interface IProductRepository {
  // Read methods
  findById(...): Promise<Product | null>;
  findByCategory(...): Promise<Product[]>;
  // Write methods
  create(...): Promise<Product>;
  update(...): Promise<Product>;
  delete(...): Promise<void>;
  // Admin methods
  archive(...): Promise<void>;
  restore(...): Promise<void>;
  // All clients must implement all methods
}
```

**Enforcement:**
- Split large interfaces into smaller, focused ones
- Group methods by client need

---

### Dependency Inversion Principle (DIP)

**High-level modules should not depend on low-level modules. Both should depend on abstractions.**

**✅ GOOD:**
```typescript
// High-level: Service depends on abstraction (interface)
export class CartService {
  constructor(
    private readonly cartRepo: ICartRepository,      // Interface, not concrete
    private readonly productRepo: IProductRepository // Interface, not concrete
  ) {}
}

// Low-level: Implementation depends on interface
export class CartRepository implements ICartRepository {
  // Implementation details
}

// Injection at runtime
export function getCartService(): CartService {
  return new CartService(
    getCartRepository(),    // Abstract, can be replaced
    getProductRepository()  // Abstract, can be replaced
  );
}
```

**❌ BAD:**
```typescript
// High-level depends on low-level directly
export class CartService {
  constructor() {
    this.cartRepo = prisma.cart;        // WRONG - tight coupling
    this.productRepo = prisma.product;  // WRONG - tight coupling
  }
}
```

**Enforcement:**
- Services never import `@prisma/client` directly
- Always inject dependencies through constructor
- Use factory functions for wiring

---

## Law of Demeter (LoD)

**"Talk to your immediate friends only"** - Objects should only call methods on:
1. Themselves
2. Objects passed as parameters
3. Objects created locally
4. Objects they directly hold references to

### Violations to Avoid

**❌ BAD - Method Chaining:**
```typescript
// Violates LoD - CartService shouldn't know CartRepository's internals
export class CartService {
  async getCart(id: string) {
    return this.cartRepo
      .findById(id)           // Returns Prisma Cart
      .items                  // Accessing nested property
      .map(item => item.product.name);  // Too much knowledge
  }
}
```

**✅ GOOD - Delegate to Repository:**
```typescript
// lib/domain/interfaces/ICartRepository.ts
export interface ICartRepository {
  // Let repository handle the complex query
  findWithProductNames(cartId: string): Promise<string[]>;
}

// lib/repositories/cart-repository.ts
export class CartRepository implements ICartRepository {
  async findWithProductNames(cartId: string): Promise<string[]> {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { product: true } } },
    });
    
    return cart?.items.map(item => item.product.name) ?? [];
  }
}

// lib/services/cart-service.ts
export class CartService {
  async getCartProductNames(id: string): Promise<string[]> {
    return this.cartRepo.findWithProductNames(id);  // One method call
  }
}
```

**❌ BAD - Nested Property Access:**
```typescript
// Service directly accessing nested properties
const customer = await this.repo.findById(id);
const branchName = customer.organization.branches[0].name;  // Too deep!
```

**✅ GOOD - Repository Returns What's Needed:**
```typescript
// Repository handles the complexity
export interface ICustomerRepository {
  findPrimaryBranchName(customerId: string): Promise<string>;
}

export class CustomerRepository implements ICustomerRepository {
  async findPrimaryBranchName(customerId: string): Promise<string> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { organization: { include: { branches: true } } },
    });
    
    return customer?.organization.branches[0]?.name ?? 'Unknown';
  }
}
```

### When Is It OK to Violate LoD?

**Sometimes unavoidable with Prisma:**

```typescript
// This is OK - direct property access on returned entities
const cart = await this.cartRepo.getOrCreate(identifier);
if (cart.items.length === 0) {  // OK - accessing items on returned entity
  throw new ValidationError('Cart is empty');
}
```

**Rule:** Access properties on **returned entities** is OK, but **chaining through multiple objects** is not.

---

## Docker Development

### Why Docker?

**MUST use Docker for development** - This ensures:
- **Consistent environment** across team
- **PostgreSQL & Redis** always available
- **Same setup** as production
- **No local database installation** needed

### Getting Started

#### 1. Start Docker Services
```bash
# Start PostgreSQL & Redis only (you develop locally)
docker-compose up postgres redis -d

# Or start everything including app container
docker-compose up -d
```

#### 2. Database Migrations

**With Docker PostgreSQL:**
```bash
# Run migrations
cd apps/web
pnpm prisma migrate dev

# Or if using migration deploy
docker-compose exec postgres psql -U postgres -d ecommerce_dev -f /path/to/migration.sql

# Generate Prisma client
pnpm prisma generate
```

**Prisma Studio:**
```bash
# View database in browser
docker-compose exec app pnpm prisma studio
# Or locally
cd apps/web && pnpm prisma studio
```

#### 3. Local Development

**You develop locally, Docker provides services:**

```bash
# Terminal 1: Keep Docker services running
docker-compose up postgres redis -d

# Terminal 2: Run dev server
cd apps/web
pnpm dev
```

**Environment:**
- PostgreSQL: `postgresql://postgres:postgres@localhost:5432/ecommerce_dev`
- Redis: `redis://localhost:6379`

#### 4. Docker Configuration

**Key Files:**
- `docker-compose.yml` - Main orchestration
- `apps/web/Dockerfile` - App container definition
- `services/zoho-sync/Dockerfile` - Sync service definition

**Services:**
- `postgres` - PostgreSQL 16
- `redis` - Redis 7
- `app` - Next.js web app (optional for local dev)
- `zoho-sync` - Background sync service

---

## Code Organization

### Directory Structure

```
apps/web/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes (thin controllers)
│   │   ├── auth/
│   │   ├── products/
│   │   ├── cart/
│   │   ├── orders/
│   │   ├── quotations/
│   │   ├── zoho/
│   │   └── analytics/
│   ├── products/                 # Pages
│   ├── cart/
│   ├── dashboard/
│   └── quotations/
│
├── components/                   # React components
│   ├── ui/                       # Shadcn UI primitives
│   ├── layouts/                  # Layout wrappers
│   └── analytics/                # Feature components
│
├── lib/                          # Core logic
│   ├── domain/                   # Domain layer
│   │   └── interfaces/           # Repository & client contracts
│   ├── services/                 # Application layer (business logic)
│   ├── repositories/             # Infrastructure layer (data access)
│   ├── clients/                  # External API clients
│   ├── middleware/               # Request middleware
│   ├── dto/                      # Data Transfer Objects
│   ├── stores/                   # Zustand state
│   └── utils/                    # Utility functions
│
├── prisma/                       # Database
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Database migrations
│   └── seed.ts                   # Seed data
│
├── e2e/                          # End-to-end tests
├── hooks/                        # React hooks
└── public/                       # Static assets
```

### File Naming Conventions

**Services:** `*-service.ts`
- `cart-service.ts`
- `order-service.ts`
- `auth-service.ts`

**Repositories:** `*-repository.ts`
- `cart-repository.ts`
- `order-repository.ts`
- `user-repository.ts`

**Interfaces:** `I*.ts` (PascalCase with `I` prefix)
- `ICartRepository.ts`
- `IOrderRepository.ts`
- `IZohoClient.ts`

**Components:** `kebab-case.tsx`
- `cart-button.tsx`
- `product-card.tsx`
- `order-list.tsx`

**API Routes:** Standard Next.js convention
- `route.ts` (GET, POST, PUT, DELETE)
- `[id]/route.ts` (dynamic routes)

**Tests:** `*.test.ts` or `*.spec.ts`
- Co-located: `cart-service.ts` → `cart-service.test.ts`
- Or separate: `__tests__/cart-service.test.ts`

---

## Best Practices

### TypeScript Best Practices

**✅ DO:**

```typescript
// Use strict types
interface CreateOrderData {
  cartId: string;
  branchId?: string;
}

// Explicit return types
async function createOrder(data: CreateOrderData): Promise<Order> {
  // implementation
}

// Use const assertions
const STATUSES = ['PENDING', 'APPROVED'] as const;
type Status = typeof STATUSES[number];

// Discriminated unions
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string };
```

**❌ DON'T:**

```typescript
// Avoid `any`
function process(data: any) { }  // WRONG

// Avoid `unknown` without narrowing
function process(data: unknown) {
  return data.foo;  // WRONG - need type guard
}

// Avoid non-null assertions
const user = await getUser()!;  // WRONG - handle null properly
```

---

### Error Handling

**Domain Errors:**
```typescript
// lib/errors.ts
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}
```

**Use in Services:**
```typescript
async getOrder(id: string): Promise<Order> {
  const order = await this.orderRepo.findById(id);
  if (!order) {
    throw new NotFoundError('Order not found');
  }
  return order;
}
```

**Handle in API Routes:**
```typescript
// Automatically handles errors via middleware
async function GET(request: NextRequest) {
  const order = await orderService.getOrder(id);
  return NextResponse.json({ order });
}

export const GET = withErrorHandler(GET);  // Wraps with try-catch
```

---

### Validation

**Use Zod for All Inputs:**

```typescript
// Define schema
const createOrderSchema = z.object({
  cartId: z.string().uuid('Invalid cart ID'),
  branchId: z.string().uuid('Invalid branch ID').optional(),
});

// Validate in API route
async function POST(request: NextRequest) {
  const body = await request.json();
  const validated = createOrderSchema.parse(body);  // Throws if invalid
  
  const order = await orderService.createOrder(validated);
  return NextResponse.json({ order }, { status: 201 });
}
```

---

### DTOs (Data Transfer Objects)

**Purpose:** Transform between domain models and API responses

**Example:**
```typescript
// lib/dto/OrderDto.ts
export interface OrderDto {
  id: string;
  number: string;
  totalCents: number;
  currency: string;
  status: string;
  createdAt: string;
  items: OrderItemDto[];
  customer?: CustomerDto;
}

// lib/mappers.ts
export function toOrderDto(order: OrderWithItems): OrderDto {
  return {
    id: order.id,
    number: order.number,
    totalCents: order.totalCents,
    currency: order.currency,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map(toOrderItemDto),
    customer: order.customer ? toCustomerDto(order.customer) : undefined,
  };
}

// Use in API route
const order = await orderService.getOrder(id);
return NextResponse.json(toOrderDto(order));
```

**Why DTOs?**
- Control what data is exposed
- Transform dates to strings
- Exclude sensitive fields
- Version your API responses

---

### State Management

**Global State:** Zustand

**Local State:** React `useState`, `useReducer`

**Server State:** React Query (for API data)

**Example:**
```typescript
// lib/stores/cart-store.ts
import { create } from 'zustand';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  addItem: (product, quantity) => set((state) => ({
    items: [...state.items, { product, quantity }],
  })),
  removeItem: (productId) => set((state) => ({
    items: state.items.filter(item => item.product.id !== productId),
  })),
  clear: () => set({ items: [] }),
}));
```

---

## Testing Requirements

### Test Pyramid

```
      /\
     /  \      E2E (10%) - Playwright
    /----\
   /      \    Integration (20%) - Vitest
  /--------\
 /          \  Unit (70%) - Vitest
/------------\
```

### Coverage Requirements

| Component | Lines | Functions | Branches | Statements |
|-----------|-------|-----------|----------|------------|
| Services | 90% | 90% | 85% | 90% |
| Repositories | 85% | 85% | 80% | 85% |
| API Routes | 80% | 80% | 75% | 80% |
| Utils | 95% | 95% | 90% | 95% |
| Components | 70% | 70% | 65% | 70% |
| **Overall** | **80%** | **80%** | **75%** | **80%** |

### Running Tests

```bash
# All tests
pnpm test

# Unit tests only
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:coverage

# Watch mode
pnpm test:watch

# UI mode
pnpm test:ui
```

### Writing Tests

**Service Tests:**
```typescript
// lib/services/cart-service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { CartService } from './cart-service';
import { ValidationError, NotFoundError } from '@/lib/errors';

describe('CartService', () => {
  describe('addItemToCart', () => {
    it('should throw ValidationError when quantity is 0', async () => {
      const mockCartRepo = createMockCartRepository();
      const mockProductRepo = createMockProductRepository();
      const service = new CartService(mockCartRepo, mockProductRepo);
      
      await expect(
        service.addItemToCart({ orgId: 'org-1' }, 'product-1', 0)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when product does not exist', async () => {
      // Test implementation
    });
  });
});
```

**Repository Tests (Integration):**
```typescript
// lib/repositories/cart-repository.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { CartRepository } from './cart-repository';

describe('CartRepository', () => {
  beforeEach(async () => {
    await cleanTestDatabase();
  });

  it('should find cart by identifier', async () => {
    const repo = new CartRepository();
    const cart = await repo.getOrCreate({ orgId: 'org-1', userId: 'user-1' });
    expect(cart).toBeDefined();
    expect(cart.orgId).toBe('org-1');
  });
});
```

**More in:** `docs/TESTING_POLICY.md`

---

## Performance Guidelines

### Database Performance

**✅ DO:**

```typescript
// Use indexes (defined in Prisma schema)
@@index([orgId, createdAt])
@@index([status])

// Use select to reduce data transfer
const products = await prisma.product.findMany({
  select: {
    id: true,
    name: true,
    priceCents: true,
    // Don't select unnecessary fields
  },
});

// Use pagination
const products = await prisma.product.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
});
```

**❌ DON'T:**

```typescript
// Don't select all fields
const products = await prisma.product.findMany();  // WRONG

// Don't load all records
const allOrders = await prisma.order.findMany();  // WRONG - use pagination

// Don't N+1 query
for (const order of orders) {
  const items = await prisma.orderItem.findMany({  // WRONG - use include
    where: { orderId: order.id },
  });
}
```

### Caching

**API Response Caching:**
```typescript
const response = NextResponse.json({ data });
response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
return response;
```

**Redis Caching:**
```typescript
import { redis } from '@/lib/redis';

async function getProduct(id: string): Promise<Product> {
  // Check cache first
  const cached = await redis.get(`product:${id}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database
  const product = await prisma.product.findUnique({ where: { id } });
  
  // Cache for 1 hour
  await redis.setex(`product:${id}`, 3600, JSON.stringify(product));
  
  return product;
}
```

---

## Security Guidelines

### Authentication

**Always check authentication:**
```typescript
async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Proceed with authenticated user
}
```

**Authorization:**
```typescript
async function DELETE(request: NextRequest) {
  const session = await auth();
  
  // Check ownership
  const org = await orgService.getOrgById(orgId);
  if (org.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
```

### Input Validation

**Always validate with Zod:**
```typescript
const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password too short'),
});
```

### SQL Injection Prevention

**Prisma handles this automatically - NEVER use raw queries with user input:**
```typescript
// ✅ GOOD - Prisma uses parameterized queries
await prisma.product.findMany({
  where: { category: categoryName },
});

// ❌ BAD - Vulnerable to SQL injection
await prisma.$queryRawUnsafe(
  `SELECT * FROM Product WHERE category = '${categoryName}'`
);
```

---

## Summary Checklist

Before committing code, ensure:

### Architecture
- [ ] Code is in correct layer (API → Service → Repository)
- [ ] No direct Prisma access in services
- [ ] Dependencies injected through constructor
- [ ] Interfaces used for abstraction

### SOLID Principles
- [ ] Single responsibility per class
- [ ] Open/closed - extending without modifying
- [ ] Liskov substitution - implementations match contracts
- [ ] Interface segregation - focused interfaces
- [ ] Dependency inversion - depend on abstractions

### Law of Demeter
- [ ] No method chaining through multiple objects
- [ ] Repositories return what's needed
- [ ] Services delegate to repositories

### Docker
- [ ] Docker services running (postgres, redis)
- [ ] Migrations applied
- [ ] Prisma client generated

### Testing
- [ ] Unit tests written for new services
- [ ] Integration tests for repositories
- [ ] Coverage thresholds met
- [ ] All tests passing

### Code Quality
- [ ] TypeScript strict mode compliant
- [ ] No `any` types
- [ ] Proper error handling
- [ ] Input validation with Zod
- [ ] DTOs used for API responses

---

## Quick Reference

### Common Commands

```bash
# Docker
docker-compose up postgres redis -d      # Start services
docker-compose ps                        # Check status
docker-compose logs postgres             # View logs
docker-compose down                      # Stop services

# Database
cd apps/web
pnpm prisma migrate dev                  # Create & apply migration
pnpm prisma generate                     # Generate client
pnpm prisma studio                       # Open database GUI
pnpm prisma seed                         # Seed database

# Development
pnpm dev                                 # Start Next.js dev server
pnpm build                               # Production build
pnpm start                               # Production server

# Testing
pnpm test                                # Run all tests
pnpm test:watch                          # Watch mode
pnpm test:coverage                       # Coverage report
pnpm test:e2e                            # E2E tests
```

### File Templates

See `docs/TEMPLATES.md` for boilerplate code.

---

**Remember:** Clean code is maintainable code. Write for your future self and your team.

