# JOWi Shop

**Multi-tenant retail management system (POS + ERP) for Uzbekistan market**

## Overview

JOWi Shop is a cloud-based SaaS platform combining point-of-sale, inventory management, sales tracking, financial operations, and basic CRM functionality. Built specifically for small and medium businesses in Uzbekistan with mandatory fiscalization support.

## Features

- **Multi-Tenancy:** SaaS architecture with Business → Store → Terminal hierarchy
- **Offline POS:** Flutter mobile app for Android tablets with Isar local database
- **Fiscalization:** Integration with Uzbekistan online cash registers
- **Inventory:** FIFO costing, movement documents, cycle counting
- **Sales:** Receipt management, multiple payment methods, discounts
- **CRM:** Customer management with JOWi Club loyalty integration
- **Reports:** Sales analytics, employee performance, stock reports
- **i18n:** Russian and Uzbek language support
- **Hardware Support:** Thermal printers, barcode scanners, fiscal devices

## Tech Stack

### Frontend
- **Web Admin:** Next.js 15 + React 19 + TypeScript
- **Mobile POS:** Flutter + Dart (Android 11+, tablets 10"+)
- **Web UI Library:** Tailwind CSS + shadcn/ui + Radix primitives
- **Mobile UI:** Material Design 3 with custom theming
- **Web Forms:** React Hook Form + Zod validation
- **Mobile Forms:** flutter_form_builder + form_builder_validators
- **Tables:** TanStack Table (web), DataTable widgets (mobile)

### Backend
- **API:** NestJS + TypeScript
- **Database:** PostgreSQL with Row-Level Security (RLS)
- **ORM:** Prisma
- **Cache/Queues:** Redis
- **Event Broker:** NATS
- **Analytics:** ClickHouse (via CDC pipeline)

### Shared Packages
- `@jowi/ui` - Shared UI components (for web admin)
- `@jowi/database` - Prisma schema and client
- `@jowi/validators` - Zod validation schemas (API-side)
- `@jowi/i18n` - Internationalization for web (RU/UZ)
- `@jowi/types` - Shared TypeScript types (reference for Dart models)

### Mobile POS Stack
- **Local Database:** Isar (high-performance NoSQL for 50k-200k products)
- **State Management:** Riverpod (flutter_riverpod)
- **HTTP Client:** dio + retrofit
- **Background Sync:** WorkManager + isolates
- **Barcode Scanner:** mobile_scanner (camera) + USB OTG (keyboard wedge)
- **Thermal Printer:** esc_pos_bluetooth / esc_pos_printer
- **i18n:** easy_localization (RU/UZ)
- **Platform Channels:** Kotlin/Java for fiscal device integration

## Project Structure

```
JOWi-Shop/
├── apps/
│   ├── web/              # Next.js admin panel
│   ├── api/              # NestJS backend
│   └── mobile/           # Flutter POS (Android)
├── packages/
│   ├── ui/               # Shared UI components (web)
│   ├── database/         # Prisma schema
│   ├── validators/       # Zod schemas
│   ├── i18n/            # Translations (web)
│   └── types/           # TypeScript types
├── docker/              # Docker configs
├── PRD/                 # Product requirements
└── docs/               # Documentation
```

## Getting Started

### Prerequisites

**For Backend & Web Admin:**
- **Node.js** 20+
- **pnpm** 9+
- **Docker** and Docker Compose
- **PostgreSQL** 15+ (via Docker)

**For Mobile POS (optional, only if developing Flutter app):**
- **Flutter SDK** 3.16+
- **Dart** 3.0+
- **Android Studio** with Android SDK (API 30+)
- **Android device/emulator** running Android 11+ (for testing)

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

# Flutter POS (Android)
cd apps/mobile
flutter pub get
flutter run
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

### Offline-First POS (Flutter/Android)

The mobile POS client uses:
- **Platform:** Flutter for Android 11+ tablets (10"+ screens)
- **Local Database:** Isar (high-performance NoSQL) for 50k-200k products
- **Sync Pattern:** Outbox/Inbox queues with WorkManager background sync
- **Conflict Resolution:** Last-write-wins for sales, merge for catalog
- **Idempotency:** UUID-based operation IDs
- **Auto-Update:** Google Play Store (production) or manual APK distribution (MVP)
- **Performance Optimization:**
  - Lazy loading and virtualization for large catalogs
  - Debounced search (300ms)
  - Indexed queries on barcode, name, category
  - In-memory cache for popular products
  - Background sync in isolates (non-blocking)

### Fiscalization

All sales must be fiscalized through certified online cash registers:
- **Abstraction:** `FiscalProvider` interface
- **Queue System:** Retry queue with error logging
- **Operations:** `openShift()`, `registerSale()`, `refund()`, `closeShift()`
- **Flutter Integration:**
  - **Option A (MVP):** REST API to fiscal-gateway service
  - **Option B (Future):** Direct connection via Platform Channels (Kotlin/Java SDK)

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

## Flutter POS Development

### Setup Flutter Environment

1. **Install Flutter SDK:**
   ```bash
   # Windows (using chocolatey)
   choco install flutter

   # Or download from https://flutter.dev/docs/get-started/install
   ```

2. **Install Android Studio:**
   - Download from https://developer.android.com/studio
   - Install Android SDK (API 30 or higher)
   - Create Android emulator or connect physical device

3. **Verify installation:**
   ```bash
   flutter doctor
   ```

### Flutter POS Commands

```bash
cd apps/mobile

# Get dependencies
flutter pub get

# Run on emulator/device
flutter run

# Build APK for testing
flutter build apk --debug

# Build release APK
flutter build apk --release

# Build App Bundle for Play Store
flutter build appbundle --release

# Run tests
flutter test

# Analyze code
flutter analyze
```

### Hardware Testing

The Flutter POS app requires testing with real hardware:

**Supported Hardware:**
- **Thermal Printers:** Bluetooth (esc_pos_bluetooth), Network (esc_pos_printer), USB (via OTG)
- **Barcode Scanners:** USB OTG (keyboard wedge), Camera (mobile_scanner)
- **Fiscal Devices:** REST API (fiscal-gateway) or direct via Platform Channels

**Recommended Test Device:**
- Samsung Tab A8 10.5" or similar
- Android 11 (API 30) or higher
- 4GB RAM minimum
- USB OTG adapter for hardware peripherals

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
