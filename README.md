# JOWi Shop

**Multi-tenant retail management system (POS + ERP) for Uzbekistan market**

## Overview

JOWi Shop is a cloud-based SaaS platform combining point-of-sale, inventory management, sales tracking, financial operations, and basic CRM functionality. Built specifically for small and medium businesses in Uzbekistan with mandatory fiscalization support.

## Features

- **Multi-Tenancy:** SaaS architecture with Business → Store → Terminal hierarchy
- **Offline POS:** Desktop Electron app with local SQLite database
- **Fiscalization:** Integration with Uzbekistan online cash registers
- **Inventory:** FIFO costing, movement documents, cycle counting
- **Sales:** Receipt management, multiple payment methods, discounts
- **CRM:** Customer management with JOWi Club loyalty integration
- **Reports:** Sales analytics, employee performance, stock reports
- **i18n:** Russian and Uzbek language support

## Tech Stack

### Frontend
- **Web Admin:** Next.js 15 + React 19 + TypeScript
- **Desktop POS:** Electron + React + Vite (planned)
- **UI Library:** Tailwind CSS + shadcn/ui + Radix primitives
- **Forms:** React Hook Form + Zod validation
- **Tables:** TanStack Table

### Backend
- **API:** NestJS + TypeScript
- **Database:** PostgreSQL with Row-Level Security (RLS)
- **ORM:** Prisma
- **Cache/Queues:** Redis
- **Event Broker:** NATS
- **Analytics:** ClickHouse (via CDC pipeline)

### Shared Packages
- `@jowi/ui` - Shared UI components
- `@jowi/database` - Prisma schema and client
- `@jowi/validators` - Zod validation schemas
- `@jowi/i18n` - Internationalization (RU/UZ)
- `@jowi/types` - Shared TypeScript types

## Project Structure

```
JOWi-Shop/
├── apps/
│   ├── web/              # Next.js admin panel
│   ├── api/              # NestJS backend
│   └── desktop/          # Electron POS (planned)
├── packages/
│   ├── ui/               # Shared UI components
│   ├── database/         # Prisma schema
│   ├── validators/       # Zod schemas
│   ├── i18n/            # Translations
│   └── types/           # TypeScript types
├── docker/              # Docker configs
├── PRD/                 # Product requirements
└── docs/               # Documentation
```

## Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **Docker** and Docker Compose
- **PostgreSQL** 15+ (via Docker)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd JOWi-Shop
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Docker services:**
   ```bash
   pnpm docker:up
   ```
   This starts PostgreSQL, Redis, NATS, and ClickHouse.

5. **Generate Prisma client:**
   ```bash
   pnpm db:generate
   ```

6. **Push database schema:**
   ```bash
   pnpm db:push
   ```

7. **Seed the database (optional):**
   ```bash
   pnpm db:seed
   ```

### Development

Run all apps in development mode:

```bash
pnpm dev
```

Or run specific apps:

```bash
# Backend API
cd apps/api
pnpm dev

# Web admin
cd apps/web
pnpm dev
```

### Access Points

- **Web Admin:** http://localhost:3000
- **API:** http://localhost:3001
- **API Docs:** http://localhost:3001/api/docs
- **Database Studio:** `pnpm db:studio`
- **pgAdmin:** http://localhost:5050 (credentials in .env.example)

### Demo Credentials

After running `pnpm db:seed`:

- **Email:** admin@jowi.shop
- **Password:** admin123

## Available Scripts

### Root Level

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type-check all packages
- `pnpm format` - Format code with Prettier
- `pnpm clean` - Clean all build artifacts

### Database

- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema to database
- `pnpm db:migrate` - Run migrations
- `pnpm db:studio` - Open Prisma Studio
- `pnpm db:seed` - Seed database with demo data

### Docker

- `pnpm docker:up` - Start Docker services
- `pnpm docker:down` - Stop Docker services
- `pnpm docker:logs` - View Docker logs

## Architecture

### Multi-Tenancy

Every database table includes a `tenant_id` column with RLS policies enforcing data isolation at the database level. JWT tokens include `tenant_id` claims for API authorization.

### Offline-First POS

The desktop POS client uses:
- **Local Database:** SQLite with WAL mode
- **Sync Pattern:** Outbox/Inbox queues
- **Conflict Resolution:** Last-write-wins for sales, merge for catalog
- **Idempotency:** UUID-based operation IDs

### Fiscalization

All sales must be fiscalized through certified online cash registers:
- **Abstraction:** `FiscalProvider` interface
- **Queue System:** Retry queue with error logging
- **Operations:** `openShift()`, `registerSale()`, `refund()`, `closeShift()`

## Deployment

### Environment Variables

See `.env.example` for required environment variables.

### Database Migrations

```bash
pnpm db:migrate:deploy
```

### Build for Production

```bash
pnpm build
```

### Docker Production Build

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For issues and questions, please contact the development team.

---

**Built with ❤️ for Uzbekistan retail businesses**
