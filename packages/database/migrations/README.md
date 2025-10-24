# Database Migrations

This directory contains SQL migrations for JOWi Shop database.

## Applying Migrations

### Option 1: Manual Application (Development)

Connect to your PostgreSQL database and run the migration files in order:

```bash
# Connect to database
psql -U postgres -d jowi_shop

# Run migrations
\i packages/database/migrations/001_enable_rls.sql
```

### Option 2: Using psql command line

```bash
psql -U postgres -d jowi_shop -f packages/database/migrations/001_enable_rls.sql
```

### Option 3: Docker Exec (if using Docker)

```bash
docker exec -i jowi-postgres psql -U postgres -d jowi_shop < packages/database/migrations/001_enable_rls.sql
```

## Migration Files

- `001_enable_rls.sql` - Enables Row-Level Security (RLS) for multi-tenancy isolation

## Important Notes

1. **Order Matters**: Apply migrations in numerical order (001, 002, 003, etc.)
2. **Run After Prisma Migrate**: These migrations should be run AFTER `prisma migrate dev`
3. **Idempotent**: Migrations use `IF NOT EXISTS` where possible to be safely re-runnable
4. **Testing**: Always test migrations on a development database first

## RLS Integration

After applying RLS migrations, the application must set `app.tenant_id` before queries:

```typescript
// In application code (see packages/database/src/index.ts)
await prisma.$executeRaw`SET LOCAL app.tenant_id = ${tenantId}`;
```

This is handled by the `withTenant()` utility function.
