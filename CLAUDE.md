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
- **Desktop POS Client:** Tauri (offline-first Windows desktop application)
  - **Framework:** Tauri 2.0+
  - **Frontend:** React 18 + TypeScript 5+ + Vite
  - **State Management:** TanStack Query (server state) + Zustand (client state)
  - **UI Library:** Tailwind CSS + shadcn/ui + Radix primitives
  - **Forms:** React Hook Form + Zod validation
  - **Tables:** TanStack Table with virtualization (50k+ rows support)
  - **i18n:** i18next (RU/UZ)
  - **Target Platform:** Windows 10/11 (64-bit)
  - **Minimum Requirements:** Windows 10, 4GB RAM, 500MB disk space
  - **Recommended Hardware:** Windows PC/All-in-One POS terminal with touch screen support
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

### Desktop POS Offline Architecture (Tauri/Windows)
- **Local Database:** SQLite with SQLCipher (AES-256 encryption)
  - Full SQL support with ACID transactions
  - WAL (Write-Ahead Logging) mode for 5-50x faster writes
  - Memory-mapped I/O for reduced syscalls
  - Single-file database for easy backup/restore
- **Performance Optimization:**
  - **Composite Indexes:** `(tenant_id, barcode)`, `(tenant_id, sku)` for instant lookups
  - **In-Memory Cache:** LRU cache for top-500 frequently scanned items
  - **Bulk Inserts:** Transactions boost from 85 inserts/sec → 96,000 inserts/sec
  - **Query Optimization:** `ANALYZE` statistics for optimal query planning
  - **Virtualization:** TanStack Virtual for rendering 50k+ products smoothly
- **Sync Pattern:** Outbox/Inbox queues with idempotent commands (UUIDs)
- **Background Sync:** Tauri background tasks for reliable synchronization
- **Conflict Resolution:**
  - Last-Write-Wins for sales transactions (immutable)
  - Field-Level Merge with timestamps for product catalog
  - PN-Counter (CRDT) for stock level adjustments
- **Auto-update:** Tauri Plugin Updater with signature verification (see dedicated section below)
- **Security:** SQLCipher encryption for sensitive data (sales, customer PII, credentials)

### Desktop POS Architecture (Tauri Framework)

**Tauri Overview:**
Tauri is a Rust-powered framework for building desktop applications using web technologies. Unlike Electron, Tauri uses the OS-native WebView (WebView2 on Windows) instead of bundling Chromium, resulting in significantly smaller bundle sizes and lower memory usage.

**Architecture Layers:**

```
┌─────────────────────────────────────────────────────────┐
│         Frontend (React + TypeScript + Vite)            │
│  ┌───────────────────────────────────────────────────┐  │
│  │  POS Screen, Inventory, Reports, Settings         │  │
│  │  React Components + TanStack Query + Zustand      │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ IPC (Inter-Process Communication)
                       │ @tauri-apps/api
┌──────────────────────┴──────────────────────────────────┐
│          Tauri Core (Rust Backend)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Commands (exposed to frontend via #[tauri::command]) │
│  │  - Database operations (SQLite via rusqlite)      │  │
│  │  - Hardware integration (barcode, printer, fiscal)│  │
│  │  - File system access                             │  │
│  │  - System APIs (notifications, clipboard)         │  │
│  │  - Background tasks (sync, auto-update)           │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│     OS Layer (Windows 10/11)                            │
│  - WebView2 (Chromium-based web rendering)             │
│  - SQLite database file                                 │
│  - USB/COM ports (barcode scanner, printer)            │
│  - Fiscal device DLLs (ATOL, Shtrih)                   │
└─────────────────────────────────────────────────────────┘
```

**Key Components:**

1. **Frontend (React):**
   - Built with Vite for fast hot-reload development
   - Communicates with Rust backend via IPC using `@tauri-apps/api`
   - Renders in WebView2 (Chromium engine embedded in Windows)
   - No direct access to system APIs (security by default)

2. **Tauri Core (Rust Backend):**
   - Exposes commands to frontend via `#[tauri::command]` macro
   - Handles all system-level operations (database, files, hardware)
   - Manages background tasks and auto-updates
   - Native performance with memory safety

3. **IPC (Inter-Process Communication):**
   - Frontend calls Rust commands via `invoke()`
   - Async operations return promises
   - Type-safe with TypeScript definitions
   - Example:
     ```typescript
     import { invoke } from '@tauri-apps/api/tauri';

     const products = await invoke<Product[]>('get_products', {
       tenantId: '123',
       barcode: '4607152820148'
     });
     ```

4. **WebView2 (Windows):**
   - Microsoft Edge WebView2 runtime (Chromium-based)
   - Automatically installed on Windows 10/11
   - Provides modern web APIs (Fetch, WebSockets, IndexedDB)
   - Lower memory usage than Electron (no Chromium bundled)

**Security Model:**
- **Restricted API Access:** Frontend cannot access file system, execute commands, or communicate with OS without explicit Rust command
- **CSP (Content Security Policy):** Prevents XSS attacks
- **HTTPS-only:** External resources must use HTTPS
- **Code Signing:** Required for updates and distribution
- **Sandboxed WebView:** Frontend runs in isolated environment

**Performance Benefits:**
- **Bundle Size:** 2.5-10 MB (vs Electron 80-240 MB)
- **Memory Usage:** 30-40 MB idle (vs Electron 200-300 MB)
- **Startup Time:** <500ms (vs Electron 1-2s)
- **Native Speed:** Rust backend runs at machine code speed

**Development Workflow:**
1. Start Vite dev server for frontend hot-reload
2. Tauri watches Rust code for changes and recompiles
3. App window shows frontend with live updates
4. Use Chrome DevTools for debugging frontend
5. Use Rust logs for debugging backend

**Build & Distribution:**
```bash
# Development
pnpm tauri dev

# Production build
pnpm tauri build

# Generates:
# - NSIS installer (.exe)
# - MSI installer (.msi)
# - Update bundles (.nsis.zip with signature)
```

### Desktop Application Auto-Update System (Tauri/Windows)
The Windows desktop POS application requires an automatic update mechanism to ensure all users always have the latest version without manual intervention.

**Core Requirements:**
- **Automatic Update Detection:** App checks for updates on startup and periodically (every 4 hours)
- **Background Download:** New versions download automatically in the background without interrupting POS operations
- **User Notification:** When update is ready, show non-intrusive notification with "Обновление готово к установке" button
- **Deferred Installation:** Users can continue working and install updates during breaks or shift changes
- **Mandatory Updates:** Critical security/fiscal compliance updates can be marked as mandatory
- **Rollback Capability:** Staged rollouts (5% → 25% → 100%) with kill switch endpoint

**Technical Implementation:**

**Tauri Plugin Updater (Built-in)**
- **Distribution:** S3/CloudFront (production) or GitHub Releases (MVP)
- **Update Framework:** Built-in Tauri updater with mandatory signature verification
- **Update Format:** NSIS installer for Windows with delta updates support
- **Code Signing:** Windows Authenticode certificate (required, no bypass)
- **Signature Verification:** Automatic, cryptographically verified
- **Update Channels:**
  - `stable` - Production releases for all users
  - `beta` - Early access for testing new features (opt-in)

**Server Setup:**
Server hosts JSON manifest at endpoint: `https://updates.jowi.uz/{target}/{arch}/{current_version}`

**Example Response:**
```json
{
  "version": "1.2.0",
  "url": "https://updates.jowi.uz/jowi-pos-1.2.0-x64.nsis.zip",
  "signature": "BASE64_SIGNATURE_HERE",
  "notes": "Bug fixes and performance improvements"
}
```
Or `204 No Content` if no update available.

**Client Implementation:**
```typescript
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

async function checkForUpdates() {
  const update = await check();

  if (update?.available) {
    // Download update in background
    await update.downloadAndInstall((progress) => {
      console.log(`Download: ${progress.downloaded} / ${progress.total}`);
    });

    // Prompt user to restart
    if (confirm('Update installed. Restart now?')) {
      await relaunch();
    }
  }
}

// Check on startup and every 4 hours
checkForUpdates();
setInterval(checkForUpdates, 4 * 60 * 60 * 1000);
```

**Update Flow:**
1. App checks update server on startup and every 4 hours
2. Compare current version with latest version from server
3. If new version available, download installer in background
4. Once downloaded and signature verified, show notification: "Обновление готово к установке"
5. User clicks "Установить сейчас" or "Отложить"
6. On install trigger: save current state → close app → installer runs → app restarts automatically
7. New version validates database schema compatibility and applies migrations if needed

**Offline Considerations:**
- If PC is offline, update check fails silently (no error shown)
- When connection restored, update check resumes
- Updates never interrupt active sales transactions
- Shift must be closed before mandatory updates install

**Error Handling:**
- If update download fails, retry with exponential backoff (max 3 retries)
- If installation fails, show error message and keep current version
- All update events logged to local SQLite database and synced to server
- Failed updates reported to central monitoring system via telemetry

**User Experience:**
- Minimal disruption to POS operations
- Clear update progress indication with percentage
- Option to view release notes (changelog) before installing
- Estimated installation time shown (typically 30-60 seconds)
- Windows installer automatically exits app, installs, and restarts

**Security:**
- ✅ Mandatory signature verification (cannot be disabled in Tauri)
- ✅ HTTPS-only communication with update server
- ✅ SHA-256 checksum verification before installation
- ✅ Windows Authenticode code signing certificate
- ✅ Update manifest served over signed HTTPS connection

**Windows Installer Behavior:**
- Application automatically exits when install starts (Windows limitation)
- User sees brief NSIS installer UI (< 10 seconds)
- App restarts after installation completes
- Database migrations applied on first launch of new version

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

**Tauri/Windows Implementation:**
- **Option A: Direct Integration (Production):** Desktop app directly calls Windows DLL via Rust FFI
  - Tauri Rust backend loads fiscal device DLL (ATOL Driver v.10, Shtrih SDK)
  - Rust FFI bindings wrap vendor-provided Windows SDK functions
  - Connection types: USB/COM/Network via native Windows drivers
  - Fastest performance, no HTTP overhead
  - Example vendors: ATOL, Shtrih, Payme-POS
- **Option B: REST API Proxy (Recommended for MVP):** Desktop app calls fiscal-gateway microservice via HTTP
  - Fiscal-gateway runs as Windows Service or standalone process
  - Gateway handles direct communication with fiscal device DLL
  - Simpler for development, isolates fiscal code from main app
  - Easier to test and debug
  - Can be migrated to Option A later for performance optimization
- **Recommended:** Start with Option B (REST proxy) for MVP, migrate to Option A when performance critical

**Rust FFI Example (Option A):**
```rust
use libloading::{Library, Symbol};

let lib = Library::new("fptr10.dll")?; // ATOL driver
let open_shift: Symbol<unsafe extern fn() -> i32> = lib.get(b"OpenShift")?;
let register_sale: Symbol<unsafe extern fn(...) -> i32> = lib.get(b"RegisterCheck")?;

unsafe { open_shift() };
unsafe { register_sale(total, items, payment_type) };
```

**Fiscal Queue System:**
```typescript
// All fiscal operations go through retry queue
interface FiscalOperation {
  id: string;
  type: 'sale' | 'refund' | 'open_shift' | 'close_shift';
  payload: any;
  retries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// Background worker processes queue with exponential backoff
async function processFiscalQueue() {
  const pending = await db.query(
    'SELECT * FROM fiscal_queue WHERE status = "pending" ORDER BY created_at'
  );

  for (const op of pending) {
    try {
      await fiscalGateway.execute(op.type, op.payload);
      await db.execute('UPDATE fiscal_queue SET status = "completed" WHERE id = ?', [op.id]);
    } catch (error) {
      if (op.retries < 3) {
        await db.execute('UPDATE fiscal_queue SET retries = retries + 1 WHERE id = ?', [op.id]);
        await sleep(Math.pow(2, op.retries) * 1000); // Exponential backoff
      } else {
        await db.execute('UPDATE fiscal_queue SET status = "failed" WHERE id = ?', [op.id]);
        showNotification('Fiscal operation failed. Contact support.');
      }
    }
  }
}
```

### Product Marking
- **System:** AslBelgisi (Uzbekistan national digital marking)
- **Capability:** Scan DataMatrix codes, integrate with marking API (optional in MVP)
- **Classifiers:** Support for TASNIФ and IKPU classification codes
- **Desktop Implementation:**
  - **Scanner Type:** USB 2D imager barcode scanner (Zebra, Honeywell, Datalogic) with DataMatrix support
  - **Integration Mode:** Keyboard wedge (simplest) or USB HID (advanced)
  - **DataMatrix Parsing:** Extract GTIN, serial number, crypto tail from scanned code
  - **API Integration:** Send to AslBelgisi API for validation
  - **Storage:** Mark product status in local SQLite database
  - **Recommended Scanners:** Honeywell Voyager 1450g, Zebra DS2208, Datalogic QuickScan QD2400

## POS Design Principles

1. **Offline-First:** All critical POS operations work without internet connection
2. **Keyboard-Driven:** Hotkeys for all major actions (F1-F12, Ctrl+1/2/3/4 for payment methods)
3. **Scanner-Friendly:** Barcode input handled as hidden field, instant item addition to receipt (<100ms target)
4. **Touch-Optimized:** Minimum 48x48px touch targets for all interactive elements (Windows standard)
5. **Receipt Visibility:** Current receipt items displayed prominently on right side or bottom
6. **Quick Operations:** Fast discount application, payment method selection, loyalty card scanning
7. **Auto-Update:** Background updates with minimal user interruption
8. **Performance:** Cold startup <1s, instant search <200ms, smooth 60 FPS UI with virtualization

## Performance Targets

Desktop POS application must meet these performance benchmarks to ensure smooth cashier experience:

| Metric | Target | Critical | Measurement |
|--------|--------|----------|-------------|
| Cold startup time | <1s | ✅ | Time from launch to interactive |
| Barcode scan → add item | <100ms | ✅ | Scan event to UI update |
| Product search (50k items) | <200ms | ✅ | Keystroke to results displayed |
| Checkout flow (payment → receipt) | <5s | ⚠️ | Payment confirmation to receipt print |
| Database query (indexed) | <10ms | ✅ | Single product lookup by barcode |
| Memory usage (idle) | <100 MB | ✅ | Private working set |
| Installer size | <20 MB | ⚠️ | NSIS installer package |
| UI rendering (all interactions) | 60 FPS | ✅ | No dropped frames, 16.67ms/frame |

**Performance Monitoring:**
- Use Chrome DevTools Performance tab for profiling
- React DevTools Profiler for component render times
- `performance.mark()` and `performance.measure()` for custom metrics
- SQLite query analysis with `EXPLAIN QUERY PLAN`
- Tauri DevTools for bundle size analysis

**Optimization Checklist:**
- ✅ SQLite WAL mode enabled
- ✅ Composite indexes on (tenant_id, barcode), (tenant_id, sku)
- ✅ TanStack Virtual for all product/receipt lists
- ✅ React.memo() for expensive row components
- ✅ Debounced search (300ms)
- ✅ In-memory LRU cache for top-500 products
- ✅ Web Workers for heavy calculations
- ✅ Code splitting with React.lazy()

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

### Desktop POS Design System (Tauri + React)
**Theme & Typography:**
- **Design System:** Custom design based on shadcn/ui components (Tailwind CSS + Radix primitives)
- **Theme Mode:** Light mode (optimal for retail environments with bright store lighting)
- **Fonts:** System fonts (Segoe UI on Windows)
- **Spacing:** 8pt spacing system (use multiples of 8: 8, 16, 24, 32, 40, 48)
- **Color Palette:**
  - Primary: #1976D2 (Blue)
  - Surface: #F5F5F5 (Light gray)
  - Background: #FFFFFF (White)
  - Border: #E0E0E0 (Gray)
  - Text Primary: #212121 (Dark gray)
  - Text Secondary: #757575 (Medium gray)
  - Error: #D32F2F (Red)
  - Success: #388E3C (Green)
  - Warning: #F57C00 (Orange)
- **Touch Targets:** Minimum 48x48px for all interactive elements (Windows standard)
- **Accessibility:** WCAG AA compliant, visible focus rings, contrast ratio ≥4.5:1

**Standard Components (from `@jowi/ui` + Custom POS):**
- **POSLayout:** Main POS scaffold with keyboard-first navigation
- **BarcodeInput:** Hidden input field with auto-focus maintenance
- **ReceiptList:** Virtualized receipt items using TanStack Table (handles 1000+ items)
- **ProductGrid:** Lazy-loaded product categories with search
- **PaymentButtons:** Large 48px+ touch targets for cash/card/transfer/installment
- **NumericKeypad:** On-screen keypad for manual price/quantity entry
- **HotkeyHandler:** Global keyboard shortcut manager
- **ShiftDialog, DiscountDialog, RefundDialog:** Modal dialogs for POS operations
- **POSToast:** Toast notifications with auto-dismiss
- **LoadingSpinner, EmptyState, ErrorBoundary**

**Keyboard-First Navigation:**
Essential shortcuts for power users (cashiers):
```
F1: Help overlay with all shortcuts
F2: Search product by name
F3: Focus barcode input
F4: Apply discount
F5: Void current line item
F8: Park transaction (hold)
F9: Recall parked transaction
F12: Complete sale (checkout)

Ctrl+1: Pay cash
Ctrl+2: Pay card
Ctrl+3: Pay transfer
Ctrl+4: Pay installment

Ctrl+N: New sale
Ctrl+R: Refund/return
Ctrl+H: Transaction history
Ctrl+P: Reprint last receipt

Alt+O: Open shift
Alt+X: X-report (shift summary)
Alt+Z: Z-report (close shift)

ArrowUp/Down: Navigate receipt items
Enter: Select/confirm
Esc: Cancel/close dialog
```

**Forms:**
- React Hook Form + Zod validation
- Shared `FormField` and `FormDialog` components from `@jowi/ui`
- Inline validation with error messages below fields
- Error messages from translation files (`i18next`)

**i18n:**
- All text from translation dictionaries (no hardcoded strings)
- `i18next` with RU and UZ locales
- Date format: DD.MM.YYYY for RU/UZ locales
- Number format: UZS with thousand separators, no decimal places
- Translation namespaces: `common`, `pos`, `inventory`, `finance`

**Performance Guidelines:**
- **Virtualization:** TanStack Virtual for product lists (handles 50k+ items smoothly)
- **Memoization:** `React.memo()` for row components, `useMemo()` for calculations
- **Debouncing:** Search input 300ms, auto-save 1000ms
- **Web Workers:** Offload heavy calculations (receipt totals, tax, reports)
- **Code Splitting:** Route-based lazy loading with `React.lazy()`
- **Target:** 60 FPS (16.67ms per frame) for all UI interactions

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
  - Web Admin: `packages/i18n/src/locales/ru/common.json` and `packages/i18n/src/locales/uz/common.json`
  - Desktop POS: Same shared `@jowi/i18n` package with namespaces: `common`, `pos`, `inventory`, `finance`
- **Implementation Steps:**
  1. Add translation keys to BOTH language files simultaneously
  2. Use `useTranslation('namespace')` hook in React components (both Web Admin and Desktop POS)
  3. Replace ALL hardcoded text with translation keys - no exceptions
  4. Use semantic key naming: `section.subsection.element` (e.g., `finance.transactions.createButton`, `pos.checkout.paymentButton`)
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
- macOS/Linux desktop POS (Windows only for MVP)
- Mobile POS applications (iOS/Android)

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
- **Desktop Implementation (Tauri/Windows):**
  - **Thermal Printers:** Use `tauri-plugin-lnxdxtf-thermal-printer` or custom Rust plugin
  - **Protocol:** ESC/POS standard commands
  - **Connection Types:**
    - USB: Direct via libusb or Windows USB driver
    - Network: TCP/IP (WiFi/Ethernet)
    - Bluetooth: Windows Bluetooth stack
  - **Template Engine:** Generate ESC/POS commands programmatically in Rust
  - **Encoding:** CP866 (Cyrillic) for Russian text, UTF-8 fallback
- **Printer Discovery:**
  - USB: Auto-detect via Windows Device Manager
  - Network: Manual IP entry or mDNS/Bonjour discovery
  - Settings UI for printer configuration and testing
- **Error Handling:**
  - Show clear error messages if printer offline/disconnected
  - Queue receipts for retry if printing fails
  - Allow manual reprint from receipt history
  - Log all print operations with timestamps

## When Building This System

1. **Start with multi-tenancy:** Set up RLS policies from day one
2. **Shared UI first:** Build `@jowi/ui` package before app-specific code
3. **Offline capability:** Design POS sync architecture before implementing features
4. **Fiscal compliance:** Implement fiscal gateway abstraction early
5. **Type safety:** Share Zod schemas between frontend and backend
6. **i18n from start:** Never hardcode text, use translation keys from the beginning
7. **Test fiscal flows:** Mock fiscal devices for automated testing
