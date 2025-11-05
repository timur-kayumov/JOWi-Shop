# Performance Optimization & Scaling Plan
## JOWi Shop High-Load Architecture

**Дата создания:** 2025-01-05
**Статус:** План к исполнению
**Цель:** Подготовить систему к нагрузке 1,000+ RPS с использованием только TypeScript

---

## Содержание

1. [Введение и целевые метрики](#введение-и-целевые-метрики)
2. [Текущее состояние системы](#текущее-состояние-системы)
3. [Этап 1: Benchmark текущей производительности](#этап-1-benchmark-текущей-производительности)
4. [Этап 2: Redis кэширование](#этап-2-redis-кэширование)
5. [Этап 3: Database индексы и партиционирование](#этап-3-database-индексы-и-партиционирование)
6. [Этап 4: Миграция с Prisma на Drizzle ORM](#этап-4-миграция-с-prisma-на-drizzle-orm)
7. [Этап 5: Connection Pooling (PgBouncer)](#этап-5-connection-pooling-pgbouncer)
8. [Этап 6: Horizontal Scaling](#этап-6-horizontal-scaling)
9. [Этап 7: Мониторинг и алертинг](#этап-7-мониторинг-и-алертинг)
10. [Метрики успеха](#метрики-успеха)
11. [Troubleshooting](#troubleshooting)

---

## Введение и целевые метрики

### Целевая нагрузка системы

| Метрика | MVP (текущая) | Рост (6 мес) | Масштаб (1-2 года) |
|---------|---------------|--------------|---------------------|
| **Клиенты (tenants)** | 10 | 100 | 1,000 |
| **Активные магазины** | 50 | 500 | 5,000 |
| **Активные кассы** | 100 | 1,000 | 10,000 |
| **Транзакций/сек** | 1-5 | 10-50 | 100-500 |
| **Запросов API/сек** | 10-20 | 100-200 | 1,000-2,000 |

### Целевая производительность после оптимизации

- **Latency (p95):** < 100ms для CRUD операций, < 50ms для read-only
- **Throughput:** > 1,000 RPS на одном сервере (4 CPU, 8GB RAM)
- **Database connections:** < 200 одновременных подключений
- **Cache hit rate:** > 80% для справочников (продукты, категории, настройки)
- **Uptime:** 99.9% (< 43 минут downtime в месяц)

---

## Текущее состояние системы

### Технологический стек

```yaml
Backend:
  Framework: NestJS 10.4.15
  Language: TypeScript 5.7.3
  ORM: Prisma (TO BE REPLACED)
  Database: PostgreSQL
  Cache: None (TO BE ADDED)
  Queue: None (OPTIONAL)

Frontend:
  Web: Next.js (App Router)
  Mobile: Flutter (Android)

Infrastructure:
  Deployment: Docker (планируется)
  Orchestration: Docker Compose → Kubernetes (в будущем)
  Load Balancer: None (TO BE ADDED)
  Monitoring: None (TO BE ADDED)
```

### Известные узкие места

1. **Prisma ORM** - 20-40% overhead на database операциях
2. **No caching** - Каждый запрос идет в PostgreSQL
3. **No connection pooling** - Каждый API instance создает свои connections
4. **No indexes** - Медленные запросы на больших таблицах
5. **No partitioning** - Таблицы receipts, stock_movements будут огромными
6. **No monitoring** - Нет visibility в production проблемы

---

## Этап 1: Benchmark текущей производительности

**Цель:** Измерить текущую производительность, чтобы отслеживать улучшения

### Шаг 1.1: Установить инструменты для benchmarking

```bash
# Установить Apache Bench (Windows)
# Скачать с https://www.apachelounge.com/download/

# Или использовать autocannon (Node.js)
pnpm add -D autocannon
pnpm add -D clinic
```

### Шаг 1.2: Создать benchmark скрипты

Создать файл `scripts/benchmark/api-benchmark.ts`:

```typescript
import autocannon from 'autocannon';

const scenarios = {
  // Сценарий 1: Поиск продукта по штрих-коду (самый частый запрос)
  productSearch: {
    url: 'http://localhost:3001/api/products/search',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TEST_TOKEN'
    },
    body: JSON.stringify({
      tenantId: 'test-tenant',
      barcode: '4607046270106'
    })
  },

  // Сценарий 2: Создание чека (критичная операция)
  createReceipt: {
    url: 'http://localhost:3001/api/receipts',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TEST_TOKEN'
    },
    body: JSON.stringify({
      tenantId: 'test-tenant',
      storeId: 'test-store',
      items: [
        { productId: 'prod-1', quantity: 2, price: 10000 },
        { productId: 'prod-2', quantity: 1, price: 25000 }
      ],
      total: 45000
    })
  },

  // Сценарий 3: Список продуктов (часто используется)
  listProducts: {
    url: 'http://localhost:3001/api/products?tenantId=test-tenant&limit=50',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer YOUR_TEST_TOKEN'
    }
  }
};

async function runBenchmark(name: string, config: any) {
  console.log(`\n=== Running benchmark: ${name} ===\n`);

  const result = await autocannon({
    url: config.url,
    method: config.method,
    headers: config.headers,
    body: config.body,
    connections: 10, // Concurrent connections
    duration: 30, // 30 seconds
    pipelining: 1
  });

  console.log(`\nResults for ${name}:`);
  console.log(`- Requests/sec: ${result.requests.mean}`);
  console.log(`- Latency p95: ${result.latency.p95}ms`);
  console.log(`- Latency p99: ${result.latency.p99}ms`);
  console.log(`- Throughput: ${result.throughput.mean} bytes/sec`);

  return result;
}

async function main() {
  const results: Record<string, any> = {};

  for (const [name, config] of Object.entries(scenarios)) {
    results[name] = await runBenchmark(name, config);
    // Пауза между тестами
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Сохранить результаты
  const fs = require('fs');
  fs.writeFileSync(
    './benchmark-results.json',
    JSON.stringify(results, null, 2)
  );

  console.log('\n✅ Benchmark results saved to benchmark-results.json');
}

main().catch(console.error);
```

### Шаг 1.3: Запустить baseline benchmark

```bash
# 1. Запустить dev сервер
pnpm dev

# 2. В отдельном терминале запустить benchmark
pnpm tsx scripts/benchmark/api-benchmark.ts

# 3. Сохранить результаты как baseline
cp benchmark-results.json benchmark-baseline.json
```

### Чеклист Этапа 1

- [ ] Установлены инструменты benchmarking
- [ ] Создан скрипт api-benchmark.ts
- [ ] Запущен baseline benchmark
- [ ] Результаты сохранены в benchmark-baseline.json
- [ ] Записаны текущие метрики:
  - [ ] Requests/sec: ______
  - [ ] Latency p95: ______ms
  - [ ] Latency p99: ______ms

---

## Этап 2: Redis кэширование

**Цель:** Снизить нагрузку на PostgreSQL, ускорить read-only операции в 10-100x

**Ожидаемый результат:** Cache hit rate > 80%, latency для кэшируемых запросов < 10ms

### Шаг 2.1: Установить Redis и клиент

```bash
# Установить Redis клиент
pnpm add ioredis
pnpm add -D @types/ioredis

# Docker Compose для Redis (добавить в docker-compose.yml)
```

Создать или обновить `docker-compose.yml`:

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: jowi-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  postgres:
    image: postgres:16-alpine
    container_name: jowi-postgres
    environment:
      POSTGRES_DB: jowi_shop
      POSTGRES_USER: jowi
      POSTGRES_PASSWORD: jowi_dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  redis-data:
  postgres-data:
```

```bash
# Запустить Redis
docker-compose up -d redis
```

### Шаг 2.2: Создать Redis модуль

Создать `packages/cache/package.json`:

```json
{
  "name": "@jowi/cache",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "ioredis": "^5.8.2"
  },
  "devDependencies": {
    "@types/ioredis": "^5.0.0"
  }
}
```

Создать `packages/cache/src/redis.client.ts`:

```typescript
import Redis from 'ioredis';

export class RedisClient {
  private client: Redis;

  constructor(url?: string) {
    this.client = new Redis(url || process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true,
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
    });
  }

  async connect() {
    await this.client.connect();
  }

  async disconnect() {
    await this.client.quit();
  }

  // Базовые операции
  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  // Batch операции
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    const values = await this.client.mget(...keys);
    return values.map(v => v ? JSON.parse(v) : null);
  }

  async mset<T>(entries: Record<string, T>, ttlSeconds?: number): Promise<void> {
    const pipeline = this.client.pipeline();

    for (const [key, value] of Object.entries(entries)) {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        pipeline.setex(key, ttlSeconds, serialized);
      } else {
        pipeline.set(key, serialized);
      }
    }

    await pipeline.exec();
  }

  // Increment для счетчиков
  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  async incrBy(key: string, increment: number): Promise<number> {
    return await this.client.incrby(key, increment);
  }

  // TTL управление
  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  // Hash operations для сложных объектов
  async hget<T>(key: string, field: string): Promise<T | null> {
    const value = await this.client.hget(key, field);
    return value ? JSON.parse(value) : null;
  }

  async hset<T>(key: string, field: string, value: T): Promise<void> {
    await this.client.hset(key, field, JSON.stringify(value));
  }

  async hgetall<T>(key: string): Promise<Record<string, T>> {
    const entries = await this.client.hgetall(key);
    const result: Record<string, T> = {};
    for (const [field, value] of Object.entries(entries)) {
      result[field] = JSON.parse(value);
    }
    return result;
  }

  // Stats
  async info(): Promise<string> {
    return await this.client.info();
  }

  async flushdb(): Promise<void> {
    await this.client.flushdb();
  }
}

// Singleton instance
export const redis = new RedisClient();
```

Создать `packages/cache/src/cache.decorator.ts`:

```typescript
import { redis } from './redis.client';

export interface CacheOptions {
  ttl?: number; // Seconds
  keyPrefix?: string;
  keyGenerator?: (...args: any[]) => string;
}

/**
 * Декоратор для автоматического кэширования методов
 *
 * @example
 * class ProductService {
 *   @Cacheable('product', { ttl: 3600 })
 *   async findById(tenantId: string, id: string) {
 *     return db.query.products.findFirst({ where: eq(products.id, id) });
 *   }
 * }
 */
export function Cacheable(prefix: string, options: CacheOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Генерация cache key
      const cacheKey = options.keyGenerator
        ? `${prefix}:${options.keyGenerator(...args)}`
        : `${prefix}:${JSON.stringify(args)}`;

      // Попытка получить из кэша
      const cached = await redis.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Если нет в кэше - выполнить оригинальный метод
      const result = await originalMethod.apply(this, args);

      // Сохранить в кэш
      if (result !== null && result !== undefined) {
        await redis.set(cacheKey, result, options.ttl || 3600);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Декоратор для инвалидации кэша после выполнения метода
 *
 * @example
 * class ProductService {
 *   @CacheEvict('product:*')
 *   async update(tenantId: string, id: string, data: any) {
 *     return db.update(products).set(data).where(eq(products.id, id));
 *   }
 * }
 */
export function CacheEvict(pattern: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      // Инвалидировать кэш после успешного выполнения
      await redis.delPattern(pattern);

      return result;
    };

    return descriptor;
  };
}
```

Создать `packages/cache/src/index.ts`:

```typescript
export { RedisClient, redis } from './redis.client';
export { Cacheable, CacheEvict, type CacheOptions } from './cache.decorator';
```

### Шаг 2.3: Интегрировать кэширование в API

Обновить `apps/api/package.json`:

```json
{
  "dependencies": {
    "@jowi/cache": "workspace:*",
    // ... остальные зависимости
  }
}
```

Создать `apps/api/src/cache/cache.module.ts`:

```typescript
import { Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { redis } from '@jowi/cache';

@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useValue: redis,
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class CacheModule implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await redis.connect();
  }

  async onModuleDestroy() {
    await redis.disconnect();
  }
}
```

Пример использования в сервисе `apps/api/src/products/products.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { Cacheable, CacheEvict } from '@jowi/cache';
import { db } from '@jowi/database';
import { products } from '@jowi/database/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class ProductsService {

  @Cacheable('product', {
    ttl: 3600, // 1 час
    keyGenerator: (tenantId: string, id: string) => `${tenantId}:${id}`
  })
  async findById(tenantId: string, id: string) {
    return db.query.products.findFirst({
      where: and(
        eq(products.tenantId, tenantId),
        eq(products.id, id)
      )
    });
  }

  @Cacheable('product:barcode', {
    ttl: 3600,
    keyGenerator: (tenantId: string, barcode: string) => `${tenantId}:${barcode}`
  })
  async findByBarcode(tenantId: string, barcode: string) {
    return db.query.products.findFirst({
      where: and(
        eq(products.tenantId, tenantId),
        eq(products.barcode, barcode)
      )
    });
  }

  @CacheEvict('product:*')
  async update(tenantId: string, id: string, data: any) {
    return db.update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(products.tenantId, tenantId),
        eq(products.id, id)
      ))
      .returning();
  }

  @CacheEvict('product:*')
  async delete(tenantId: string, id: string) {
    return db.delete(products)
      .where(and(
        eq(products.tenantId, tenantId),
        eq(products.id, id)
      ));
  }
}
```

### Шаг 2.4: Добавить мониторинг кэша

Создать `apps/api/src/cache/cache.controller.ts`:

```typescript
import { Controller, Get, Delete, Inject } from '@nestjs/common';
import { RedisClient } from '@jowi/cache';

@Controller('cache')
export class CacheController {
  constructor(
    @Inject('REDIS_CLIENT') private redis: RedisClient
  ) {}

  @Get('stats')
  async getStats() {
    const info = await this.redis.info();

    // Парсим Redis INFO вывод
    const lines = info.split('\r\n');
    const stats: Record<string, any> = {};

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        stats[key] = value;
      }
    }

    return {
      connected: true,
      usedMemory: stats.used_memory_human,
      connectedClients: stats.connected_clients,
      opsPerSec: stats.instantaneous_ops_per_sec,
      hitRate: this.calculateHitRate(stats),
    };
  }

  @Delete('flush')
  async flushCache() {
    await this.redis.flushdb();
    return { message: 'Cache flushed successfully' };
  }

  private calculateHitRate(stats: Record<string, any>): string {
    const hits = parseInt(stats.keyspace_hits || '0');
    const misses = parseInt(stats.keyspace_misses || '0');
    const total = hits + misses;

    if (total === 0) return '0%';

    const rate = (hits / total) * 100;
    return `${rate.toFixed(2)}%`;
  }
}
```

### Чеклист Этапа 2

- [ ] Redis установлен и запущен (docker-compose up -d redis)
- [ ] Создан пакет @jowi/cache
- [ ] RedisClient реализован
- [ ] Декораторы @Cacheable и @CacheEvict созданы
- [ ] CacheModule добавлен в API
- [ ] Кэширование применено к ProductsService
- [ ] CacheController создан для мониторинга
- [ ] Протестировано:
  - [ ] GET /cache/stats показывает статистику
  - [ ] Cache hit rate > 50% после 100 запросов
  - [ ] Latency для кэшированных запросов < 10ms

---

## Этап 3: Database индексы и партиционирование

**Цель:** Ускорить database queries в 3-10x для больших таблиц

**Ожидаемый результат:** Query time < 50ms для filtered/sorted queries

### Шаг 3.1: Анализ текущих slow queries

Включить логирование медленных запросов в PostgreSQL:

```sql
-- В psql или через pgAdmin
ALTER SYSTEM SET log_min_duration_statement = 100; -- Логировать запросы > 100ms
ALTER SYSTEM SET log_statement = 'all'; -- Логировать все statements
SELECT pg_reload_conf();
```

Или добавить в `postgresql.conf`:

```conf
log_min_duration_statement = 100
log_statement = 'all'
log_duration = on
```

### Шаг 3.2: Создать миграцию с индексами

Создать `packages/database/migrations/003_add_performance_indexes.sql`:

```sql
-- ============================================
-- Performance Indexes для JOWi Shop
-- ============================================

-- Продукты: поиск по штрих-коду (самый частый запрос на кассе)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_tenant_barcode
  ON products(tenant_id, barcode);

-- Продукты: поиск по названию (автокомплит)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_tenant_name
  ON products(tenant_id, name);

-- Продукты: фильтрация по категории
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_tenant_category
  ON products(tenant_id, category_id)
  WHERE deleted_at IS NULL;

-- Чеки: список чеков по магазину (sorted by date DESC)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_receipts_tenant_store_date
  ON receipts(tenant_id, store_id, created_at DESC);

-- Чеки: поиск по кассе и дате
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_receipts_tenant_terminal_date
  ON receipts(tenant_id, terminal_id, created_at DESC);

-- Чеки: поиск по номеру чека
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_receipts_tenant_number
  ON receipts(tenant_id, receipt_number);

-- Товары в чеке: быстрая выборка items для конкретного чека
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_receipt_items_receipt
  ON receipt_items(receipt_id);

-- Складские остатки: проверка наличия товара на складе
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_tenant_warehouse_product
  ON stock(tenant_id, warehouse_id, product_id)
  WHERE deleted_at IS NULL;

-- Движения товаров: история по товару
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_movements_tenant_product_date
  ON stock_movements(tenant_id, product_id, created_at DESC);

-- Движения товаров: история по складу
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_movements_tenant_warehouse_date
  ON stock_movements(tenant_id, warehouse_id, created_at DESC);

-- Смены: текущая открытая смена для терминала
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shifts_tenant_terminal_status
  ON shifts(tenant_id, terminal_id, status)
  WHERE status = 'open';

-- Платежи: по чеку
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_receipt
  ON payments(receipt_id);

-- Клиенты: поиск по телефону (loyalty)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_tenant_phone
  ON customers(tenant_id, phone);

-- Сотрудники: по магазину
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_tenant_store
  ON employees(tenant_id, store_id)
  WHERE deleted_at IS NULL;

-- Composite index для RLS (tenant isolation)
-- Убедиться что все таблицы имеют tenant_id index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_tenant
  ON categories(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_warehouses_tenant
  ON warehouses(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stores_tenant
  ON stores(tenant_id);

-- ============================================
-- Statistics для оптимизатора
-- ============================================

-- Увеличить statistics target для часто фильтруемых колонок
ALTER TABLE products ALTER COLUMN tenant_id SET STATISTICS 1000;
ALTER TABLE products ALTER COLUMN barcode SET STATISTICS 1000;
ALTER TABLE receipts ALTER COLUMN tenant_id SET STATISTICS 1000;
ALTER TABLE receipts ALTER COLUMN created_at SET STATISTICS 1000;

-- ============================================
-- Full-Text Search для поиска продуктов
-- ============================================

-- Добавить tsvector колонку для полнотекстового поиска
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Создать триггер для автоматического обновления search_vector
CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('russian', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('russian', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('russian', COALESCE(NEW.barcode, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_search_vector_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

-- Индекс для full-text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search_vector
  ON products USING GIN(search_vector);

-- Обновить существующие записи
UPDATE products SET search_vector =
  setweight(to_tsvector('russian', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('russian', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('russian', COALESCE(barcode, '')), 'A');

-- ============================================
-- Analyze tables для обновления statistics
-- ============================================

ANALYZE products;
ANALYZE receipts;
ANALYZE receipt_items;
ANALYZE stock;
ANALYZE stock_movements;
ANALYZE shifts;
```

### Шаг 3.3: Партиционирование больших таблиц

Создать `packages/database/migrations/004_add_partitioning.sql`:

```sql
-- ============================================
-- Партиционирование таблицы receipts по датам
-- ============================================

-- Шаг 1: Создать новую партиционированную таблицу
CREATE TABLE receipts_partitioned (
  LIKE receipts INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Шаг 2: Создать партиции по кварталам
CREATE TABLE receipts_2024_q1 PARTITION OF receipts_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE receipts_2024_q2 PARTITION OF receipts_partitioned
  FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

CREATE TABLE receipts_2024_q3 PARTITION OF receipts_partitioned
  FOR VALUES FROM ('2024-07-01') TO ('2024-10-01');

CREATE TABLE receipts_2024_q4 PARTITION OF receipts_partitioned
  FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');

CREATE TABLE receipts_2025_q1 PARTITION OF receipts_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

-- Создать default партицию для будущих дат
CREATE TABLE receipts_default PARTITION OF receipts_partitioned
  DEFAULT;

-- Шаг 3: Скопировать данные из старой таблицы (если есть)
-- ОСТОРОЖНО: эта операция может занять время на больших таблицах
-- INSERT INTO receipts_partitioned SELECT * FROM receipts;

-- Шаг 4: Переименовать таблицы (когда будете готовы)
-- ALTER TABLE receipts RENAME TO receipts_old;
-- ALTER TABLE receipts_partitioned RENAME TO receipts;

-- ============================================
-- Партиционирование stock_movements
-- ============================================

CREATE TABLE stock_movements_partitioned (
  LIKE stock_movements INCLUDING ALL
) PARTITION BY RANGE (created_at);

CREATE TABLE stock_movements_2024_q1 PARTITION OF stock_movements_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE stock_movements_2024_q2 PARTITION OF stock_movements_partitioned
  FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

CREATE TABLE stock_movements_2024_q3 PARTITION OF stock_movements_partitioned
  FOR VALUES FROM ('2024-07-01') TO ('2024-10-01');

CREATE TABLE stock_movements_2024_q4 PARTITION OF stock_movements_partitioned
  FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');

CREATE TABLE stock_movements_2025_q1 PARTITION OF stock_movements_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

CREATE TABLE stock_movements_default PARTITION OF stock_movements_partitioned
  DEFAULT;

-- ============================================
-- Скрипт для автоматического создания партиций
-- ============================================

CREATE OR REPLACE FUNCTION create_quarterly_partitions(
  table_name TEXT,
  start_date DATE,
  num_quarters INT
)
RETURNS VOID AS $$
DECLARE
  partition_name TEXT;
  partition_start DATE;
  partition_end DATE;
  quarter_start DATE;
BEGIN
  quarter_start := DATE_TRUNC('quarter', start_date);

  FOR i IN 0..(num_quarters - 1) LOOP
    partition_start := quarter_start + (i || ' months')::INTERVAL * 3;
    partition_end := partition_start + INTERVAL '3 months';
    partition_name := table_name || '_' ||
                      TO_CHAR(partition_start, 'YYYY') || '_q' ||
                      TO_CHAR(partition_start, 'Q');

    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
      partition_name,
      table_name,
      partition_start,
      partition_end
    );

    RAISE NOTICE 'Created partition: %', partition_name;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Пример использования: создать партиции на 2 года вперед
-- SELECT create_quarterly_partitions('receipts_partitioned', '2025-01-01', 8);
```

### Шаг 3.4: Запустить миграции

```bash
# Применить миграции
pnpm --filter @jowi/database db:migrate

# Или вручную через psql
psql -U jowi -d jowi_shop -f packages/database/migrations/003_add_performance_indexes.sql
psql -U jowi -d jowi_shop -f packages/database/migrations/004_add_partitioning.sql
```

### Шаг 3.5: Мониторинг использования индексов

Создать `scripts/db/check-index-usage.sql`:

```sql
-- Проверить какие индексы используются
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Найти неиспользуемые индексы (кандидаты на удаление)
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Размер таблиц и индексов
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) -
                 pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Чеклист Этапа 3

- [ ] Slow query logging включен в PostgreSQL
- [ ] Миграция 003_add_performance_indexes.sql выполнена
- [ ] Миграция 004_add_partitioning.sql выполнена
- [ ] Все индексы созданы успешно (проверить через \di в psql)
- [ ] Full-text search работает для продуктов
- [ ] Партиции созданы для receipts и stock_movements
- [ ] Протестировано:
  - [ ] Поиск продукта по barcode < 10ms
  - [ ] Список чеков по store_id + date < 50ms
  - [ ] Full-text search по названию продукта работает

---

## Этап 4: Миграция с Prisma на Drizzle ORM

**Цель:** Увеличить производительность database операций на 30-50%

**Ожидаемый результат:** Latency снижается на 30%, throughput увеличивается на 50%

### Шаг 4.1: Установить Drizzle ORM

```bash
# В packages/database
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit
```

### Шаг 4.2: Создать Drizzle schema

Создать `packages/database/src/schema/index.ts`:

```typescript
export * from './products.schema';
export * from './receipts.schema';
export * from './stock.schema';
export * from './users.schema';
export * from './stores.schema';
// ... экспорт всех schema файлов
```

Создать `packages/database/src/schema/products.schema.ts`:

```typescript
import { pgTable, uuid, varchar, text, integer, timestamp, index, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  barcode: varchar('barcode', { length: 50 }),
  sku: varchar('sku', { length: 100 }),
  categoryId: uuid('category_id'),
  price: integer('price').notNull(), // В тийинах (UZS * 100)
  cost: integer('cost'), // Себестоимость
  unit: varchar('unit', { length: 20 }).default('pcs'),
  taxRate: integer('tax_rate').default(0), // В процентах * 100 (например 1500 = 15%)
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  tenantIdx: index('idx_products_tenant').on(table.tenantId),
  barcodeIdx: index('idx_products_tenant_barcode').on(table.tenantId, table.barcode),
  nameIdx: index('idx_products_tenant_name').on(table.tenantId, table.name),
  categoryIdx: index('idx_products_tenant_category').on(table.tenantId, table.categoryId),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  receiptItems: many(receiptItems),
  stockMovements: many(stockMovements),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
```

Создать `packages/database/src/schema/receipts.schema.ts`:

```typescript
import { pgTable, uuid, varchar, integer, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const receiptStatusEnum = pgEnum('receipt_status', ['draft', 'completed', 'cancelled', 'refunded']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'card', 'transfer', 'mixed']);

export const receipts = pgTable('receipts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  storeId: uuid('store_id').notNull(),
  terminalId: uuid('terminal_id'),
  shiftId: uuid('shift_id'),
  receiptNumber: varchar('receipt_number', { length: 50 }).notNull(),
  status: receiptStatusEnum('status').default('draft').notNull(),
  subtotal: integer('subtotal').notNull(), // Сумма до скидок
  discount: integer('discount').default(0),
  tax: integer('tax').default(0),
  total: integer('total').notNull(), // Итоговая сумма
  customerId: uuid('customer_id'),
  employeeId: uuid('employee_id'),
  fiscalData: text('fiscal_data'), // JSON с данными фискализации
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantStoreIdx: index('idx_receipts_tenant_store_date').on(table.tenantId, table.storeId, table.createdAt),
  tenantTerminalIdx: index('idx_receipts_tenant_terminal_date').on(table.tenantId, table.terminalId, table.createdAt),
  receiptNumberIdx: index('idx_receipts_tenant_number').on(table.tenantId, table.receiptNumber),
}));

export const receiptItems = pgTable('receipt_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  receiptId: uuid('receipt_id').notNull(),
  productId: uuid('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  price: integer('price').notNull(), // Цена за единицу
  discount: integer('discount').default(0),
  tax: integer('tax').default(0),
  subtotal: integer('subtotal').notNull(), // quantity * price
  total: integer('total').notNull(), // subtotal - discount + tax
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  receiptIdx: index('idx_receipt_items_receipt').on(table.receiptId),
}));

export const receiptsRelations = relations(receipts, ({ one, many }) => ({
  store: one(stores, {
    fields: [receipts.storeId],
    references: [stores.id],
  }),
  items: many(receiptItems),
  payments: many(payments),
}));

export const receiptItemsRelations = relations(receiptItems, ({ one }) => ({
  receipt: one(receipts, {
    fields: [receiptItems.receiptId],
    references: [receipts.id],
  }),
  product: one(products, {
    fields: [receiptItems.productId],
    references: [products.id],
  }),
}));

export type Receipt = typeof receipts.$inferSelect;
export type NewReceipt = typeof receipts.$inferInsert;
export type ReceiptItem = typeof receiptItems.$inferSelect;
export type NewReceiptItem = typeof receiptItems.$inferInsert;
```

### Шаг 4.3: Создать Drizzle client

Создать `packages/database/src/client.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Для миграций
export const migrationClient = postgres(connectionString, { max: 1 });

// Для query operations
const queryClient = postgres(connectionString, {
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });

export type DbClient = typeof db;
```

### Шаг 4.4: Создать миграционный скрипт

Создать `packages/database/drizzle.config.ts`:

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema/index.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### Шаг 4.5: Переписать сервисы с Prisma на Drizzle

Пример: `apps/api/src/products/products.service.ts`

**Было (Prisma):**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@jowi/database';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, limit = 50, offset = 0) {
    return this.prisma.product.findMany({
      where: { tenantId },
      take: limit,
      skip: offset,
      include: { category: true },
    });
  }

  async findByBarcode(tenantId: string, barcode: string) {
    return this.prisma.product.findFirst({
      where: { tenantId, barcode },
      include: { category: true },
    });
  }

  async create(tenantId: string, data: CreateProductDto) {
    return this.prisma.product.create({
      data: { ...data, tenantId },
    });
  }

  async update(tenantId: string, id: string, data: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id, tenantId },
      data,
    });
  }
}
```

**Стало (Drizzle):**

```typescript
import { Injectable } from '@nestjs/common';
import { db } from '@jowi/database';
import { products, categories } from '@jowi/database/schema';
import { eq, and } from 'drizzle-orm';
import { Cacheable, CacheEvict } from '@jowi/cache';

@Injectable()
export class ProductsService {

  @Cacheable('products:list', { ttl: 300 })
  async findAll(tenantId: string, limit = 50, offset = 0) {
    return db.query.products.findMany({
      where: eq(products.tenantId, tenantId),
      limit,
      offset,
      with: {
        category: true,
      },
    });
  }

  @Cacheable('product:barcode', {
    ttl: 3600,
    keyGenerator: (tenantId: string, barcode: string) => `${tenantId}:${barcode}`
  })
  async findByBarcode(tenantId: string, barcode: string) {
    return db.query.products.findFirst({
      where: and(
        eq(products.tenantId, tenantId),
        eq(products.barcode, barcode)
      ),
      with: {
        category: true,
      },
    });
  }

  @CacheEvict('product:*')
  async create(tenantId: string, data: CreateProductDto) {
    const [product] = await db.insert(products)
      .values({ ...data, tenantId })
      .returning();

    return product;
  }

  @CacheEvict('product:*')
  async update(tenantId: string, id: string, data: UpdateProductDto) {
    const [product] = await db.update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(products.id, id),
        eq(products.tenantId, tenantId)
      ))
      .returning();

    return product;
  }
}
```

### Шаг 4.6: Переписать сложные транзакции

Пример: создание чека с товарами

**Было (Prisma):**

```typescript
async createReceipt(tenantId: string, data: CreateReceiptDto) {
  return this.prisma.$transaction(async (tx) => {
    const receipt = await tx.receipt.create({
      data: {
        tenantId,
        storeId: data.storeId,
        total: data.total,
        items: {
          create: data.items, // N+1 queries!
        },
      },
      include: { items: true },
    });

    return receipt;
  });
}
```

**Стало (Drizzle):**

```typescript
async createReceipt(tenantId: string, data: CreateReceiptDto) {
  return db.transaction(async (tx) => {
    // 1. Создать чек
    const [receipt] = await tx.insert(receipts)
      .values({
        tenantId,
        storeId: data.storeId,
        receiptNumber: await this.generateReceiptNumber(tenantId),
        subtotal: data.subtotal,
        discount: data.discount || 0,
        tax: data.tax || 0,
        total: data.total,
        status: 'draft',
      })
      .returning();

    // 2. Добавить товары ОДНИМ запросом (batch insert)
    const items = await tx.insert(receiptItems)
      .values(
        data.items.map(item => ({
          receiptId: receipt.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
          tax: item.tax || 0,
          subtotal: item.quantity * item.price,
          total: (item.quantity * item.price) - (item.discount || 0) + (item.tax || 0),
        }))
      )
      .returning();

    // 3. Вернуть чек с items
    return {
      ...receipt,
      items,
    };
  });
}
```

### Шаг 4.7: План поэтапной миграции

**Неделя 1-2: Подготовка**
- [ ] Установить Drizzle
- [ ] Создать schema для всех таблиц
- [ ] Настроить Drizzle client
- [ ] Написать тесты для критичных операций

**Неделя 3-4: Миграция core сервисов**
- [ ] ProductsService
- [ ] CategoriesService
- [ ] StoresService
- [ ] EmployeesService

**Неделя 5-6: Миграция transactional сервисов**
- [ ] ReceiptsService (критично!)
- [ ] PaymentsService
- [ ] StockService
- [ ] ShiftsService

**Неделя 7: Тестирование**
- [ ] Unit tests
- [ ] Integration tests
- [ ] Load testing
- [ ] Сравнить performance с Prisma

**Неделя 8: Деплой**
- [ ] Удалить Prisma из зависимостей
- [ ] Обновить документацию
- [ ] Запустить в production

### Чеклист Этапа 4

- [ ] Drizzle ORM установлен
- [ ] Schema созданы для всех таблиц
- [ ] Drizzle client настроен
- [ ] Migrated services:
  - [ ] ProductsService
  - [ ] ReceiptsService
  - [ ] StockService
- [ ] Все unit tests проходят
- [ ] Benchmark показывает улучшение:
  - [ ] Latency снижена на 30%+
  - [ ] Throughput увеличен на 50%+

---

## Этап 5: Connection Pooling (PgBouncer)

**Цель:** Эффективное использование database connections, поддержка 1000+ concurrent clients

**Ожидаемый результат:** < 200 active DB connections при 1000+ API connections

### Шаг 5.1: Установить PgBouncer

Добавить в `docker-compose.yml`:

```yaml
services:
  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    container_name: jowi-pgbouncer
    environment:
      DATABASES_HOST: postgres
      DATABASES_PORT: 5432
      DATABASES_USER: jowi
      DATABASES_PASSWORD: jowi_dev_password
      DATABASES_DBNAME: jowi_shop
      PGBOUNCER_POOL_MODE: transaction
      PGBOUNCER_MAX_CLIENT_CONN: 1000
      PGBOUNCER_DEFAULT_POOL_SIZE: 25
      PGBOUNCER_MIN_POOL_SIZE: 10
      PGBOUNCER_RESERVE_POOL_SIZE: 5
      PGBOUNCER_MAX_DB_CONNECTIONS: 50
    ports:
      - "6432:6432"
    depends_on:
      - postgres
    volumes:
      - ./pgbouncer.ini:/etc/pgbouncer/pgbouncer.ini
```

Создать `pgbouncer.ini`:

```ini
[databases]
jowi_shop = host=postgres port=5432 dbname=jowi_shop

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 10
reserve_pool_size = 5
max_db_connections = 50
max_user_connections = 100
server_idle_timeout = 600
server_lifetime = 3600
server_connect_timeout = 15
query_timeout = 0
client_idle_timeout = 0
idle_transaction_timeout = 0
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1
```

### Шаг 5.2: Обновить DATABASE_URL

```bash
# .env.local
# Было:
DATABASE_URL=postgresql://jowi:jowi_dev_password@localhost:5432/jowi_shop

# Стало (через PgBouncer):
DATABASE_URL=postgresql://jowi:jowi_dev_password@localhost:6432/jowi_shop?pgbouncer=true
```

### Шаг 5.3: Мониторинг PgBouncer

Создать скрипт `scripts/db/pgbouncer-stats.sh`:

```bash
#!/bin/bash

# Подключиться к pgbouncer admin console
psql -h localhost -p 6432 -U jowi -d pgbouncer -c "SHOW POOLS;"
psql -h localhost -p 6432 -U jowi -d pgbouncer -c "SHOW CLIENTS;"
psql -h localhost -p 6432 -U jowi -d pgbouncer -c "SHOW SERVERS;"
psql -h localhost -p 6432 -U jowi -d pgbouncer -c "SHOW STATS;"
```

### Чеклист Этапа 5

- [ ] PgBouncer запущен (docker-compose up -d pgbouncer)
- [ ] DATABASE_URL обновлен
- [ ] API успешно подключается через PgBouncer
- [ ] Мониторинг показывает:
  - [ ] Active DB connections < 50
  - [ ] Клиентов может быть 1000+
  - [ ] No connection errors

---

## Этап 6: Horizontal Scaling

**Цель:** Возможность запускать несколько инстансов API для обработки большой нагрузки

**Ожидаемый результат:** Линейное масштабирование (2x instances = 2x throughput)

### Шаг 6.1: Dockerize приложение

Создать `apps/api/Dockerfile`:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages ./packages

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/api ./apps/api

# Build application
RUN pnpm --filter @jowi/api build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages ./packages

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=builder /app/apps/api/dist ./apps/api/dist

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]
```

### Шаг 6.2: Обновить docker-compose для scaling

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: jowi-nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - api
    networks:
      - jowi-network

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      DATABASE_URL: postgresql://jowi:jowi_dev_password@pgbouncer:6432/jowi_shop?pgbouncer=true
      REDIS_URL: redis://redis:6379
      PORT: 3001
    depends_on:
      - postgres
      - redis
      - pgbouncer
    deploy:
      replicas: 3  # Запустить 3 копии API
    networks:
      - jowi-network

  postgres:
    image: postgres:16-alpine
    container_name: jowi-postgres
    environment:
      POSTGRES_DB: jowi_shop
      POSTGRES_USER: jowi
      POSTGRES_PASSWORD: jowi_dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - jowi-network

  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    container_name: jowi-pgbouncer
    environment:
      DATABASES_HOST: postgres
      DATABASES_PORT: 5432
      DATABASES_USER: jowi
      DATABASES_PASSWORD: jowi_dev_password
      DATABASES_DBNAME: jowi_shop
      PGBOUNCER_POOL_MODE: transaction
      PGBOUNCER_MAX_CLIENT_CONN: 1000
      PGBOUNCER_DEFAULT_POOL_SIZE: 25
    ports:
      - "6432:6432"
    depends_on:
      - postgres
    networks:
      - jowi-network

  redis:
    image: redis:7-alpine
    container_name: jowi-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    networks:
      - jowi-network

volumes:
  postgres-data:
  redis-data:

networks:
  jowi-network:
    driver: bridge
```

### Шаг 6.3: Настроить Nginx load balancer

Создать `nginx.conf`:

```nginx
events {
    worker_connections 4096;
}

http {
    upstream api_backend {
        least_conn;  # Load balancing метод

        # API instances (Docker Compose создаст их автоматически)
        server api:3001 max_fails=3 fail_timeout=30s;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;

    # Connection limiting
    limit_conn_zone $binary_remote_addr zone=addr:10m;

    server {
        listen 80;
        server_name localhost;

        # Client body size limit
        client_max_body_size 10M;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Health check endpoint (не проксируется к API)
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # API endpoints
        location /api/ {
            # Rate limiting
            limit_req zone=api_limit burst=20 nodelay;
            limit_conn addr 10;

            # Proxy settings
            proxy_pass http://api_backend;
            proxy_http_version 1.1;

            # Headers
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Buffering
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 4k;

            # Keep-alive
            proxy_set_header Connection "";
        }

        # Metrics endpoint для Prometheus (опционально)
        location /metrics {
            proxy_pass http://api_backend;
            access_log off;
        }
    }
}
```

### Шаг 6.4: Запустить масштабируемую систему

```bash
# Build и запустить все сервисы
docker-compose up -d --build --scale api=3

# Проверить статус
docker-compose ps

# Проверить логи
docker-compose logs -f api

# Протестировать load balancing
for i in {1..10}; do
  curl http://localhost/api/health
done
```

### Шаг 6.5: Kubernetes deployment (для production)

Создать `k8s/api-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jowi-api
  labels:
    app: jowi-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: jowi-api
  template:
    metadata:
      labels:
        app: jowi-api
    spec:
      containers:
      - name: api
        image: jowi/api:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: jowi-secrets
              key: database-url
        - name: REDIS_URL
          value: redis://redis-service:6379
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: jowi-api-service
spec:
  selector:
    app: jowi-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: LoadBalancer

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: jowi-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: jowi-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Чеклист Этапа 6

- [ ] Dockerfile создан для API
- [ ] docker-compose.yml настроен для scaling
- [ ] Nginx load balancer настроен
- [ ] Система запущена с 3+ репликами
- [ ] Протестировано:
  - [ ] Load balancing работает (запросы распределяются)
  - [ ] Throughput увеличен пропорционально количеству реплик
  - [ ] При падении одной реплики система продолжает работать

---

## Этап 7: Мониторинг и алертинг

**Цель:** Visibility в production, быстрое обнаружение проблем

### Шаг 7.1: Prometheus + Grafana

Добавить в `docker-compose.yml`:

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: jowi-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - jowi-network

  grafana:
    image: grafana/grafana:latest
    container_name: jowi-grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana-dashboards:/etc/grafana/provisioning/dashboards
    depends_on:
      - prometheus
    networks:
      - jowi-network

volumes:
  prometheus-data:
  grafana-data:
```

Создать `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'jowi-api'
    static_configs:
      - targets: ['api:3001']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

### Шаг 7.2: Добавить metrics в API

```bash
pnpm add prom-client
```

Создать `apps/api/src/metrics/metrics.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, register } from 'prom-client';

@Injectable()
export class MetricsService {
  private httpRequestDuration: Histogram;
  private httpRequestTotal: Counter;
  private dbQueryDuration: Histogram;
  private cacheHitRate: Counter;
  private activeConnections: Gauge;

  constructor() {
    // HTTP request duration
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });

    // HTTP request total
    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    // Database query duration
    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1],
    });

    // Cache hit rate
    this.cacheHitRate = new Counter({
      name: 'cache_requests_total',
      help: 'Total number of cache requests',
      labelNames: ['result'], // hit or miss
    });

    // Active connections
    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
    });
  }

  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
    this.httpRequestTotal.inc({ method, route, status_code: statusCode });
  }

  recordDbQuery(operation: string, table: string, duration: number) {
    this.dbQueryDuration.observe({ operation, table }, duration);
  }

  recordCacheHit() {
    this.cacheHitRate.inc({ result: 'hit' });
  }

  recordCacheMiss() {
    this.cacheHitRate.inc({ result: 'miss' });
  }

  incrementActiveConnections() {
    this.activeConnections.inc();
  }

  decrementActiveConnections() {
    this.activeConnections.dec();
  }

  getMetrics() {
    return register.metrics();
  }
}
```

Создать metrics controller:

```typescript
import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  async getMetrics() {
    return this.metricsService.getMetrics();
  }
}
```

### Чеклист Этапа 7

- [ ] Prometheus установлен и собирает метрики
- [ ] Grafana настроена
- [ ] Дашборды созданы:
  - [ ] API Performance (latency, throughput)
  - [ ] Database Performance (query time, connections)
  - [ ] Cache Performance (hit rate)
  - [ ] System Resources (CPU, memory)
- [ ] Алерты настроены:
  - [ ] API latency > 500ms
  - [ ] Error rate > 5%
  - [ ] DB connections > 90% pool size
  - [ ] Cache hit rate < 70%

---

## Метрики успеха

### Baseline (до оптимизации)

| Метрика | Значение |
|---------|----------|
| Requests/sec (Product search) | _____ |
| Latency p95 (Product search) | _____ms |
| Requests/sec (Create receipt) | _____ |
| Latency p95 (Create receipt) | _____ms |
| DB connections (100 concurrent users) | _____ |
| Cache hit rate | 0% |

### Target (после оптимизации)

| Метрика | Целевое значение | Достигнуто |
|---------|------------------|------------|
| Requests/sec (Product search) | > 1,000 | [ ] |
| Latency p95 (Product search) | < 50ms | [ ] |
| Requests/sec (Create receipt) | > 500 | [ ] |
| Latency p95 (Create receipt) | < 100ms | [ ] |
| DB connections (100 concurrent users) | < 50 | [ ] |
| Cache hit rate | > 80% | [ ] |
| API instances needed for 1,000 RPS | < 5 | [ ] |

---

## Troubleshooting

### Проблема: Медленные запросы после добавления индексов

**Решение:**
```sql
-- Пересобрать statistics
ANALYZE products;
ANALYZE receipts;

-- Проверить используются ли индексы
EXPLAIN ANALYZE SELECT * FROM products WHERE tenant_id = '...' AND barcode = '...';
```

### Проблема: Redis connection timeout

**Решение:**
```bash
# Проверить Redis
docker-compose logs redis

# Увеличить timeout
# В RedisClient constructor:
this.client = new Redis(url, {
  connectTimeout: 10000, // 10 секунд
  maxRetriesPerRequest: 5
});
```

### Проблема: PgBouncer errors "no more connections allowed"

**Решение:**
```ini
# В pgbouncer.ini увеличить limits
max_client_conn = 2000
default_pool_size = 50
```

### Проблема: Drizzle migration errors

**Решение:**
```bash
# Сгенерировать миграции заново
pnpm drizzle-kit generate:pg

# Применить вручную
pnpm drizzle-kit push:pg
```

---

## Следующие шаги

После завершения всех этапов:

1. **Load testing в production-like среде**
   - Использовать k6 или Artillery
   - Симулировать реальную нагрузку
   - Найти bottlenecks

2. **Continuous optimization**
   - Регулярно проверять slow queries
   - Мониторить cache hit rate
   - Оптимизировать N+1 queries

3. **Disaster recovery planning**
   - Настроить database backups
   - Протестировать восстановление
   - Документировать процедуры

4. **Security hardening**
   - Rate limiting
   - API authentication improvements
   - SQL injection prevention

---

**Автор:** Claude Code
**Дата последнего обновления:** 2025-01-05
**Версия:** 1.0
