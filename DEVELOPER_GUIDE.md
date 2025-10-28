# Developer Guide - New Architecture

## Quick Reference

### Creating a New API Route

Follow the **thin controller** pattern:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createYourService } from "@/lib/services/your-service";
import { withErrorHandler } from "@/lib/middleware/error-handler";
import { validateRequestBody } from "@/lib/middleware/validation";
import { yourSchema } from "@/lib/dto/YourDto";

async function yourHandler(req: NextRequest) {
  // 1. Authentication (if needed)
  const session = await requireAuth();
  
  // 2. Validation
  const validated = await validateRequestBody(req, yourSchema);
  
  // 3. Delegate to service
  const service = createYourService();
  const result = await service.doSomething(validated);
  
  // 4. Return response
  return NextResponse.json(result);
}

export const POST = withErrorHandler(yourHandler);
```

### Creating a New Service

Services contain business logic and depend on repository interfaces:

```typescript
// lib/services/your-service.ts
import { IYourRepository } from '@/lib/domain/interfaces/IYourRepository';
import { getYourRepository } from '@/lib/repositories/your-repository';

export class YourService {
  constructor(private readonly repository: IYourRepository) {}

  async doSomething(data: any) {
    // Business logic here
    return this.repository.create(data);
  }
}

// Factory function for dependency injection
export function createYourService(
  repository?: IYourRepository
): YourService {
  return new YourService(repository || getYourRepository());
}
```

### Creating a New Repository

Repositories handle data access and implement interfaces:

```typescript
// lib/repositories/your-repository.ts
import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { IYourRepository } from '@/lib/domain/interfaces/IYourRepository';

export class YourRepository implements IYourRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async findById(id: string) {
    return this.db.yourModel.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.db.yourModel.create({ data });
  }
}

// Singleton instance
let repositoryInstance: YourRepository | null = null;

export function getYourRepository(): YourRepository {
  if (!repositoryInstance) {
    repositoryInstance = new YourRepository();
  }
  return repositoryInstance;
}
```

### Using Transactions

For operations that need atomicity:

```typescript
import { getUnitOfWork } from '@/lib/repositories/unit-of-work';

export class YourService {
  constructor(
    private readonly unitOfWork: IUnitOfWork,
    private readonly repository: IYourRepository
  ) {}

  async createWithRelated(data: any) {
    return this.unitOfWork.execute(async (tx) => {
      // All operations use the same transaction
      const main = await tx.yourModel.create({ data });
      const related = await tx.relatedModel.create({ 
        data: { mainId: main.id } 
      });
      
      return { main, related };
    });
  }
}
```

### Using Batch Processing

For processing large datasets efficiently:

```typescript
import { BatchProcessor } from '@/lib/utils/batching/batch-processor';

const batchProcessor = new BatchProcessor({
  batchSize: 50,
  onProgress: (processed, total, errors) => {
    console.log(`Progress: ${processed}/${total}, Errors: ${errors}`);
  },
  onBatchComplete: (batchNum, succeeded, failed) => {
    console.log(`Batch ${batchNum}: ${succeeded} ok, ${failed} failed`);
  },
});

const result = await batchProcessor.process(items, async (item) => {
  await processItem(item);
});

console.log(`Succeeded: ${result.succeeded.length}`);
console.log(`Failed: ${result.failed.length}`);
```

### Error Handling

Always use the error handler wrapper:

```typescript
import { withErrorHandler } from '@/lib/middleware/error-handler';

// Automatically handles all errors with consistent responses
export const POST = withErrorHandler(yourHandler);
```

Throw appropriate errors in services:

```typescript
import { NotFoundError, ConflictError, ValidationError } from '@/lib/errors';

// These are automatically caught and converted to HTTP responses
if (!user) {
  throw new NotFoundError('User not found');
}

if (existingUser) {
  throw new ConflictError('User already exists');
}
```

### Configuration

Access configuration through the centralized config:

```typescript
import { config } from '@/lib/config';
import { ZOHO_CONSTANTS, PAGINATION_CONSTANTS } from '@/lib/config/constants';

// Environment variables
const clientId = config.zoho.clientId;

// Constants
const batchSize = ZOHO_CONSTANTS.DEFAULT_BATCH_SIZE;
const pageSize = PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE;
```

### DTOs and Validation

Define Zod schemas for validation:

```typescript
// lib/dto/YourDto.ts
import { z } from 'zod';

export const CreateYourSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});

export type CreateYourDto = z.infer<typeof CreateYourSchema>;
```

Use in routes:

```typescript
import { validateRequestBody } from '@/lib/middleware/validation';
import { CreateYourSchema } from '@/lib/dto/YourDto';

const validated = await validateRequestBody(req, CreateYourSchema);
```

### Testing Services

Services are easily testable because they depend on interfaces:

```typescript
import { YourService } from '@/lib/services/your-service';

describe('YourService', () => {
  it('should create item', async () => {
    // Mock repository
    const mockRepository = {
      create: jest.fn().mockResolvedValue({ id: '1', name: 'Test' }),
      findById: jest.fn(),
    };

    // Inject mock
    const service = new YourService(mockRepository);

    // Test business logic without database
    const result = await service.doSomething({ name: 'Test' });

    expect(mockRepository.create).toHaveBeenCalledWith({ name: 'Test' });
    expect(result).toEqual({ id: '1', name: 'Test' });
  });
});
```

## Architecture Layers

### 1. API Layer (Routes)
- **Location**: `app/api/`
- **Responsibility**: HTTP handling only
- **Rules**:
  - Must be thin controllers
  - Use `withErrorHandler` wrapper
  - Validate using `validateRequestBody`
  - Delegate to services

### 2. Service Layer
- **Location**: `lib/services/`
- **Responsibility**: Business logic
- **Rules**:
  - Depend on repository interfaces
  - Use factory functions for creation
  - Throw domain errors
  - Never import from `app/api/`

### 3. Repository Layer
- **Location**: `lib/repositories/`
- **Responsibility**: Data access
- **Rules**:
  - Implement repository interfaces
  - Encapsulate Prisma operations
  - Provide singleton instances
  - Support transaction injection

### 4. Domain Layer
- **Location**: `lib/domain/`
- **Responsibility**: Interfaces and contracts
- **Rules**:
  - Define interfaces only
  - No implementations
  - No external dependencies

### 5. DTO Layer
- **Location**: `lib/dto/`
- **Responsibility**: Data transfer and validation
- **Rules**:
  - Define Zod schemas
  - Export TypeScript types
  - Provide mappers

## Common Patterns

### Pattern 1: Create with Related Records

Use Unit of Work for atomic operations:

```typescript
async createWithRelated(data: CreateData) {
  return this.unitOfWork.execute(async (tx) => {
    const repo = new YourRepository(tx);
    const main = await repo.create(data.main);
    const related = await repo.createRelated({
      ...data.related,
      mainId: main.id,
    });
    return { main, related };
  });
}
```

### Pattern 2: List with Pagination

Use repository's findMany:

```typescript
async getItems(filter: Filter, pagination: Pagination) {
  return this.repository.findMany(filter, pagination);
}
```

### Pattern 3: Sync External Data

Use batch processor:

```typescript
async syncFromExternal() {
  const items = await this.externalClient.fetchItems();
  
  const processor = new BatchProcessor({ batchSize: 50 });
  return processor.process(items, async (item) => {
    const data = mapExternalToInternal(item);
    await this.repository.upsert(data.id, data, data);
  });
}
```

## Best Practices

### ✅ DO

- Keep routes thin (< 50 lines)
- Put business logic in services
- Use interfaces for dependencies
- Use factory functions for service creation
- Write unit tests for services
- Use transactions for multi-step operations
- Use batch processing for large datasets
- Use centralized configuration
- Use error handler middleware
- Validate all input with Zod schemas

### ❌ DON'T

- Put business logic in routes
- Call Prisma directly from routes
- Use `any` type
- Access `process.env` directly
- Hard-code magic numbers
- Catch errors in routes (use middleware)
- Process large datasets sequentially
- Chain object property access (Demeter)
- Create services without factory functions

## File Organization

```
apps/web/
├── app/api/                    # API routes (thin controllers)
├── lib/
│   ├── config/                 # Configuration
│   │   ├── index.ts           # Main config
│   │   ├── constants.ts       # Constants
│   │   └── regions.ts         # Region strategy
│   ├── domain/
│   │   └── interfaces/        # Repository interfaces
│   ├── repositories/          # Data access layer
│   ├── services/              # Business logic layer
│   ├── dto/                   # DTOs and validation
│   ├── middleware/            # Middleware
│   ├── clients/               # External API clients
│   └── utils/                 # Utilities
```

## Getting Help

- Review `REFACTORING_SUMMARY.md` for architecture overview
- Check existing services for patterns
- Look at test files for examples
- Follow SOLID principles
- Ask: "Is this the right layer for this code?"

## Checklist for New Features

- [ ] Create domain interface if needed
- [ ] Implement repository if data access needed
- [ ] Create service with business logic
- [ ] Add factory function for service
- [ ] Create DTO with Zod schema
- [ ] Create thin controller route
- [ ] Use `withErrorHandler` wrapper
- [ ] Add unit tests for service
- [ ] Add integration tests for route
- [ ] Update this guide if introducing new pattern


