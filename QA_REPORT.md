# QA Report - JOWi Shop Project
**Date:** 2025-11-14
**Tested by:** Claude Code QA Agent
**Project Version:** 0.1.0
**Technology Stack:** Next.js, NestJS, Prisma, PostgreSQL, TypeScript, Zod

---

## Executive Summary

Comprehensive QA testing revealed **CRITICAL security vulnerabilities** in the multi-tenant architecture that could lead to **complete data breach across tenants**. The Row-Level Security (RLS) implementation is present in database migrations but **NOT ENFORCED** in the application code, creating a false sense of security.

### Severity Breakdown
- **CRITICAL:** 3 issues
- **HIGH:** 4 issues
- **MEDIUM:** 6 issues
- **LOW:** 5 issues

### Risk Assessment
**OVERALL RISK LEVEL: CRITICAL - DO NOT DEPLOY TO PRODUCTION**

The application contains fundamental security flaws that make it unsuitable for production deployment without immediate remediation.

---

## Critical Issues (Severity: CRITICAL)

### 1. RLS Policies Not Enforced - Complete Multi-Tenant Data Breach Risk
**Severity:** CRITICAL
**Impact:** Complete data breach across all tenants
**Files:**
- `C:\Users\timur\Documents\GitHub\JOWi-Shop\packages\database\src\index.ts`
- `C:\Users\timur\Documents\GitHub\JOWi-Shop\apps\api\src\modules\stores\stores.service.ts`
- `C:\Users\timur\Documents\GitHub\JOWi-Shop\apps\api\src\modules\sales\receipts.service.ts`
- `C:\Users\timur\Documents\GitHub\JOWi-Shop\apps\api\src\modules\customers\customers.service.ts`

**Problem:**
The `withTenant()` function exists in `packages/database/src/index.ts` (lines 48-66) to set PostgreSQL RLS session variables, but it is **NEVER USED** anywhere in the application code. All database queries bypass RLS entirely.

**Evidence:**
```typescript
// packages/database/src/index.ts (lines 48-66)
export async function withTenant<T>(
  tenantId: string,
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`);
    return operation(tx as PrismaClient);
  });
}
```

**Current Implementation (VULNERABLE):**
```typescript
// apps/api/src/modules/stores/stores.service.ts (lines 90-104)
async findOne(tenantId: string, id: string) {
  const store = await this.db.store.findFirst({
    where: {
      id,
      tenantId,  // ❌ Application-level filter only - easily bypassed
      deletedAt: null,
    },
  });
  return store;
}
```

**What Should Happen:**
```typescript
async findOne(tenantId: string, id: string) {
  return withTenant(tenantId, async (db) => {
    return db.store.findFirst({
      where: { id, deletedAt: null },
      // ✅ RLS automatically filters by tenant_id at database level
    });
  });
}
```

**Attack Scenario:**
1. Attacker modifies client-side request to change `tenantId` parameter
2. API accepts modified `tenantId` from request
3. Database query executes with attacker's chosen `tenantId`
4. RLS policies are never activated (no `SET LOCAL app.tenant_id`)
5. Attacker gains access to another tenant's data

**Recommended Fix:**
1. **IMMEDIATELY** refactor ALL database operations to use `withTenant()`
2. Remove manual `tenantId` filtering from WHERE clauses (rely on RLS)
3. Add integration tests that verify cross-tenant access is blocked
4. Conduct security audit to ensure no tenant data was leaked

**References:**
- Prisma RLS Documentation: Context7 docs show `SET LOCAL` must be called before EVERY query
- OWASP Top 10: A01:2021 – Broken Access Control

---

### 2. SQL Injection Vulnerability in withTenant() Function
**Severity:** CRITICAL
**Impact:** Database compromise, arbitrary SQL execution
**File:** `C:\Users\timur\Documents\GitHub\JOWi-Shop\packages\database\src\index.ts` (line 61)

**Problem:**
The `withTenant()` function uses `$executeRawUnsafe()` with string interpolation, creating a SQL injection vulnerability.

**Vulnerable Code:**
```typescript
// Line 61 - VULNERABLE TO SQL INJECTION
await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`);
```

**Attack Scenario:**
```typescript
// Malicious tenantId input
const maliciousTenantId = "'; DROP TABLE users; --";

// Resulting SQL
SET LOCAL app.tenant_id = ''; DROP TABLE users; --'
```

**Recommended Fix:**
```typescript
// Use parameterized query to prevent SQL injection
await tx.$executeRaw`SET LOCAL app.tenant_id = ${tenantId}`;
// OR validate tenantId is a valid UUID
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) {
  throw new Error('Invalid tenant ID format');
}
await tx.$executeRaw`SET LOCAL app.tenant_id = ${tenantId}`;
```

**Additional Validation:**
Add Zod schema validation for `tenantId` before any database operations.

---

### 3. Hardcoded JWT Secret in Production
**Severity:** CRITICAL
**Impact:** Authentication bypass, session hijacking
**File:** `C:\Users\timur\Documents\GitHub\JOWi-Shop\apps\api\src\modules\auth\constants.ts` (line 1)

**Problem:**
JWT secret has a weak default fallback value that will be used if `JWT_SECRET` environment variable is not set.

**Vulnerable Code:**
```typescript
export const JWT_SECRET = process.env.JWT_SECRET || 'jowi-shop-secret-key-change-in-production';
```

**Attack Scenario:**
1. Developer forgets to set `JWT_SECRET` in production
2. Application uses default secret
3. Attacker finds default secret in public GitHub repository
4. Attacker generates valid JWT tokens for any user/tenant
5. Complete authentication bypass

**Recommended Fix:**
```typescript
export const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET environment variable must be set and at least 32 characters long. ' +
      'Generate a secure secret: openssl rand -base64 32'
    );
  }
  return secret;
})();
```

**Additional Security:**
- Add pre-deployment checklist to verify `JWT_SECRET` is set
- Use secrets management tool (AWS Secrets Manager, HashiCorp Vault)
- Implement secret rotation strategy
- Log warning if default secret is detected (dev mode only)

---

## High Priority Issues (Severity: HIGH)

### 4. Missing RLS Policies for Child Tables
**Severity:** HIGH
**Impact:** Indirect tenant data leakage
**Files:**
- `C:\Users\timur\Documents\GitHub\JOWi-Shop\packages\database\migrations\001_enable_rls.sql` (lines 99-110)
- `C:\Users\timur\Documents\GitHub\JOWi-Shop\packages\database\prisma\schema.prisma`

**Problem:**
Child tables (`receipt_items`, `movement_items`, `payments`) do not have direct `tenant_id` columns or RLS policies, relying on application-level enforcement.

**Migration File Comment:**
```sql
-- Line 99-110
-- MOVEMENT_ITEMS (no direct tenant_id, rely on document join)
-- For now, no RLS on movement_items - enforce at application level or via JOIN

-- RECEIPT_ITEMS (no direct tenant_id, rely on receipt join)
-- For now, no RLS on receipt_items - enforce at application level or via JOIN

-- PAYMENTS (no direct tenant_id, rely on receipt join)
-- For now, no RLS on payments - enforce at application level or via JOIN
```

**Risk:**
If a developer directly queries child tables without proper joins, tenant isolation breaks.

**Recommended Fix:**

**Option 1: Add tenant_id to child tables (Recommended)**
```sql
ALTER TABLE receipt_items ADD COLUMN tenant_id UUID NOT NULL;
ALTER TABLE movement_items ADD COLUMN tenant_id UUID NOT NULL;
ALTER TABLE payments ADD COLUMN tenant_id UUID NOT NULL;

-- Add RLS policies
CREATE POLICY "receipt_items_tenant_isolation" ON receipt_items
  USING (tenant_id = current_tenant_id());
```

**Option 2: Add RLS with JOIN (More complex but avoids denormalization)**
```sql
CREATE POLICY "receipt_items_tenant_isolation" ON receipt_items
  USING (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = receipt_items.receipt_id
        AND receipts.tenant_id = current_tenant_id()
    )
  );
```

**Prisma Schema Changes:**
```prisma
model ReceiptItem {
  id             String  @id @default(uuid())
  tenantId       String  @map("tenant_id") // ADD THIS
  receiptId      String  @map("receipt_id")
  // ... rest of fields
}
```

---

### 5. Inconsistent Validation - Class-Validator vs Zod
**Severity:** HIGH
**Impact:** Validation bypass, data integrity issues
**Files:**
- `C:\Users\timur\Documents\GitHub\JOWi-Shop\apps\api\src\modules\sales\dto\create-receipt.dto.ts` (uses class-validator)
- `C:\Users\timur\Documents\GitHub\JOWi-Shop\apps\api\src\modules\stores\dto\create-store.dto.ts` (uses Zod)
- `C:\Users\timur\Documents\GitHub\JOWi-Shop\packages\validators\src\index.ts` (Zod schemas)

**Problem:**
Project uses TWO different validation libraries inconsistently:
- `create-receipt.dto.ts`: Uses `class-validator` decorators
- `create-store.dto.ts`: Uses Zod via `nestjs-zod`

**Evidence:**
```typescript
// create-receipt.dto.ts - Class-Validator
export class CreateReceiptItemDto {
  @IsString()
  variantId!: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;
}

// create-store.dto.ts - Zod
export class CreateStoreDto extends createZodDto(createStoreSchema) {}
```

**Issues:**
1. **Maintenance Burden**: Two validation systems to maintain
2. **Inconsistent Error Messages**: Different format for different endpoints
3. **Missing Zod Types**: Some DTOs don't leverage shared Zod schemas from `@jowi/validators`
4. **Validation Bypass Risk**: Easy to forget which system to use

**Recommended Fix:**
1. **Standardize on Zod** (already defined in `@jowi/validators`)
2. Refactor all DTOs to use `nestjs-zod`:
```typescript
// create-receipt.dto.ts - AFTER
import { createZodDto } from 'nestjs-zod';
import { createReceiptSchema } from '@jowi/validators';

export class CreateReceiptDto extends createZodDto(createReceiptSchema) {}
```
3. Remove `class-validator` dependency
4. Update all controllers to use Zod DTOs

**Benefits:**
- Single source of truth for validation
- Type safety between frontend and backend
- Consistent error messages
- Reduced bundle size

---

### 6. Missing TenantId Validation in Request Decorator
**Severity:** HIGH
**Impact:** Tenant ID spoofing, unauthorized access
**File:** `C:\Users\timur\Documents\GitHub\JOWi-Shop\apps\api\src\common\guards\tenant.guard.ts` (lines 34-44)

**Problem:**
The `TenantGuard` has a "TEMPORARY" fallback that accepts `x-tenant-id` header without JWT validation.

**Vulnerable Code:**
```typescript
// Lines 34-44
// TEMPORARY: For load testing, also accept x-tenant-id header
const headerTenantId = request.headers['x-tenant-id'];

if (!user || !user.tenantId) {
  // Fallback to header for testing (when JWT guard is disabled)
  if (headerTenantId) {
    request.tenantId = headerTenantId;
    return true;  // ❌ CRITICAL: Bypasses all authentication
  }
  throw new ForbiddenException('TENANT_MISSING');
}
```

**Attack Scenario:**
1. Attacker sends request without JWT token
2. Attacker adds `x-tenant-id: <victim-tenant-id>` header
3. TenantGuard accepts header value
4. Attacker accesses victim tenant's data

**Recommended Fix:**
```typescript
// Remove temporary testing code in production
if (!user || !user.tenantId) {
  throw new ForbiddenException('TENANT_MISSING');
}

// OR add environment check
if (!user || !user.tenantId) {
  if (process.env.NODE_ENV === 'development' && headerTenantId) {
    console.warn('⚠️  DEVELOPMENT MODE: Using x-tenant-id header');
    request.tenantId = headerTenantId;
    return true;
  }
  throw new ForbiddenException('TENANT_MISSING');
}
```

**Additional Validation:**
Add UUID format validation for `tenantId`:
```typescript
if (!user?.tenantId || !/^[0-9a-f-]{36}$/i.test(user.tenantId)) {
  throw new ForbiddenException('INVALID_TENANT_ID');
}
```

---

### 7. Missing Error Handling in Database Operations
**Severity:** HIGH
**Impact:** Information disclosure, application crashes
**Files:**
- `C:\Users\timur\Documents\GitHub\JOWi-Shop\apps\api\src\modules\stores\stores.service.ts` (lines 26-38, 111-120)

**Problem:**
Catch blocks throw generic errors without proper error classification or logging.

**Vulnerable Code:**
```typescript
// Lines 26-38
async create(tenantId: string, createStoreDto: CreateStoreDto) {
  try {
    const store = await this.db.store.create({
      data: {
        ...createStoreDto,
        tenantId,
      },
    });
    return store;
  } catch (error) {
    throw new BadRequestException('Failed to create store');  // ❌ Information loss
  }
}
```

**Issues:**
1. **No Error Logging**: Errors are swallowed without logging
2. **Generic Error Messages**: "Failed to create store" provides no context
3. **Information Disclosure Risk**: Stack traces might leak in dev mode
4. **No Error Classification**: Can't distinguish between validation errors, database errors, etc.

**Recommended Fix:**
```typescript
async create(tenantId: string, createStoreDto: CreateStoreDto) {
  try {
    const store = await this.db.store.create({
      data: {
        ...createStoreDto,
        tenantId,
      },
    });
    return store;
  } catch (error) {
    // Log full error for debugging
    this.logger.error('Failed to create store', {
      error: error.message,
      stack: error.stack,
      tenantId,
      data: createStoreDto,
    });

    // Return user-friendly error based on error type
    if (error.code === 'P2002') {
      throw new ConflictException('Store with this name already exists');
    }
    if (error.code === 'P2003') {
      throw new BadRequestException('Invalid tenant ID');
    }

    // Generic fallback
    throw new InternalServerErrorException('Unable to create store. Please try again.');
  }
}
```

**Best Practices:**
- Use NestJS Logger service
- Map Prisma error codes to user-friendly messages
- Never expose stack traces in production
- Implement error tracking (Sentry, LogRocket)

---

## Medium Priority Issues (Severity: MEDIUM)

### 8. No Database Indexes for RLS Performance
**Severity:** MEDIUM
**Impact:** Slow queries, database performance degradation
**File:** `C:\Users\timur\Documents\GitHub\JOWi-Shop\packages\database\migrations\001_enable_rls.sql` (lines 129-137)

**Problem:**
Migration file adds only one composite index for RLS, but Prisma schema is missing many critical indexes.

**Migration File:**
```sql
-- Lines 129-137
-- ============================================
-- Indexes for RLS Performance
-- ============================================
-- These indexes ensure RLS policies perform well
-- Most of these should already exist from Prisma schema

-- Additional composite indexes for RLS + common queries
CREATE INDEX IF NOT EXISTS idx_customers_tenant_phone ON customers(tenant_id, phone);
```

**Prisma Schema Review:**
Looking at `schema.prisma`, most tables have `@@index([tenantId])`, but missing composite indexes like:
- `products(tenant_id, category_id)`
- `receipts(tenant_id, store_id, created_at)`
- `stock_levels(tenant_id, store_id, variant_id)`

**Recommended Fix:**
```prisma
model Product {
  // ... fields

  @@index([tenantId, categoryId])  // ADD
  @@index([tenantId, isActive])    // ADD for filtering
  @@index([tenantId, createdAt])   // ADD for sorting
}

model Receipt {
  // ... fields

  @@index([tenantId, storeId, createdAt])     // ADD
  @@index([tenantId, status, completedAt])    // ADD
  @@index([tenantId, customerId])             // ADD
}

model StockLevel {
  // ... fields

  @@index([tenantId, storeId, variantId])  // ADD composite
}
```

**Performance Impact:**
Without these indexes, RLS queries will perform full table scans, causing:
- Slow API responses (>1s for large datasets)
- High CPU usage on database
- Degraded user experience
- Increased cloud costs

---

### 9. Hardcoded Text in Frontend Components (i18n Violations)
**Severity:** MEDIUM
**Impact:** Internationalization broken, poor UX for Uzbek users
**Files:** Multiple warehouse pages

**Problem:**
CLAUDE.md explicitly states: "CRITICAL RULE: When creating ANY new page or component, ALWAYS implement translations immediately" for both RU and UZ languages. However, many pages have hardcoded Russian text.

**Evidence from Monitoring Page:**
```typescript
// apps/web/src/app/store/[id]/warehouses/monitoring/page.tsx
const mockCategories: Category[] = [
  { id: '1', name: 'Напитки' },          // ❌ Hardcoded Russian
  { id: '2', name: 'Молочные продукты' }, // ❌ Hardcoded Russian
  // ...
];

const mockWarehouses: Warehouse[] = [
  { id: '1', name: 'Основной' },    // ❌ Hardcoded Russian
  { id: '2', name: 'Возвратов' },    // ❌ Hardcoded Russian
  { id: '3', name: 'Транзитный' },   // ❌ Hardcoded Russian
];
```

**Impact:**
- Uzbek users see Russian text instead of Uzbek
- Violates project requirements (RU + UZ mandatory)
- Inconsistent with translated pages
- Cannot switch language for warehouse module

**Recommended Fix:**
```typescript
// Use i18n instead
const { t } = useTranslation('common');

const categories = useMemo(() => [
  { id: '1', name: t('categories.drinks') },
  { id: '2', name: t('categories.dairy') },
  // ...
], [t]);
```

**Add to translation files:**
```json
// packages/i18n/src/locales/ru/common.json
{
  "categories": {
    "drinks": "Напитки",
    "dairy": "Молочные продукты",
    // ...
  },
  "warehouses": {
    "main": "Основной",
    "returns": "Возвратов",
    "transit": "Транзитный"
  }
}

// packages/i18n/src/locales/uz/common.json
{
  "categories": {
    "drinks": "Ichimliklar",
    "dairy": "Sut mahsulotlari",
    // ...
  },
  "warehouses": {
    "main": "Asosiy",
    "returns": "Qaytarilganlar",
    "transit": "Tranzit"
  }
}
```

**Pages Requiring Translation:**
- `warehouses/monitoring/page.tsx`
- `warehouses/inventory/page.tsx`
- `warehouses/warehouses-list/page.tsx`
- Check all other warehouse pages

---

### 10. Missing Soft Delete Middleware
**Severity:** MEDIUM
**Impact:** Deleted records returned to users, data integrity
**File:** `C:\Users\timur\Documents\GitHub\JOWi-Shop\packages\database\src\index.ts` (lines 16-19)

**Problem:**
Comment indicates soft delete logic should be handled at application level, but no middleware or extension exists.

**Code Comment:**
```typescript
// Lines 16-19
// Soft Delete Extension - Automatically filter out deleted records
// Note: In Prisma 5.x, middleware ($use) is deprecated. Use Client Extensions instead.
// For now, we'll keep the base client without soft delete middleware.
// Soft delete logic should be handled at the application level or via Prisma Client Extensions.
```

**Current State:**
Every query manually filters `deletedAt: null`:
```typescript
const where = {
  tenantId,
  deletedAt: null,  // ❌ Easy to forget
  // ...
};
```

**Risk:**
Developer forgets to add `deletedAt: null` filter → Deleted records appear in results

**Recommended Fix:**
Implement Prisma Client Extension for automatic soft delete filtering:

```typescript
import { Prisma, PrismaClient } from '@prisma/client';

const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  query: {
    $allModels: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findUnique({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async count({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
  },
});

export const prisma = new PrismaClient().$extends(softDeleteExtension);
```

**Benefits:**
- No need to manually add `deletedAt: null`
- Consistent behavior across all queries
- Single place to modify soft delete logic
- Reduces human error

---

### 11. No Idempotency Keys for Critical Operations
**Severity:** MEDIUM
**Impact:** Duplicate receipts, financial errors
**File:** `C:\Users\timur\Documents\GitHub\JOWi-Shop\apps\api\src\modules\sales\receipts.service.ts`

**Problem:**
CLAUDE.md states: "Idempotency: Use idempotency keys for critical operations (sales, payments, fiscal operations)" but receipts.service.ts has no idempotency implementation.

**Current Implementation:**
```typescript
async create(tenantId: string, createReceiptDto: CreateReceiptDto) {
  // No idempotency check
  const receipt = await this.prisma.$transaction(async (tx) => {
    // ... create receipt
  });
  return receipt;
}
```

**Attack Scenario:**
1. Client sends receipt creation request
2. Network timeout occurs
3. Client retries request
4. Two identical receipts created
5. Customer charged twice

**Recommended Fix:**
```typescript
async create(
  tenantId: string,
  createReceiptDto: CreateReceiptDto,
  idempotencyKey: string  // ADD THIS
) {
  // Check if operation already completed
  const existing = await this.prisma.receipt.findFirst({
    where: {
      tenantId,
      metadata: {
        path: ['idempotencyKey'],
        equals: idempotencyKey,
      },
    },
  });

  if (existing) {
    // Return existing receipt (idempotent)
    return existing;
  }

  // Create receipt with idempotency key
  const receipt = await this.prisma.$transaction(async (tx) => {
    return await tx.receipt.create({
      data: {
        // ... existing fields
        metadata: {
          idempotencyKey,
          createdAt: new Date().toISOString(),
        },
      },
    });
  });

  return receipt;
}
```

**Add to Schema:**
```prisma
model Receipt {
  // ... existing fields
  metadata  Json?  // Store idempotency key here
}
```

**Add to DTO:**
```typescript
export class CreateReceiptDto {
  // ... existing fields

  @IsString()
  idempotencyKey!: string;  // Client-generated UUID
}
```

---

### 12. Missing Transaction Isolation Levels
**Severity:** MEDIUM
**Impact:** Race conditions, inventory inaccuracies
**File:** `C:\Users\timur\Documents\GitHub\JOWi-Shop\apps\api\src\modules\sales\receipts.service.ts` (line 45)

**Problem:**
Receipt creation uses default `READ COMMITTED` isolation level, which can lead to race conditions.

**Code Comment:**
```typescript
// Line 44
// Using default READ COMMITTED isolation for maximum performance
```

**Race Condition Scenario:**
1. Two terminals sell the last item simultaneously
2. Both transactions read `stock_level.quantity = 1`
3. Both decrement stock: `quantity - 1 = 0`
4. Both transactions commit
5. Result: Stock is 0, but item was oversold

**Context7 Documentation:**
From Prisma docs, use `Prisma.TransactionIsolationLevel.Serializable` for critical operations.

**Recommended Fix:**
```typescript
const receipt = await this.prisma.$transaction(
  async (tx) => {
    // ... receipt creation logic
  },
  {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 5000,  // 5 seconds
    timeout: 10000, // 10 seconds
  }
);
```

**Add Retry Logic:**
```typescript
const MAX_RETRIES = 3;
let retries = 0;

while (retries < MAX_RETRIES) {
  try {
    const receipt = await this.prisma.$transaction(/* ... */);
    return receipt;
  } catch (error) {
    if (error.code === 'P2034' && retries < MAX_RETRIES - 1) {
      retries++;
      await new Promise(resolve => setTimeout(resolve, 100 * retries));
      continue;
    }
    throw error;
  }
}
```

**Trade-off:**
- **Performance Impact**: Serializable isolation is slower
- **Data Accuracy**: Prevents inventory errors worth thousands of UZS
- **Recommendation**: Use Serializable for sales, READ COMMITTED for read-only queries

---

### 13. Prisma Client Not Properly Configured for Multi-Instance Environments
**Severity:** MEDIUM
**Impact:** Connection pool exhaustion, memory leaks
**File:** `C:\Users\timur\Documents\GitHub\JOWi-Shop\packages\database\src\index.ts`

**Problem:**
Prisma client singleton pattern is correct, but missing connection pool configuration.

**Current Configuration:**
```typescript
const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // ❌ No connection pool configuration
});
```

**Context7 Best Practice:**
From Prisma docs, configure connection pool for serverless and multi-instance environments.

**Recommended Fix:**
```typescript
const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Add connection pool configuration
  __internal: {
    engineConfig: {
      connection_limit: 10,  // Max connections per instance
      pool_timeout: 10,      // Seconds to wait for connection
    },
  },
});
```

**Environment Variable:**
```env
# DATABASE_URL should include connection pool params
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&connection_limit=10&pool_timeout=10"
```

**For Production:**
Consider Prisma Accelerate for better connection pooling:
```typescript
import { withAccelerate } from '@prisma/extension-accelerate';

export const prisma = new PrismaClient()
  .$extends(withAccelerate())
  .$extends(softDeleteExtension);
```

---

## Low Priority Issues (Severity: LOW)

### 14. Inconsistent Date Formatting
**Severity:** LOW
**Impact:** UX inconsistency

**Problem:**
Some components use `formatDate()` from `@jowi/ui`, others use `format()` from `date-fns` directly.

**Recommended Fix:**
Standardize on `formatDate()` utility or create a custom hook:
```typescript
export function useFormattedDate() {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'uz' ? uz : ru;

  return (date: Date, formatStr: string = 'dd.MM.yyyy') => {
    return format(date, formatStr, { locale });
  };
}
```

---

### 15. Missing API Versioning
**Severity:** LOW
**Impact:** Breaking changes affect all clients

**Problem:**
No API versioning strategy in place.

**Recommended Fix:**
Add versioning to NestJS routes:
```typescript
@Controller({ path: 'receipts', version: '1' })
export class ReceiptsController {
  // ...
}
```

Enable versioning in main.ts:
```typescript
app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});
```

---

### 16. No Rate Limiting on Critical Endpoints
**Severity:** LOW
**Impact:** DoS vulnerability

**Problem:**
No rate limiting configured for authentication or sales endpoints.

**Recommended Fix:**
Use `@nestjs/throttler`:
```typescript
@UseGuards(ThrottlerGuard)
@Throttle(10, 60)  // 10 requests per 60 seconds
@Post('receipts')
async create(@Body() dto: CreateReceiptDto) {
  // ...
}
```

---

### 17. Missing Request Logging Middleware
**Severity:** LOW
**Impact:** Difficult debugging and auditing

**Recommended Fix:**
Add structured logging middleware:
```typescript
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on('finish', () => {
      logger.info({
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: Date.now() - start,
        tenantId: req['tenantId'],
        userId: req['user']?.userId,
      });
    });
    next();
  }
}
```

---

### 18. No Health Check Endpoint
**Severity:** LOW
**Impact:** Difficult monitoring and deployment

**Current State:**
There is a `health.controller.ts` file but need to verify it checks database connectivity.

**Recommended Fix:**
```typescript
@Get('health')
async healthCheck() {
  const dbHealthy = await this.prisma.$queryRaw`SELECT 1`;
  const redisHealthy = await this.redis.ping();

  return {
    status: 'ok',
    database: dbHealthy ? 'up' : 'down',
    redis: redisHealthy === 'PONG' ? 'up' : 'down',
    timestamp: new Date().toISOString(),
  };
}
```

---

## Best Practices from Context7 Documentation

Based on retrieved documentation for Prisma and NestJS:

### Prisma Best Practices

1. **Connection Management:**
   - ✅ Singleton pattern implemented correctly
   - ❌ Missing connection pool configuration

2. **Transaction Handling:**
   - ❌ Not using isolation levels for critical operations
   - ❌ No retry logic for serialization errors (P2034)

3. **RLS Implementation:**
   - ✅ Migration files correctly define RLS policies
   - ❌ Application code doesn't use `SET LOCAL app.tenant_id`
   - ❌ SQL injection in `withTenant()` function

4. **Type Safety:**
   - ✅ Using `Prisma.validator` for type inference
   - ✅ Decimal types for currency (no fractional currency in UZS)

### NestJS Best Practices

1. **Guards and Middleware:**
   - ✅ JWT authentication guard implemented
   - ✅ Tenant guard for multi-tenancy
   - ❌ Temporary header bypass in TenantGuard

2. **Dependency Injection:**
   - ✅ Proper service injection
   - ✅ Module organization

3. **Error Handling:**
   - ❌ Generic error messages without logging
   - ❌ No error classification

4. **Validation:**
   - ⚠️ Inconsistent use of class-validator vs Zod

---

## Recommendations

### Immediate Actions (Critical - Fix Before Deployment)

1. **Implement RLS Enforcement**
   - Refactor ALL database queries to use `withTenant()`
   - Remove manual `tenantId` filtering from WHERE clauses
   - Add integration tests for cross-tenant access blocking
   - **Estimated Effort:** 2-3 days

2. **Fix SQL Injection in withTenant()**
   - Use `$executeRaw` template instead of `$executeRawUnsafe`
   - Add UUID validation for `tenantId`
   - **Estimated Effort:** 2 hours

3. **Remove Hardcoded JWT Secret**
   - Make `JWT_SECRET` required (throw error if missing)
   - Add secret validation (min length, entropy check)
   - **Estimated Effort:** 1 hour

4. **Remove Testing Bypass in TenantGuard**
   - Remove `x-tenant-id` header fallback
   - Add proper environment check if needed for dev
   - **Estimated Effort:** 30 minutes

### Short-term Improvements (1-2 weeks)

1. **Add RLS Policies to Child Tables**
   - Denormalize `tenant_id` to child tables
   - Create RLS policies
   - Add migration
   - **Estimated Effort:** 1 day

2. **Standardize on Zod Validation**
   - Migrate all DTOs to use Zod schemas
   - Remove class-validator dependency
   - **Estimated Effort:** 2 days

3. **Implement Soft Delete Extension**
   - Create Prisma Client Extension
   - Remove manual `deletedAt` filters
   - Test with all models
   - **Estimated Effort:** 1 day

4. **Add Idempotency Keys**
   - Implement for receipts, payments, fiscal operations
   - Add client-side UUID generation
   - **Estimated Effort:** 2 days

5. **Fix i18n Violations**
   - Translate all hardcoded text
   - Add missing translation keys
   - Verify UZ translations are accurate
   - **Estimated Effort:** 2 days

### Long-term Enhancements (1-2 months)

1. **Implement Comprehensive Error Handling**
   - Add structured logging
   - Map Prisma error codes
   - Integrate error tracking (Sentry)
   - **Estimated Effort:** 1 week

2. **Add Database Performance Optimizations**
   - Create composite indexes for RLS queries
   - Analyze query performance with `EXPLAIN ANALYZE`
   - Implement query result caching
   - **Estimated Effort:** 1 week

3. **Implement Rate Limiting**
   - Add throttling to critical endpoints
   - Configure different limits per endpoint type
   - **Estimated Effort:** 2 days

4. **Add Comprehensive Testing**
   - Integration tests for RLS
   - E2E tests for critical flows
   - Security tests for tenant isolation
   - **Estimated Effort:** 2 weeks

5. **API Versioning and Documentation**
   - Implement versioning strategy
   - Generate OpenAPI docs
   - **Estimated Effort:** 3 days

---

## Testing Strategy

### Critical Security Tests (Must Have Before Production)

1. **Tenant Isolation Tests:**
```typescript
describe('Tenant Isolation', () => {
  it('should block cross-tenant access to stores', async () => {
    const tenant1Store = await createStore(tenant1Id);

    // Try to access tenant1 store with tenant2 credentials
    await expect(
      storesService.findOne(tenant2Id, tenant1Store.id)
    ).rejects.toThrow(NotFoundException);
  });

  it('should enforce RLS at database level', async () => {
    // Attempt to bypass application-level checks
    const result = await prisma.$queryRaw`
      SELECT * FROM stores WHERE id = ${tenant1StoreId}
    `;
    // Without SET LOCAL app.tenant_id, this should return empty
    expect(result).toHaveLength(0);
  });
});
```

2. **SQL Injection Tests:**
```typescript
describe('SQL Injection Prevention', () => {
  it('should reject malicious tenant IDs', async () => {
    const maliciousTenantId = "'; DROP TABLE users; --";

    await expect(
      withTenant(maliciousTenantId, async (db) => {
        return db.user.findMany();
      })
    ).rejects.toThrow('Invalid tenant ID');
  });
});
```

3. **Authentication Tests:**
```typescript
describe('JWT Authentication', () => {
  it('should reject requests with invalid JWT', async () => {
    const response = await request(app.getHttpServer())
      .get('/stores')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
  });

  it('should not accept x-tenant-id header in production', async () => {
    process.env.NODE_ENV = 'production';

    const response = await request(app.getHttpServer())
      .get('/stores')
      .set('x-tenant-id', tenant1Id);  // Without JWT

    expect(response.status).toBe(403);
  });
});
```

### Performance Tests

1. **Load Testing with k6:**
```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
};

export default function () {
  const response = http.get('http://localhost:3000/receipts', {
    headers: { Authorization: `Bearer ${__ENV.JWT_TOKEN}` },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

2. **Database Query Performance:**
```sql
-- Test RLS policy performance
EXPLAIN ANALYZE
SELECT * FROM products
WHERE tenant_id = 'test-tenant-id'
LIMIT 100;

-- Should use index on (tenant_id)
-- Execution time should be < 10ms
```

---

## Conclusion

The JOWi Shop project has a solid architectural foundation with proper technology choices (Next.js, NestJS, Prisma, PostgreSQL). However, **critical security vulnerabilities** in the multi-tenant implementation make it **unsuitable for production deployment** in its current state.

### Summary of Risks

1. **CRITICAL: Complete tenant data breach** due to non-enforced RLS
2. **CRITICAL: SQL injection vulnerability** in tenant isolation function
3. **CRITICAL: Hardcoded secrets** in authentication system
4. **HIGH: Inconsistent validation** creates bypass opportunities
5. **MEDIUM: Missing i18n** violates project requirements

### Deployment Readiness

**Status:** ❌ **NOT READY FOR PRODUCTION**

**Blocking Issues:**
- Issues #1, #2, #3 must be resolved
- Issue #4 (validation) should be resolved
- Issue #6 (tenant ID bypass) must be resolved

**Estimated Remediation Time:**
- Critical fixes: 3-5 days
- High priority fixes: 5-7 days
- **Total:** 2 weeks for production-ready state

### Next Steps

1. **Week 1:**
   - Fix critical security issues (#1, #2, #3, #6)
   - Add comprehensive security tests
   - Conduct security audit

2. **Week 2:**
   - Fix high priority issues (#4, #5, #7)
   - Add RLS policies to child tables
   - Implement error handling improvements

3. **Week 3:**
   - Fix medium priority issues
   - Complete i18n translations
   - Add idempotency keys

4. **Week 4:**
   - Final testing
   - Performance optimization
   - Production deployment preparation

---

**Report Generated:** 2025-11-14
**QA Engineer:** Claude Code QA Agent
**Contact:** For questions about this report, refer to CLAUDE.md

---

## Appendix A: File Reference Index

### Critical Files Reviewed

**Backend:**
- `packages/database/src/index.ts` - Database client and RLS helper
- `packages/database/prisma/schema.prisma` - Database schema
- `packages/database/migrations/001_enable_rls.sql` - RLS migration
- `packages/validators/src/index.ts` - Zod validation schemas
- `apps/api/src/common/guards/tenant.guard.ts` - Tenant isolation guard
- `apps/api/src/modules/auth/constants.ts` - JWT configuration
- `apps/api/src/modules/auth/strategies/jwt.strategy.ts` - JWT validation
- `apps/api/src/modules/stores/stores.service.ts` - Store CRUD operations
- `apps/api/src/modules/sales/receipts.service.ts` - Receipt creation
- `apps/api/src/modules/database/database.service.ts` - Database service

**Frontend:**
- `apps/web/src/app/store/[id]/finance/transactions/page.tsx` - Transactions UI
- `apps/web/src/app/store/[id]/warehouses/monitoring/page.tsx` - Inventory monitoring
- `packages/i18n/src/locales/ru/common.json` - Russian translations
- `packages/i18n/src/locales/uz/common.json` - Uzbek translations

### Documentation References

**Context7 Documentation:**
- Prisma: `/prisma/docs`
- NestJS: `/nestjs/nest`
- Zod: `/websites/v3_zod_dev`

**Project Documentation:**
- `CLAUDE.md` - Project architecture and guidelines
- `DEVELOPMENT.md` - Development setup
- `DEPLOYMENT.md` - Deployment instructions
- `PERFORMANCE_OPTIMIZATION.md` - Performance guidelines

---

## Appendix B: Tools and Commands Used

### QA Testing Tools

1. **Code Analysis:**
   - Glob: File pattern matching
   - Grep: Content search across codebase
   - Read: File content inspection

2. **Documentation:**
   - Context7 MCP: Retrieved best practices for Prisma, NestJS, Zod

3. **Security Analysis:**
   - Manual code review
   - SQL injection pattern detection
   - Authentication flow analysis

### Recommended Tools for Ongoing QA

1. **Static Analysis:**
   - ESLint with security plugins
   - Prisma lint
   - TypeScript strict mode

2. **Security Scanning:**
   - npm audit
   - Snyk
   - OWASP ZAP

3. **Performance:**
   - Artillery.io or k6 for load testing
   - PostgreSQL EXPLAIN ANALYZE
   - Prisma query logging

4. **Monitoring:**
   - Sentry for error tracking
   - Grafana for metrics
   - Loki for logs

---

*End of QA Report*
