# TypeScript Errors Fix Summary

## CRITICAL: Run Prisma Generate First!
```bash
cd apps/web
pnpm prisma generate
```

## Main Fixes Applied:

### 1. OrderWithItems Type Fix ✓
Changed from `interface extends Order` to `type OrderWithItems = Order & {...}` in `lib/domain/interfaces/IOrderRepository.ts`

### 2. Files Fixed So Far:
- ✅ `lib/dto/mapper.ts` - Added types to reduce callbacks
- ✅ `app/api/products/categories/route.ts` - Added type to forEach
- ✅ `lib/repositories/order-repository.ts` - Added types to map/find callbacks  
- ✅ `lib/services/order-zoho-sync-service.ts` - Added `orderBase = order as Order` at start
- ✅ `app/api/orders/[orderId]/route.ts` - Added Order cast

### 3. Files Still Needing Fixes:

**app/api/orders/route.ts:**
- Line 31-32: `order.id` → `(order as Order).id`

**lib/services/payment-service.ts:**
- All `order.id`, `order.status`, `order.telrTranRef`, `order.paymentId` → `(order as Order)....`

**lib/services/analytics-service.ts:**
- Add types to reduce/map callbacks

**lib/services/cart-service.ts:**
- Add types to reduce callbacks

**lib/services/quotation-service.ts:**
- Line 154: Add type to map callback

**lib/services/order-service.ts:**
- Line 56: Add type to map callback

**lib/repositories/unit-of-work.ts:**
- Line 18: Add type to callback

## Pattern to Use:

For OrderWithItems access:
```typescript
const orderBase = order as Order;
// Then use orderBase.id, orderBase.orgId, etc.
```

For callback parameters:
```typescript
.map((item: typeof items[number]) => ...)
.reduce((sum: number, item: typeof items[number]) => ...)
```

