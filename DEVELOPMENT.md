# Development Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start Docker services:**
   ```bash
   pnpm docker:up
   ```

3. **Set up database:**
   ```bash
   cp .env.example .env
   pnpm db:generate
   pnpm db:push
   pnpm db:seed
   ```

4. **Start development servers:**
   ```bash
   pnpm dev
   ```

## Project Organization

### Monorepo Structure

This project uses **pnpm workspaces** with **Turborepo** for efficient builds and caching.

- `apps/*` - Applications (api, web, desktop)
- `packages/*` - Shared libraries (ui, database, validators, i18n, types)

### Shared Packages

#### `@jowi/database`
Prisma schema and client for database access.

```typescript
import { prisma } from '@jowi/database';

const users = await prisma.user.findMany();
```

#### `@jowi/validators`
Zod schemas for validation (shared between frontend and backend).

```typescript
import { createProductSchema } from '@jowi/validators';

const result = createProductSchema.parse(data);
```

#### `@jowi/types`
Shared TypeScript types.

```typescript
import type { Business, Store } from '@jowi/types';
```

#### `@jowi/i18n`
Translation files for Russian and Uzbek.

```typescript
import { resources } from '@jowi/i18n';
```

#### `@jowi/ui`
Shared React components built with Tailwind + Radix.

```typescript
import { Button, Card } from '@jowi/ui';
```

## Database Development

### Schema Changes

1. Edit `packages/database/prisma/schema.prisma`
2. Generate client: `pnpm db:generate`
3. Create migration: `pnpm db:migrate`
4. Update seed data if needed in `packages/database/src/seed.ts`

### Multi-Tenancy Rules

**Every table MUST have:**
- `tenantId` column (mapped to `tenant_id`)
- Index on `tenantId`
- Relationship to `Business` model

**Example:**
```prisma
model Product {
  id       String @id @default(uuid())
  tenantId String @map("tenant_id")
  name     String

  business Business @relation(fields: [tenantId], references: [id])

  @@index([tenantId])
}
```

### Querying with Tenant Context

Always filter by `tenantId`:

```typescript
const products = await prisma.product.findMany({
  where: { tenantId: user.tenantId },
});
```

## API Development (NestJS)

### Module Structure

```
src/modules/
  ├── auth/
  ├── products/
  ├── inventory/
  ├── sales/
  └── customers/
```

### Creating a New Module

```bash
cd apps/api
nest generate module modules/example
nest generate service modules/example
nest generate controller modules/example
```

### Using Zod Validators

```typescript
import { createProductSchema } from '@jowi/validators';

@Post()
create(@Body() body: unknown) {
  const data = createProductSchema.parse(body);
  return this.service.create(data);
}
```

### Accessing Database

```typescript
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ProductsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(tenantId: string) {
    return this.db.client.product.findMany({
      where: { tenantId },
    });
  }
}
```

## Web Development (Next.js)

### App Router Structure

```
src/app/
  ├── layout.tsx
  ├── page.tsx
  ├── dashboard/
  ├── products/
  └── inventory/
```

### Using Shared Components

```typescript
import { Button, Card, Input } from '@jowi/ui';
import { createProductSchema } from '@jowi/validators';
import type { Product } from '@jowi/types';
```

### Internationalization

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common');

  return <h1>{t('app.name')}</h1>;
}
```

## UI Component Development

Components follow **shadcn/ui** patterns with Tailwind + Radix.

### Creating a New Component

1. Create file in `packages/ui/src/components/`
2. Use `cn()` utility for className merging
3. Forward refs for all interactive components
4. Export from `packages/ui/src/index.ts`

**Example:**
```typescript
import * as React from 'react';
import { cn } from '../lib/utils';

export interface MyComponentProps extends React.HTMLAttributes<HTMLDivElement> {}

const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('base-classes', className)} {...props} />
  )
);
MyComponent.displayName = 'MyComponent';

export { MyComponent };
```

## Testing

### Unit Tests

```bash
# Run tests in specific package
cd apps/api
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:cov
```

### Integration Tests

Coming soon.

## Code Quality

### Linting

```bash
# Lint all packages
pnpm lint

# Auto-fix
pnpm lint --fix
```

### Type Checking

```bash
# Check all packages
pnpm type-check
```

### Formatting

```bash
# Format all files
pnpm format

# Check formatting
pnpm format:check
```

## Git Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation

### Commit Messages

Use conventional commits:

```
feat: add product variant support
fix: resolve stock calculation bug
docs: update API documentation
refactor: simplify auth logic
```

## Troubleshooting

### Database Connection Issues

```bash
# Check Docker containers
docker ps

# Restart PostgreSQL
pnpm docker:down
pnpm docker:up
```

### Prisma Client Out of Sync

```bash
pnpm db:generate
```

### Port Already in Use

Change ports in `.env`:
```
PORT=3001  # API port
```

### Module Resolution Errors

```bash
# Clear node_modules and reinstall
pnpm clean
pnpm install
```

### Turbo Cache Issues

```bash
# Clear Turbo cache
rm -rf .turbo
pnpm dev
```

## Performance

### Build Optimization

Turbo automatically caches builds. To clear:

```bash
turbo run build --force
```

### Development Mode

Hot reload is enabled for all apps. Changes to shared packages trigger rebuilds automatically.

## Debugging

### Backend (NestJS)

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug API",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["--filter", "@jowi/api", "dev"],
  "console": "integratedTerminal"
}
```

### Frontend (Next.js)

Use browser DevTools and React DevTools extension.

## Resources

- [Turborepo Docs](https://turbo.build/repo/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [shadcn/ui](https://ui.shadcn.com)
