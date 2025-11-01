# TypeScript Error Fixes Guide

The main issue is that `OrderWithItems` type needs to properly extend Order properties. 

## Critical Steps:

1. **Run Prisma Generate** (MUST DO FIRST):
```bash
cd apps/web
pnpm prisma generate
```

2. **The type fix is already applied** - `OrderWithItems` is now a type intersection instead of interface extension.

3. **For accessing Order properties**, cast to `Order` type:
```typescript
(order as Order).orgId
(order as Order).branchId
(order as Order).id
(order as Order).number
```

## Remaining fixes needed:

The order-zoho-sync-service.ts needs all `order.` accesses to be cast to `(order as Order).`

