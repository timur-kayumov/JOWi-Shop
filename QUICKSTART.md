# Quick Start Guide

Get JOWi Shop running in 5 minutes!

## Prerequisites

✅ **Node.js 20+** - [Download](https://nodejs.org)
✅ **pnpm 9+** - Install: `npm install -g pnpm`
✅ **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)

## Setup Steps

### 1. Install Dependencies

```bash
pnpm install
```

This installs all dependencies for the monorepo (takes ~2-3 minutes).

### 2. Configure Environment

```bash
cp .env.example .env
```

The default values work for local development - no changes needed!

### 3. Start Docker Services

```bash
pnpm docker:up
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- NATS (port 4222)
- ClickHouse (port 8123)

### 4. Initialize Database

```bash
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Create database schema
pnpm db:seed        # Add demo data
```

### 5. Start Development Servers

```bash
pnpm dev
```

This starts all apps concurrently:
- **API:** http://localhost:3001
- **Web:** http://localhost:3000

## Access Your Apps

### Web Admin Panel
🌐 **URL:** http://localhost:3000

### API & Documentation
🌐 **API:** http://localhost:3001
📚 **Docs:** http://localhost:3001/api/docs

### Database Tools
🗄️ **Prisma Studio:** `pnpm db:studio` (http://localhost:5555)
🐘 **pgAdmin:** http://localhost:5050 (optional, start with `docker-compose --profile tools up`)

## Demo Credentials

After seeding, you can log in with:

```
Email: admin@jowi.shop
Password: admin123
```

## Verify Everything Works

### Check API Health

```bash
curl http://localhost:3001/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-23T...",
  "service": "jowi-shop-api",
  "version": "0.1.0"
}
```

### Check Database

```bash
pnpm db:studio
```

Opens Prisma Studio - you should see demo data in:
- Business
- Store
- User
- Product
- Terminal

## Common Commands

```bash
# Development
pnpm dev              # Start all apps
pnpm build            # Build all apps
pnpm lint             # Lint all packages
pnpm type-check       # Type-check all packages

# Database
pnpm db:studio        # Open database UI
pnpm db:seed          # Reseed database

# Docker
pnpm docker:up        # Start services
pnpm docker:down      # Stop services
pnpm docker:logs      # View logs

# Cleanup
pnpm clean            # Remove build artifacts
```

## Project Structure

```
JOWi-Shop/
├── apps/
│   ├── api/          ← NestJS backend
│   ├── web/          ← Next.js admin panel
│   └── desktop/      ← Electron POS (stub)
├── packages/
│   ├── database/     ← Prisma schema
│   ├── ui/           ← Shared components
│   ├── validators/   ← Zod schemas
│   ├── i18n/         ← Translations (RU/UZ)
│   └── types/        ← TypeScript types
└── docker/           ← Docker configs
```

## Next Steps

1. **Explore the API:**
   - Visit http://localhost:3001/api/docs
   - Try the authentication endpoints
   - Test product CRUD operations

2. **Customize the Web App:**
   - Edit `apps/web/src/app/page.tsx`
   - Add new routes in `apps/web/src/app/`
   - Use components from `@jowi/ui`

3. **Add Backend Features:**
   - Create new modules in `apps/api/src/modules/`
   - Use Prisma client from `@jowi/database`
   - Share validators from `@jowi/validators`

4. **Read the Docs:**
   - [README.md](./README.md) - Full project overview
   - [DEVELOPMENT.md](./DEVELOPMENT.md) - Development guide
   - [PRD](./PRD/PRD%20JOWi%20Shop.md) - Product requirements

## Troubleshooting

### Port Already in Use

If port 3000 or 3001 is taken, change in `.env`:
```
PORT=3002  # API port
```

### Database Connection Failed

1. Check Docker is running: `docker ps`
2. Restart services: `pnpm docker:down && pnpm docker:up`
3. Wait 10 seconds for PostgreSQL to start

### Dependencies Won't Install

1. Clear cache: `pnpm store prune`
2. Delete `node_modules`: `rm -rf node_modules`
3. Reinstall: `pnpm install`

### Prisma Client Out of Sync

```bash
pnpm db:generate
```

## Need Help?

- Check [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed guides
- Review [CLAUDE.md](./CLAUDE.md) for project conventions
- Contact the development team

---

**Happy coding! 🚀**
