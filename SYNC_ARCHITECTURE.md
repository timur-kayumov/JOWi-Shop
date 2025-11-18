# POS Sync Architecture: Desktop ↔ Cloud

Подробный план настройки синхронизации между Desktop POS (Tauri + SQLite) и Cloud Backend (NestJS + PostgreSQL).

---

## 📐 Архитектура синхронизации

### Общая схема

```
┌─────────────────────────────────────────────────────────────────┐
│                    Cloud (NestJS + PostgreSQL)                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Sync Endpoints                                          │  │
│  │  POST /api/v1/sync/push   ← Получает операции от POS    │  │
│  │  GET  /api/v1/sync/pull   ← Отдаёт изменения для POS   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↕                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL                                              │  │
│  │  - receipts (все продажи)                               │  │
│  │  - products (master каталог)                            │  │
│  │  - sync_log (история синхронизаций)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ HTTPS (каждые 30 секунд)
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│               POS Terminal (Tauri Desktop)                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Sync Manager (Rust)                                     │  │
│  │  - Background task каждые 30 сек                        │  │
│  │  - Push outbox → сервер                                 │  │
│  │  - Pull изменения → inbox                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↕                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SQLite (local)                                          │  │
│  │  - receipts (локальные продажи)                         │  │
│  │  - products (кэш каталога)                              │  │
│  │  - outbox (несинхронизированные операции)               │  │
│  │  - inbox (изменения с сервера)                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 План реализации

### Фаза 1: Backend (NestJS) — Sync API

**Цель:** Создать endpoints для синхронизации данных между POS терминалами и сервером.

**Время:** 1-2 недели

---

#### 1.1 Создать Sync модуль в NestJS

**Файлы:**
```
apps/api/src/modules/sync/
├── sync.module.ts
├── sync.controller.ts
├── sync.service.ts
├── dto/
│   ├── push-operations.dto.ts
│   └── pull-changes.dto.ts
└── entities/
    └── sync-log.entity.ts
```

**Код:**

**`sync.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
```

**`sync.controller.ts`**
```typescript
import { Controller, Post, Get, Body, Query, Headers, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SyncService } from './sync.service';
import { PushOperationsDto } from './dto/push-operations.dto';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  /**
   * POS отправляет локальные операции на сервер
   * POST /api/v1/sync/push
   */
  @Post('push')
  async pushOperations(
    @Body() dto: PushOperationsDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: { tenantId: string; terminalId: string }
  ) {
    return this.syncService.pushOperations(
      dto.operations,
      idempotencyKey,
      user.tenantId,
      user.terminalId
    );
  }

  /**
   * POS запрашивает изменения с сервера
   * GET /api/v1/sync/pull?since=2025-01-15T10:00:00Z
   */
  @Get('pull')
  async pullChanges(
    @Query('since') since: string,
    @CurrentUser() user: { tenantId: string; terminalId: string }
  ) {
    const sinceDate = new Date(since);
    return this.syncService.pullChanges(sinceDate, user.tenantId, user.terminalId);
  }
}
```

**`sync.service.ts`**
```typescript
import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface OutboxOperation {
  id: string;
  operationType: 'sale' | 'refund' | 'stock_adjustment';
  entityType: 'receipt' | 'inventory';
  entityId: string;
  payload: any;
  createdAt: Date;
}

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  /**
   * Применить операции из POS к PostgreSQL
   */
  async pushOperations(
    operations: OutboxOperation[],
    idempotencyKey: string,
    tenantId: string,
    terminalId: string
  ) {
    // 1. Проверить idempotency key (избежать дубликатов)
    const existing = await this.prisma.syncLog.findUnique({
      where: { idempotencyKey }
    });

    if (existing) {
      throw new ConflictException('Operation already processed');
    }

    // 2. Применить операции в транзакции
    await this.prisma.$transaction(async (tx) => {
      for (const op of operations) {
        switch (op.operationType) {
          case 'sale':
            // Создать продажу в PostgreSQL
            await tx.receipt.create({
              data: {
                id: op.entityId,
                tenantId,
                terminalId,
                ...op.payload,
              }
            });
            break;

          case 'refund':
            // Создать возврат
            await tx.refund.create({
              data: {
                id: op.entityId,
                tenantId,
                ...op.payload,
              }
            });
            break;

          // Другие типы операций...
        }
      }

      // 3. Записать в sync_log
      await tx.syncLog.create({
        data: {
          idempotencyKey,
          tenantId,
          terminalId,
          operationsCount: operations.length,
          syncedAt: new Date(),
        }
      });
    });

    return { status: 'synced', count: operations.length };
  }

  /**
   * Получить изменения для POS
   */
  async pullChanges(since: Date, tenantId: string, terminalId: string) {
    // 1. Выбрать изменённые товары
    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        updatedAt: { gt: since },
      },
      select: {
        id: true,
        barcode: true,
        name: true,
        price: true,
        categoryId: true,
        updatedAt: true,
      }
    });

    // 2. Выбрать изменённые категории
    const categories = await this.prisma.category.findMany({
      where: {
        tenantId,
        updatedAt: { gt: since },
      }
    });

    // 3. Выбрать изменённые настройки
    const settings = await this.prisma.storeSetting.findMany({
      where: {
        store: { tenantId },
        updatedAt: { gt: since },
      }
    });

    return {
      timestamp: new Date().toISOString(),
      changes: {
        products,
        categories,
        settings,
      }
    };
  }
}
```

---

#### 1.2 Создать Prisma модель для sync_log

**`prisma/schema.prisma`**
```prisma
model SyncLog {
  id                String   @id @default(uuid())
  tenantId          String
  terminalId        String
  idempotencyKey    String   @unique
  operationsCount   Int
  syncedAt          DateTime @default(now())
  createdAt         DateTime @default(now())

  @@index([tenantId, terminalId])
  @@index([idempotencyKey])
  @@map("sync_logs")
}
```

**Миграция:**
```bash
pnpm prisma migrate dev --name add_sync_log
```

---

#### 1.3 JWT для терминалов

Обновить JWT payload для включения `terminalId`:

**`auth.service.ts`**
```typescript
async loginTerminal(terminalId: string, password: string) {
  // Валидация терминала
  const terminal = await this.prisma.terminal.findUnique({
    where: { id: terminalId },
    include: { store: true }
  });

  if (!terminal) {
    throw new UnauthorizedException('Invalid terminal');
  }

  // Создать JWT
  const payload = {
    sub: terminalId,
    tenantId: terminal.store.tenantId,
    terminalId: terminal.id,
    role: 'pos_terminal',
  };

  return {
    accessToken: this.jwtService.sign(payload),
  };
}
```

---

### Фаза 2: POS Desktop (Tauri) — Local Database

**Цель:** Создать SQLite схему и Outbox/Inbox паттерн.

**Время:** 1-2 недели

---

#### 2.1 SQLite схема

**`src-tauri/migrations/001_initial.sql`**
```sql
-- Products (кэш из PostgreSQL)
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  barcode TEXT,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  category_id TEXT,
  updated_at INTEGER NOT NULL,
  synced_at INTEGER,

  UNIQUE(tenant_id, barcode)
);

CREATE INDEX idx_products_barcode ON products(tenant_id, barcode);
CREATE INDEX idx_products_name ON products(tenant_id, name);

-- Receipts (локальные продажи)
CREATE TABLE receipts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  terminal_id TEXT NOT NULL,
  total INTEGER NOT NULL,
  discount INTEGER DEFAULT 0,
  payment_method TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  synced_at INTEGER
);

CREATE INDEX idx_receipts_created ON receipts(tenant_id, created_at DESC);

-- Receipt items
CREATE TABLE receipt_items (
  id TEXT PRIMARY KEY,
  receipt_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price INTEGER NOT NULL,

  FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE
);

-- Outbox (операции для синхронизации на сервер)
CREATE TABLE outbox (
  id TEXT PRIMARY KEY,
  operation_type TEXT NOT NULL, -- 'sale', 'refund', 'stock_adjustment'
  entity_type TEXT NOT NULL,     -- 'receipt', 'inventory'
  entity_id TEXT NOT NULL,
  payload TEXT NOT NULL,         -- JSON
  retries INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'synced', 'failed'
  synced_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_outbox_status ON outbox(status, created_at);

-- Inbox (изменения с сервера)
CREATE TABLE inbox (
  id TEXT PRIMARY KEY,
  operation_type TEXT NOT NULL, -- 'product_update', 'category_update'
  payload TEXT NOT NULL,         -- JSON
  applied_at INTEGER,
  server_timestamp INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_inbox_applied ON inbox(applied_at);

-- Sync metadata
CREATE TABLE sync_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Последний timestamp синхронизации
INSERT INTO sync_metadata (key, value, updated_at)
VALUES ('last_pull_timestamp', '1970-01-01T00:00:00Z', 0);
```

---

#### 2.2 Rust Database Module

**`src-tauri/src/db.rs`**
```rust
use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(path: &str) -> Result<Self> {
        let conn = Connection::open(path)?;

        // Enable WAL mode for better performance
        conn.execute("PRAGMA journal_mode = WAL", [])?;
        conn.execute("PRAGMA synchronous = NORMAL", [])?;
        conn.execute("PRAGMA cache_size = -64000", [])?; // 64MB cache

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn run_migrations(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        // Читаем и выполняем SQL из файла миграции
        let sql = include_str!("../migrations/001_initial.sql");
        conn.execute_batch(sql)?;

        Ok(())
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Product {
    pub id: String,
    pub tenant_id: String,
    pub barcode: String,
    pub name: String,
    pub price: i64,
}

impl Database {
    pub fn get_product_by_barcode(&self, tenant_id: &str, barcode: &str) -> Result<Product> {
        let conn = self.conn.lock().unwrap();

        conn.query_row(
            "SELECT id, tenant_id, barcode, name, price
             FROM products
             WHERE tenant_id = ? AND barcode = ?",
            params![tenant_id, barcode],
            |row| {
                Ok(Product {
                    id: row.get(0)?,
                    tenant_id: row.get(1)?,
                    barcode: row.get(2)?,
                    name: row.get(3)?,
                    price: row.get(4)?,
                })
            }
        )
    }

    pub fn create_receipt(&self, receipt: &Receipt) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        conn.execute(
            "INSERT INTO receipts (id, tenant_id, terminal_id, total, created_at)
             VALUES (?, ?, ?, ?, ?)",
            params![
                receipt.id,
                receipt.tenant_id,
                receipt.terminal_id,
                receipt.total,
                receipt.created_at
            ]
        )?;

        Ok(())
    }

    pub fn add_to_outbox(&self, operation: &OutboxOperation) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        let payload_json = serde_json::to_string(&operation.payload)?;

        conn.execute(
            "INSERT INTO outbox (id, operation_type, entity_type, entity_id, payload, created_at)
             VALUES (?, ?, ?, ?, ?, ?)",
            params![
                operation.id,
                operation.operation_type,
                operation.entity_type,
                operation.entity_id,
                payload_json,
                operation.created_at
            ]
        )?;

        Ok(())
    }
}
```

---

#### 2.3 Sync Manager (Rust)

**`src-tauri/src/sync.rs`**
```rust
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tokio::time;

pub struct SyncManager {
    api_url: String,
    access_token: String,
    db: Database,
    http_client: Client,
}

#[derive(Serialize, Deserialize)]
struct PushRequest {
    operations: Vec<OutboxOperation>,
}

#[derive(Serialize, Deserialize)]
struct PullResponse {
    timestamp: String,
    changes: Changes,
}

#[derive(Serialize, Deserialize)]
struct Changes {
    products: Vec<Product>,
    categories: Vec<Category>,
}

impl SyncManager {
    pub fn new(api_url: String, access_token: String, db: Database) -> Self {
        Self {
            api_url,
            access_token,
            db,
            http_client: Client::new(),
        }
    }

    /// Запустить фоновую синхронизацию (каждые 30 секунд)
    pub async fn start_background_sync(self) {
        let mut interval = time::interval(Duration::from_secs(30));

        loop {
            interval.tick().await;

            if let Err(e) = self.sync_cycle().await {
                eprintln!("Sync error: {}", e);
            }
        }
    }

    /// Один цикл синхронизации: push + pull
    async fn sync_cycle(&self) -> Result<(), Box<dyn std::error::Error>> {
        // 1. Push: отправить outbox на сервер
        self.push_operations().await?;

        // 2. Pull: получить изменения с сервера
        self.pull_changes().await?;

        Ok(())
    }

    /// Push outbox → сервер
    async fn push_operations(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Выбрать несинхронизированные операции
        let pending = self.db.get_pending_outbox()?;

        if pending.is_empty() {
            return Ok(());
        }

        // Отправить на сервер
        let response = self.http_client
            .post(&format!("{}/sync/push", self.api_url))
            .header("Authorization", format!("Bearer {}", self.access_token))
            .header("idempotency-key", uuid::Uuid::new_v4().to_string())
            .json(&PushRequest { operations: pending.clone() })
            .send()
            .await?;

        if response.status().is_success() {
            // Отметить как синхронизированные
            for op in pending {
                self.db.mark_outbox_synced(&op.id)?;
            }
        }

        Ok(())
    }

    /// Pull сервер → inbox
    async fn pull_changes(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Получить последний timestamp
        let last_pull = self.db.get_last_pull_timestamp()?;

        // Запросить изменения
        let response: PullResponse = self.http_client
            .get(&format!("{}/sync/pull?since={}", self.api_url, last_pull))
            .header("Authorization", format!("Bearer {}", self.access_token))
            .send()
            .await?
            .json()
            .await?;

        // Применить изменения к локальной БД
        for product in response.changes.products {
            self.db.upsert_product(&product)?;
        }

        for category in response.changes.categories {
            self.db.upsert_category(&category)?;
        }

        // Обновить timestamp
        self.db.set_last_pull_timestamp(&response.timestamp)?;

        Ok(())
    }
}
```

---

#### 2.4 Tauri Commands

**`src-tauri/src/main.rs`**
```rust
use tauri::Manager;

#[tauri::command]
async fn create_sale(
    items: Vec<LineItem>,
    payment_method: String,
    state: tauri::State<'_, AppState>
) -> Result<Receipt, String> {
    let db = &state.db;

    // 1. Создать receipt
    let receipt = Receipt {
        id: uuid::Uuid::new_v4().to_string(),
        tenant_id: state.tenant_id.clone(),
        terminal_id: state.terminal_id.clone(),
        total: items.iter().map(|i| i.price * i.quantity).sum(),
        payment_method,
        created_at: chrono::Utc::now().timestamp(),
        synced_at: None,
    };

    db.create_receipt(&receipt).map_err(|e| e.to_string())?;

    // 2. Добавить в outbox для синхронизации
    let outbox_op = OutboxOperation {
        id: uuid::Uuid::new_v4().to_string(),
        operation_type: "sale".to_string(),
        entity_type: "receipt".to_string(),
        entity_id: receipt.id.clone(),
        payload: serde_json::to_value(&receipt).unwrap(),
        created_at: chrono::Utc::now().timestamp(),
    };

    db.add_to_outbox(&outbox_op).map_err(|e| e.to_string())?;

    Ok(receipt)
}

#[tauri::command]
async fn search_product(
    barcode: String,
    state: tauri::State<'_, AppState>
) -> Result<Product, String> {
    state.db
        .get_product_by_barcode(&state.tenant_id, &barcode)
        .map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Инициализация БД
            let db = Database::new("pos.db").expect("Failed to open database");
            db.run_migrations().expect("Failed to run migrations");

            // Запуск sync manager в фоне
            let sync_manager = SyncManager::new(
                "https://api.jowi.uz".to_string(),
                get_access_token(),
                db.clone()
            );

            tauri::async_runtime::spawn(async move {
                sync_manager.start_background_sync().await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![create_sale, search_product])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

### Фаза 3: Conflict Resolution

**Цель:** Обработка конфликтов при синхронизации.

**Время:** 1 неделя

---

#### 3.1 Стратегии разрешения конфликтов

**1. Last-Write-Wins (для продаж)**
```rust
// Продажи никогда не конфликтуют - они иммутабельные
// Каждая продажа имеет уникальный UUID
// Если дубликат - просто игнорируем (idempotency key)
```

**2. Field-Level Merge (для товаров)**
```typescript
// В PostgreSQL каждое поле имеет свой timestamp
interface Product {
  id: string;
  name: string;
  name_updated_at: Date;
  price: number;
  price_updated_at: Date;
  category_id: string;
  category_updated_at: Date;
}

// При конфликте берём самое свежее значение для каждого поля
function mergeProduct(local: Product, server: Product): Product {
  return {
    id: local.id,
    name: local.name_updated_at > server.name_updated_at
      ? local.name : server.name,
    price: local.price_updated_at > server.price_updated_at
      ? local.price : server.price,
    // ...
  };
}
```

**3. Server Always Wins (для настроек)**
```rust
// Настройки магазина всегда перезаписываются с сервера
// POS не может менять настройки локально
```

---

### Фаза 4: Error Handling & Retry

**Цель:** Надёжная синхронизация с повторными попытками.

**Время:** 1 неделя

---

#### 4.1 Retry Logic с Exponential Backoff

**`src-tauri/src/sync.rs`**
```rust
async fn push_operations_with_retry(&self) -> Result<(), Box<dyn std::error::Error>> {
    let mut retries = 0;
    const MAX_RETRIES: u32 = 3;

    loop {
        match self.push_operations().await {
            Ok(_) => return Ok(()),
            Err(e) if retries < MAX_RETRIES => {
                retries += 1;
                let backoff = Duration::from_secs(2u64.pow(retries)); // 2s, 4s, 8s
                eprintln!("Push failed, retry {} after {:?}: {}", retries, backoff, e);
                time::sleep(backoff).await;
            }
            Err(e) => {
                // После 3 попыток - логируем ошибку и продолжаем
                eprintln!("Push failed after {} retries: {}", MAX_RETRIES, e);
                return Err(e);
            }
        }
    }
}
```

---

#### 4.2 Offline Detection

**`src-tauri/src/sync.rs`**
```rust
async fn is_online(&self) -> bool {
    // Простая проверка доступности API
    self.http_client
        .get(&format!("{}/health", self.api_url))
        .timeout(Duration::from_secs(5))
        .send()
        .await
        .is_ok()
}

async fn sync_cycle(&self) -> Result<(), Box<dyn std::error::Error>> {
    // Проверить онлайн
    if !self.is_online().await {
        println!("Offline mode - skipping sync");
        return Ok(());
    }

    self.push_operations_with_retry().await?;
    self.pull_changes().await?;

    Ok(())
}
```

---

### Фаза 5: Testing & Monitoring

**Цель:** Тестирование sync логики и мониторинг.

**Время:** 1-2 недели

---

#### 5.1 Unit Tests

**`src-tauri/src/db_test.rs`**
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_receipt() {
        let db = Database::new(":memory:").unwrap();
        db.run_migrations().unwrap();

        let receipt = Receipt {
            id: "test-123".to_string(),
            tenant_id: "tenant-1".to_string(),
            terminal_id: "terminal-1".to_string(),
            total: 50000,
            created_at: 1234567890,
            synced_at: None,
        };

        db.create_receipt(&receipt).unwrap();

        // Verify receipt was created
        // ...
    }

    #[test]
    fn test_outbox_push() {
        // Test outbox operations
    }
}
```

---

#### 5.2 Integration Tests

**`apps/api/test/sync.e2e-spec.ts`**
```typescript
describe('Sync API (e2e)', () => {
  it('POST /sync/push should accept operations', async () => {
    const response = await request(app.getHttpServer())
      .post('/sync/push')
      .set('Authorization', `Bearer ${terminalToken}`)
      .send({
        operations: [
          {
            id: 'op-123',
            operationType: 'sale',
            entityType: 'receipt',
            entityId: 'receipt-456',
            payload: { total: 50000 },
            createdAt: new Date(),
          }
        ]
      })
      .expect(200);

    expect(response.body.status).toBe('synced');
  });
});
```

---

#### 5.3 Monitoring Dashboard

**Метрики для отслеживания:**
```typescript
// В PostgreSQL
interface SyncMetrics {
  totalSyncs: number;           // Всего синхронизаций
  failedSyncs: number;          // Проваленные синхронизации
  avgSyncDuration: number;      // Средняя длительность sync
  lastSyncTime: Date;           // Последняя успешная sync
  pendingOperations: number;    // Операций в очереди
  oldestPendingOperation: Date; // Самая старая несинхронизированная операция
}

// Endpoint для мониторинга
@Get('metrics')
async getSyncMetrics(@Query('terminalId') terminalId: string) {
  return this.syncService.getMetrics(terminalId);
}
```

---

## 📊 Checklist

### Backend (NestJS)
- [ ] Создать `SyncModule`
- [ ] Создать `POST /sync/push` endpoint
- [ ] Создать `GET /sync/pull` endpoint
- [ ] Добавить `SyncLog` модель в Prisma
- [ ] Реализовать idempotency checks
- [ ] Добавить JWT auth для терминалов
- [ ] Написать unit tests
- [ ] Написать e2e tests

### POS Desktop (Tauri)
- [ ] Создать SQLite схему с миграциями
- [ ] Реализовать `Database` модуль (Rust)
- [ ] Реализовать `SyncManager` с background tasks
- [ ] Добавить Tauri commands для sync
- [ ] Реализовать Outbox/Inbox pattern
- [ ] Добавить retry logic с exponential backoff
- [ ] Реализовать offline detection
- [ ] Написать unit tests
- [ ] Написать integration tests

### Conflict Resolution
- [ ] Реализовать Last-Write-Wins для продаж
- [ ] Реализовать Field-Level Merge для товаров
- [ ] Реализовать Server-Wins для настроек
- [ ] Добавить conflict logging

### Monitoring
- [ ] Добавить sync metrics endpoint
- [ ] Создать dashboard для мониторинга
- [ ] Настроить алерты для failed syncs
- [ ] Логирование всех sync операций

---

## 🎯 Результат

После реализации всех фаз у вас будет:

✅ **Offline-first POS система**
- Работает без интернета
- Автоматическая синхронизация каждые 30 секунд
- Надёжная обработка ошибок

✅ **Масштабируемая архитектура**
- Каждый терминал работает независимо
- Центральная БД собирает все данные
- Готово к добавлению новых терминалов

✅ **Безопасность**
- JWT авторизация для терминалов
- Idempotency для избежания дубликатов
- Audit trail через sync_log

✅ **Мониторинг**
- Метрики синхронизации
- Алерты при проблемах
- Dashboard для управления

---

## 📚 Дополнительные ресурсы

**Примеры Outbox pattern:**
- https://microservices.io/patterns/data/transactional-outbox.html

**SQLite performance tuning:**
- https://www.sqlite.org/wal.html
- https://phiresky.github.io/blog/2020/sqlite-performance-tuning/

**Conflict-free Replicated Data Types (CRDT):**
- https://crdt.tech/

**Tauri documentation:**
- https://v2.tauri.app/develop/
