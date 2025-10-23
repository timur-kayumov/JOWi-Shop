# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JOWi Shop is a cloud-based retail management system (POS + ERP) for small and medium businesses in Uzbekistan. It's a multi-tenant SaaS platform combining point-of-sale, inventory management, sales tracking, financial operations, and basic CRM functionality.

**Target Market:** Uzbekistan (with potential expansion to neighboring regions)
**Currency:** UZS (Uzbek Som) only - no fractional currency needed
**Languages:** Russian (RU) and Uzbek (UZ)
**Regulatory:** Must comply with Uzbekistan fiscalization and product marking requirements

## Planned Technology Stack

### Frontend
- **Desktop POS Client:** Electron + React + Vite (offline-first Windows application)
- **Web Admin Panel:** Next.js (App Router) + React
- **Shared UI Library:** `@jowi/ui` package using Tailwind CSS + shadcn/ui + Radix primitives
- **Forms:** React Hook Form + Zod validation
- **Tables:** TanStack Table with server-side pagination and virtualization
- **Icons:** lucide-react (sizes: 16px, 20px, 24px only)
- **Charts:** Recharts (Bar, Line, Pie charts only)
- **i18n:** i18next with namespaces: `common`, `pos`, `inventory`, `finance`

### Backend
- **Framework:** NestJS with tRPC-style contracts
- **Validation:** Zod schemas (shared between frontend and backend)
- **ORM:** Prisma
- **Database:** PostgreSQL with Row-Level Security (RLS) for tenant isolation
- **Migrations:** Prisma + dbmate
- **Cache/Queues:** Redis
- **Event Broker:** NATS (optional)
- **Analytics DB:** ClickHouse with CDC pipeline (Postgres → Debezium → Kafka/NATS → ClickHouse)
- **Authentication:** Auth.js or Clerk with JWT (tenant_id in claims), 2FA support
- **Observability:** OpenTelemetry + Grafana/Loki/Tempo

### POS Offline Architecture
- **Local Database:** SQLite with Write-Ahead Logging (WAL mode)
- **Sync Pattern:** Outbox/Inbox queues with idempotent commands
- **Conflict Resolution:** Last-write-wins for sales transactions, merge rules for catalog data
- **Auto-update:** Electron auto-updater for desktop client

## Multi-Tenant Architecture

**Hierarchy:** Business (tenant) → Store (location) → Terminal (POS device)

**Data Isolation:**
- Every database table must have a `tenant_id` column
- PostgreSQL RLS policies enforce tenant isolation at database level
- JWT tokens include `tenant_id` claim for API authorization
- Never query across tenants

## Core Domain Entities

- **Business, Store, Terminal, Employee, Role, Shift**
- **Customer, Loyalty Card**
- **Product, Variant (SKU), Barcode, Category, Tax**
- **Warehouse, Stock, Batch (FIFO costing), Movement Documents**
- **Receipt, Line Item, Discount, Payment**
- **Transaction, Cash Operation**
- **Integration (JOWi Club loyalty system)**
- **LoyaltyTransaction (interaction log with JOWi Club)**
- **Terminal Settings (device binding, printer config, fiscal provider)**
- **User Permissions (role + operation-level access control)**

## Critical Regulatory Requirements

### Fiscalization (Mandatory)
- **Uzbekistan Compliance:** All sales must be fiscalized through certified online cash registers
- **Abstraction:** `FiscalProvider` interface with adapters for local fiscal devices (Shtrih, ATOL, Payme-POS, etc.)
- **Core Operations:** `openShift()`, `registerSale()`, `refund()`, `closeShift()`
- **Queue System:** All fiscal operations go through a retry queue with error logging
- **Auto-recovery:** Automatic reconnection after network failures
- **Receipt Format:** ESC/POS templates, 48-character monospace width, QR codes mandatory
- **Reports:** Support for X-reports (shift summary) and Z-reports (shift close)
- **Service:** Separate `fiscal-gateway` microservice handles fiscal device communication

### Product Marking
- **System:** AslBelgisi (Uzbekistan national digital marking)
- **Capability:** Scan DataMatrix codes, integrate with marking API (optional in MVP)
- **Classifiers:** Support for TASNIФ and IKPU classification codes

## POS Design Principles

1. **Offline-First:** All critical POS operations work without internet connection
2. **Keyboard-Driven:** Hotkeys for all major actions
3. **Scanner-Friendly:** Barcode input handled as hidden field, instant item addition to receipt
4. **Touch-Optimized:** Minimum 40px touch targets for all interactive elements
5. **Receipt Visibility:** Current receipt items displayed prominently on right side or bottom
6. **Quick Operations:** Fast discount application, payment method selection, loyalty card scanning
7. **Auto-Update:** Background updates with minimal user interruption

## UI/UX Standards (Design System)

### Color & Typography
- **Tokens:** CSS variables for theming (support light/dark modes)
- **Fonts:** System fonts only
- **Grid:** 1200-1440px containers, 8pt spacing system
- **Accessibility:** WCAG compliant, focus rings enabled, contrast ratio ≥4.5:1

### Standard Components (from `@jowi/ui`)
- AppShell, Sidebar, Topbar
- DataTable (with filters, sorting, export to CSV)
- Form, Input, Select, DatePicker
- Dialog, Drawer, Toast
- Tabs, Wizard
- KPI Cards, Chart primitives

### Loading States
- Standardized empty, loading, error states
- Shared skeleton loaders and spinners
- Never show raw error messages to end users

### Forms
- React Hook Form + Zod validation
- Shared `FormField` and `FormDialog` components
- Error messages from translation files

### i18n
- All text from translation dictionaries (no hardcoded strings)
- Date format: DD.MM.YYYY for RU/UZ locales
- Number format: UZS with thousand separators, no decimal places
- i18next namespaces keep translations organized

## Data Patterns

### Inventory Management
- **Costing:** FIFO batch tracking
- **Movement Documents:** Receipt, Transfer, Return to Supplier, Write-off, Inventory Count
- **Cycle Counting:** Partial inventory counts supported
- **Auto-updates:** Stock levels and cost basis updated automatically
- **Alerts:** Low stock notifications
- **History:** Full movement history per product

### Financial Operations
- **Cash Shifts:** Open/close with X/Z reports
- **Payment Types:** Cash, card (acquiring), transfer, installment
- **Cash Book:** Track all cash in/out operations
- **Accounts:** Supplier and customer account balances
- **Double-Entry:** Internal accounting subsystem with transaction journal
- **No GL Integration:** System handles retail finance only, not full accounting

### Reporting & Analytics
- **Data Warehouse:** ClickHouse for analytical queries
- **CDC Pipeline:** Change Data Capture from Postgres to ClickHouse
- **Standard Reports:**
  - Sales by period/hour/product/category
  - Employee performance metrics
  - Stock levels and turnover
  - Shift reports
- **Export:** CSV/Excel export for all reports
- **Extensibility:** New reports added without modifying core code

## Access Control

### Default Roles (RBAC)
- **Administrator:** Full system access across all stores
- **Manager:** Store-level operations, all reports for assigned store(s)
- **Cashier:** POS operations only (sales, returns, shift management)
- **Warehouse Staff:** Inventory operations only (receiving, transfers, counts)

### Permissions
- Role-based with operation-level granularity
- Store-level and terminal-level restrictions
- Custom permissions can be assigned per user

### Authentication & Security
- JWT tokens with `tenant_id` and user role claims
- 2FA support (SMS or authenticator app)
- Session management per device/terminal
- Immutable audit log for all critical operations (who/when/what)

## Integration Architecture

### JOWi Club (Loyalty System)
- **Protocol:** REST API + Webhooks
- **Operations:** Earn points, redeem points, check balance, get customer tier
- **Data Storage:** Points/tiers stored in JOWi Club; transaction log stored locally in `LoyaltyTransaction`
- **Events:** Webhook notifications for point balance changes, tier upgrades

### Integration Hub (Future)
- **Purpose:** Extensibility point for future integrations (marketplaces, ERPs, external CRMs)
- **Pattern:** Event-driven architecture using NATS
- **Webhooks:** Outbound webhooks for events: `sale.created`, `stock.updated`, `shift.closed`

## Development Guidelines

### Code Organization
- **Monorepo:** Likely structure with shared packages
- **Shared Types:** Zod schemas shared between frontend and backend
- **UI Package:** `@jowi/ui` for all reusable components
- **No Hardcoding:** All text from i18n files, all config from environment variables

### Database Patterns
- **Always include `tenant_id`:** Every table must have tenant_id column with RLS policy
- **Migrations:** Use Prisma migrations + dbmate for complex SQL (like RLS policies)
- **Indexes:** Add indexes for tenant_id + frequently queried columns
- **Soft Deletes:** Use `deleted_at` timestamp instead of hard deletes for audit trail

### API Patterns
- **Validation:** Zod schemas on all endpoints
- **Idempotency:** Use idempotency keys for critical operations (sales, payments, fiscal operations)
- **Error Handling:** Structured error responses with error codes
- **Retry Logic:** Exponential backoff for fiscal operations and external integrations

### POS Sync Pattern
- **Outbox:** Local changes written to outbox table, background job syncs to server
- **Inbox:** Server changes written to inbox table, applied on client
- **Conflict Resolution:** Last-write-wins for transactions, field-level merge for master data
- **Operation IDs:** UUIDs for all operations to ensure idempotency

## Out of Scope for MVP

- Marketplace integrations
- Complex promotion engines (basic discount rules only)
- Recipe/production management
- Multi-currency support
- E-commerce storefront
- Mobile clients (iOS/Android)

## Success Metrics for MVP

- Average receipt processing time
- Offline mode stability (uptime percentage)
- Sync success rate (percentage of successful syncs)
- Inventory count time reduction (vs manual counting)

## Print Templates

- **Receipt Printer:** ESC/POS commands for 80mm thermal printers
- **Format:** 48-character monospace width
- **Required Elements:** QR code (fiscal), store info, items, totals, payment method
- **Languages:** Support RU and UZ text on receipts

## When Building This System

1. **Start with multi-tenancy:** Set up RLS policies from day one
2. **Shared UI first:** Build `@jowi/ui` package before app-specific code
3. **Offline capability:** Design POS sync architecture before implementing features
4. **Fiscal compliance:** Implement fiscal gateway abstraction early
5. **Type safety:** Share Zod schemas between frontend and backend
6. **i18n from start:** Never hardcode text, use translation keys from the beginning
7. **Test fiscal flows:** Mock fiscal devices for automated testing
