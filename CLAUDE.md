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
- **Mobile POS Client:** Flutter (offline-first Android application for tablets)
  - **Framework:** Flutter SDK 3.16+
  - **Language:** Dart 3.0+
  - **State Management:** Riverpod (flutter_riverpod)
  - **UI:** Material Design 3 with custom theming
  - **Forms:** flutter_form_builder + form_builder_validators
  - **i18n:** easy_localization (RU/UZ)
  - **Target Devices:** Android tablets 10"+ (Samsung Tab A8 and similar)
  - **Minimum Requirements:** Android 11 (API 30), 4GB RAM
- **Web Admin Panel:** Next.js (App Router) + React
- **Shared UI Library:** `@jowi/ui` package using Tailwind CSS + shadcn/ui + Radix primitives (for web admin only)
- **Forms (Web):** React Hook Form + Zod validation
- **Tables (Web):** TanStack Table with server-side pagination and virtualization
- **Icons (Web):** lucide-react (sizes: 16px, 20px, 24px only)
- **Charts (Web):** Recharts (Bar, Line, Pie charts only)
- **i18n (Web):** i18next with namespaces: `common`, `pos`, `inventory`, `finance`

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

### POS Offline Architecture (Flutter/Android)
- **Local Database:** Isar (high-performance NoSQL) or drift (type-safe SQL) with automatic indexing
  - **Recommendation:** Isar for catalogs 50k-200k products (10x faster than sqflite)
  - **Alternative:** drift for complex relational queries (similar to Prisma)
- **Sync Pattern:** Outbox/Inbox queues with idempotent commands
- **Background Sync:** WorkManager for reliable background synchronization
- **Conflict Resolution:** Last-write-wins for sales transactions, merge rules for catalog data
- **Auto-update:** Google Play Store (recommended) or manual APK distribution with in-app update checks
- **Performance Optimization:**
  - Lazy loading and pagination for large product catalogs
  - Virtual scrolling (infinite scroll with cached items)
  - Debounced search (300ms delay)
  - Indexed search on barcode, name, category
  - In-memory cache for frequently accessed products

### Mobile Application Auto-Update System (Flutter/Android)
The Android POS application requires an automatic update mechanism to ensure all users always have the latest version without manual intervention.

**Core Requirements:**
- **Automatic Update Detection:** App checks for updates on startup and periodically (every 4-6 hours)
- **Background Download:** New versions download automatically in the background without interrupting POS operations
- **User Notification:** When update is ready, show non-intrusive notification with "Install Update" button
- **Deferred Installation:** Users can continue working and install updates during breaks or shift changes
- **Mandatory Updates:** Critical security/fiscal compliance updates can be marked as mandatory
- **Rollback Capability:** Support for uninstalling and reverting to previous version if update causes issues

**Technical Implementation:**

**Option A: Google Play Store (Recommended for Production)**
- **Distribution:** Google Play Store internal/alpha/beta/production tracks
- **Update Framework:** Native Android auto-update (no custom code needed)
- **User Experience:** Seamless background updates, managed by Play Store
- **Testing:** Internal testing track for team, closed beta for pilot stores
- **Rollback:** Play Store version rollback feature
- **Code Signing:** Automatic via Play Store

**Option B: Manual APK Distribution (for MVP/Testing)**
- **Distribution Server:** Custom S3/CDN server or Firebase App Distribution
- **Update Framework:** `flutter_downloader` + `package_info_plus` for version checking
- **Version Manifest:** Server hosts JSON manifest with version info, release notes, download URLs
- **Update Format:** APK with SHA-256 checksums
- **Code Signing:** Android keystore signing required
- **Update Channels:**
  - `stable` - Production releases for all users
  - `beta` - Early access for testing new features (opt-in)

**Update Flow (Manual APK):**
1. App checks update server on startup and every 4-6 hours
2. Compare current version with latest version from server
3. If new version available, download APK in background
4. Once downloaded and verified, show toast notification: "Обновление готово к установке"
5. User clicks "Установить обновление" button or defers to later
6. On install trigger: save current state, request INSTALL_PACKAGES permission, launch installer
7. After installation, app restarts automatically
8. New version validates database schema compatibility and applies migrations if needed

**Offline Considerations:**
- If tablet is offline, update check fails silently
- When connection restored, update check resumes
- Updates never interrupt active sales transactions
- Shift must be closed before mandatory updates install

**Error Handling:**
- If update download fails, retry with exponential backoff (max 3 retries)
- If installation fails, show error message and keep current version
- All update events logged to local database and synced to server
- Failed updates reported to central monitoring system

**User Experience:**
- Minimal disruption to POS operations
- Clear update progress indication with percentage
- Option to view release notes before installing
- Estimated installation time shown (typically 30-60 seconds)
- No user action required for Play Store updates

**Security:**
- Only signed APKs from trusted sources accepted
- HTTPS-only communication with update server
- Certificate pinning to prevent MITM attacks (for manual APK distribution)
- SHA-256 checksum verification before installation
- Android package signature verification

**Permissions Required:**
```xml
<!-- For manual APK updates -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

---

### Archived: Electron Auto-Update Documentation
<details>
<summary>Click to view original Electron auto-update architecture (archived for reference)</summary>

The Windows desktop POS application (originally planned with Electron) required:
- **Update Framework:** `electron-updater` (part of electron-builder ecosystem)
- **Distribution:** GitHub Releases (MVP) or S3/CDN (production)
- **Update Format:** NSIS installer for Windows with delta updates
- **Code Signing:** Windows code signing certificate
- **Update Channels:** `stable` and `beta`
- **Version Manifest:** `latest.yml` file with version info

This approach was replaced with Flutter/Android to reduce hardware costs and improve mobility.
</details>

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

**Flutter/Android Implementation:**
- **Option A: Direct Connection (Preferred):** Android tablet connects directly to fiscal device via USB/Bluetooth/Network
  - Use **Platform Channels** (MethodChannel) to communicate with native Android SDK
  - Kotlin/Java code wraps vendor-provided fiscal device SDK
  - USB connection via USB OTG cable
  - Network connection via WiFi (fiscal device has IP address)
  - Bluetooth connection for portable fiscal printers
- **Option B: REST API Proxy:** Flutter app calls `fiscal-gateway` microservice via HTTP
  - Fiscal-gateway runs on separate Windows machine/server
  - Fiscal-gateway handles direct communication with fiscal device
  - Suitable if Android SDK is unavailable from vendor
- **Recommended:** Start with Option B (REST proxy) for MVP, migrate to Option A when vendor SDKs available

### Product Marking
- **System:** AslBelgisi (Uzbekistan national digital marking)
- **Capability:** Scan DataMatrix codes, integrate with marking API (optional in MVP)
- **Classifiers:** Support for TASNIФ and IKPU classification codes
- **Flutter Implementation:**
  - Use `mobile_scanner` package for camera-based DataMatrix scanning
  - Parse DataMatrix code to extract GTIN, serial number, crypto tail
  - Send to AslBelgisi API for validation
  - Store marking status in local database

## POS Design Principles

1. **Offline-First:** All critical POS operations work without internet connection
2. **Keyboard-Driven:** Hotkeys for all major actions
3. **Scanner-Friendly:** Barcode input handled as hidden field, instant item addition to receipt
4. **Touch-Optimized:** Minimum 40px touch targets for all interactive elements
5. **Receipt Visibility:** Current receipt items displayed prominently on right side or bottom
6. **Quick Operations:** Fast discount application, payment method selection, loyalty card scanning
7. **Auto-Update:** Background updates with minimal user interruption

## UI/UX Standards (Design System)

### Web Admin Design System (Next.js)
**Color & Typography:**
- **Tokens:** CSS variables for theming (support light/dark modes)
- **Fonts:** System fonts only
- **Grid:** 1200-1440px containers, 8pt spacing system
- **Accessibility:** WCAG compliant, focus rings enabled, contrast ratio ≥4.5:1

**Standard Components (from `@jowi/ui`):**
- AppShell, Sidebar, Topbar
- DataTable (with filters, sorting, export to CSV)
- Form, Input, Select, DatePicker
- Dialog, Drawer, Toast
- Tabs, Wizard
- KPI Cards, Chart primitives

**Loading States:**
- Standardized empty, loading, error states
- Shared skeleton loaders and spinners
- Never show raw error messages to end users

**Forms:**
- React Hook Form + Zod validation
- Shared `FormField` and `FormDialog` components
- Error messages from translation files

**i18n:**
- All text from translation dictionaries (no hardcoded strings)
- Date format: DD.MM.YYYY for RU/UZ locales
- Number format: UZS with thousand separators, no decimal places
- i18next namespaces keep translations organized

**Page Layout Standards:**
- **Index/List Pages:** Follow the unified structure defined in [.claude/INDEX_PAGES_UI_GUIDE.md](.claude/INDEX_PAGES_UI_GUIDE.md)
  - Two Card layout: header card (with title, description, search, filters, create button) + table card
  - Header card with `p-6` padding, table card without padding
  - Search uses `flex-1`, filters use fixed width `w-[200px]`
  - Consistent spacing: `mb-6` between sections, `space-y-6` between cards
- **Detail Pages:** TBD (to be documented)
- **Form Pages:** TBD (to be documented)

### Mobile POS Design System (Flutter)
**Theme & Typography:**
- **Design System:** Material Design 3 with custom color scheme
- **Theme Data:** Light and dark themes defined in `lib/shared/themes/app_theme.dart`
- **Fonts:** System fonts (Roboto on Android)
- **Spacing:** 8pt spacing system (use multiples of 8: 8, 16, 24, 32, 40, 48)
- **Colors:**
  - Primary: Brand color (customizable)
  - Surface: White (light) / Dark grey (dark)
  - Error: Material red
  - Success: Material green
- **Touch Targets:** Minimum 48x48dp for all interactive elements (Material Design standard)
- **Accessibility:** Support for screen readers, semantic labels, contrast ratio ≥4.5:1

**Standard Widgets (Custom):**
- AppScaffold (Scaffold + AppBar + navigation)
- AppButton (elevated, outlined, text variants)
- AppTextField (with validation states)
- AppDialog (confirmation, info, error dialogs)
- AppCard (surface with elevation)
- AppDataTable (virtualized, sortable, filterable)
- AppBottomSheet (for actions, filters)
- AppSnackBar (toast notifications)
- LoadingIndicator (circular progress)
- EmptyState (empty list, no results)
- ErrorWidget (error messages with retry)

**Forms:**
- `flutter_form_builder` + `form_builder_validators`
- Custom `FormField` widgets with consistent styling
- Inline validation with error messages below fields
- Error messages from translation files

**i18n:**
- All text from translation dictionaries (no hardcoded strings)
- `easy_localization` package with RU and UZ locales
- Date format: DD.MM.YYYY for RU/UZ locales
- Number format: UZS with thousand separators, no decimal places
- Translation files in `lib/l10n/ru.json` and `lib/l10n/uz.json`

**Performance Guidelines:**
- Use `const` widgets wherever possible (immutable widgets compile to faster code)
- Virtualize long lists with `ListView.builder` or `CustomScrollView`
- Lazy load images with `cached_network_image`
- Debounce search input (300ms)
- Cache frequently accessed data in memory

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

### Local Development Server Management
- **Port Consistency:** Always use port 3000 for the Next.js web application
- **Before Starting Dev Servers:** ALWAYS kill existing dev server processes to free up ports
- **Never Allow Port Drift:** Do not let Next.js auto-select alternative ports (3001, 3002, 3003, etc.)
- **Process Management:**
  1. Before running `pnpm dev`, kill any existing dev server processes
  2. Use `KillShell` to terminate background processes before starting new ones
  3. Check for port conflicts and resolve them by terminating old processes
  4. **IMPORTANT (Windows):** Always use PowerShell to kill processes, NOT taskkill
     - ✅ Correct: `powershell -Command "Stop-Process -Id <PID> -Force"`
     - ❌ Incorrect: `taskkill /F /PID <PID>` (causes encoding issues)
  5. **CRITICAL SAFETY RULE:** NEVER kill the process that Claude Code itself is running in
     - Before killing any Node.js or terminal processes, verify it's not the current working shell/terminal
     - Killing the current terminal process will terminate the Claude Code session
     - Always check the process tree before terminating processes
     - If in doubt, ask the user before terminating processes
- **Waiting/Sleep Commands (Windows):**
  - ✅ Correct: `powershell -Command "Start-Sleep -Seconds <N>"`
  - ❌ Incorrect: `timeout /t <N> /nobreak` (does not work, causes errors)
  - Always use PowerShell's `Start-Sleep` command for delays in scripts or between operations
- **Rationale:** Multiple running instances on different ports cause confusion, resource waste, and potential conflicts

### Code Organization
- **Monorepo:** Likely structure with shared packages
- **Shared Types:** Zod schemas shared between frontend and backend
- **UI Package:** `@jowi/ui` for all reusable components
- **No Hardcoding:** All text from i18n files, all config from environment variables

### Internationalization (i18n)
- **CRITICAL RULE:** When creating ANY new page or component, ALWAYS implement translations immediately
- **Required Languages:** Russian (RU) and Uzbek (UZ) - both are mandatory
- **Translation Files:**
  - Web: `packages/i18n/src/locales/ru/common.json` and `packages/i18n/src/locales/uz/common.json`
  - Flutter: `lib/l10n/ru.json` and `lib/l10n/uz.json`
- **Implementation Steps:**
  1. Add translation keys to BOTH language files simultaneously
  2. Use `useTranslation('common')` hook in React components
  3. Use `easy_localization` in Flutter components
  4. Replace ALL hardcoded text with translation keys - no exceptions
  5. Use semantic key naming: `section.subsection.element` (e.g., `finance.transactions.createButton`)
- **What to Translate:**
  - Page titles and descriptions
  - Button labels and action text
  - Form field labels and placeholders
  - Dialog titles and messages
  - Toast notifications
  - Error messages
  - Empty states
  - Table column headers
  - Filter and search placeholders
- **What NOT to Translate:**
  - Mock/test data values (these come from backend)
  - Code comments (keep in Russian for team communication)
  - Internal validation error messages in Zod schemas (use English for consistency)
  - Environment variable names
  - API endpoint paths
- **Currency Format:** Use `t('currency')` for "сум" / "so'm" (UZS)
- **Date Format:** Use `formatDate()` utility which respects locale (DD.MM.YYYY for both RU/UZ)
- **Never Skip Translation:** Even for "small" changes or "temporary" pages - always add both languages

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
- iOS POS application (Android only for MVP)

## Success Metrics for MVP

- Average receipt processing time
- Offline mode stability (uptime percentage)
- Sync success rate (percentage of successful syncs)
- Inventory count time reduction (vs manual counting)

## Print Templates

- **Receipt Printer:** ESC/POS commands for 58mm or 80mm thermal printers
- **Format:** 48-character monospace width (80mm) or 32-character (58mm)
- **Required Elements:** QR code (fiscal), store info, items, totals, payment method
- **Languages:** Support RU and UZ text on receipts
- **Flutter Implementation:**
  - **Bluetooth Printers:** Use `esc_pos_bluetooth` or `blue_thermal_printer` packages
  - **Network Printers:** Use `esc_pos_printer` package (WiFi/Ethernet)
  - **USB Printers:** Use platform channels or `usb_serial` package
  - **Template Engine:** Generate ESC/POS commands programmatically
  - **Encoding:** CP866 (Cyrillic) for Russian text, UTF-8 fallback
- **Printer Discovery:**
  - Bluetooth: Scan for paired printers in settings
  - Network: Manual IP entry or auto-discovery (Bonjour/mDNS)
  - USB: Auto-detect via USB OTG
- **Error Handling:**
  - Show clear error messages if printer offline/disconnected
  - Queue receipts for retry if printing fails
  - Allow manual reprint from receipt history

## When Building This System

1. **Start with multi-tenancy:** Set up RLS policies from day one
2. **Shared UI first:** Build `@jowi/ui` package before app-specific code
3. **Offline capability:** Design POS sync architecture before implementing features
4. **Fiscal compliance:** Implement fiscal gateway abstraction early
5. **Type safety:** Share Zod schemas between frontend and backend
6. **i18n from start:** Never hardcode text, use translation keys from the beginning
7. **Test fiscal flows:** Mock fiscal devices for automated testing
