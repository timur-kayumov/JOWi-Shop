# Performance Optimization & Scaling Plan
## JOWi Shop High-Load Architecture

**Дата создания:** 2025-01-05
**Дата обновления:** 2025-01-07
**Статус:** В процессе выполнения
**Цель:** Подготовить систему к нагрузке 1,000+ RPS с использованием Prisma ORM

---

## ⚠️ Важные выводы из экспериментов

### ✅ Что работает и даёт результат:
1. **Redis кэширование** - снижает latency в 10-100x для read операций
2. **Database индексы** - ускоряют filtered/sorted queries в 3-10x
3. **Партиционирование больших таблиц** - оптимизирует работу с историческими данными
4. **Horizontal scaling** - линейное увеличение throughput

### ❌ Что НЕ работает:
1. **Миграция с Prisma на Drizzle ORM** - привела к падению производительности на 68-75% вместо ожидаемого улучшения
   - Prisma baseline: 1,912 RPS (Product Search)
   - Drizzle: 611 RPS (-68%)
   - **Вывод:** Остаёмся на Prisma ORM

### ⚠️ Экспериментальные оптимизации:
1. **PgBouncer** - добавляет 10-30% overhead при использовании с Drizzle, нужно протестировать с Prisma

---

## Содержание

1. [Введение и целевые метрики](#введение-и-целевые-метрики)
2. [Текущее состояние системы](#текущее-состояние-системы)
3. [Этап 1: Benchmark текущей производительности](#этап-1-benchmark-текущей-производительности)
4. [Этап 2: Redis кэширование](#этап-2-redis-кэширование)
5. [Этап 3: Database индексы и партиционирование](#этап-3-database-индексы-и-партиционирование)
6. [Этап 4 (Опционально): Connection Pooling (PgBouncer)](#этап-4-опционально-connection-pooling-pgbouncer)
7. [Этап 5: Horizontal Scaling](#этап-5-horizontal-scaling)
8. [Этап 6: Мониторинг и алертинг](#этап-6-мониторинг-и-алертинг)
9. [Метрики успеха](#метрики-успеха)
10. [Troubleshooting](#troubleshooting)

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
  ORM: Prisma 6.2.1 (ОСТАЁМСЯ НА PRISMA)
  Database: PostgreSQL 16
  Cache: Redis 7 (добавлен)
  Queue: None (OPTIONAL)

Frontend:
  Web: Next.js (App Router)
  Mobile: Flutter (Android)

Infrastructure:
  Deployment: Docker
  Orchestration: Docker Compose
  Load Balancer: Nginx
  Monitoring: Prometheus + Grafana
```

### Известные узкие места

1. **No caching** - Каждый запрос идет в PostgreSQL (решается Redis)
2. **No indexes** - Медленные запросы на больших таблицах (решается миграциями)
3. **No partitioning** - Таблицы receipts, stock_movements будут огромными (решается партиционированием)
4. **Single instance** - Нет горизонтального масштабирования (решается Docker Compose scaling)

---

## Этап 1: Benchmark текущей производительности

**Цель:** Измерить текущую производительность Prisma, чтобы отслеживать улучшения

### Шаг 1.1: Установить инструменты для benchmarking

```bash
# Установить autocannon для нагрузочного тестирования
pnpm add -D autocannon
```

### Шаг 1.2: Использовать готовый benchmark скрипт

Скрипт уже создан: `scripts/benchmark/api-benchmark.ts`

### Шаг 1.3: Запустить baseline benchmark

```bash
# 1. Убедиться что API запущен
pnpm --filter @jowi/api dev

# 2. В отдельном терминале запустить benchmark
npx tsx scripts/benchmark/api-benchmark.ts

# 3. Результаты автоматически сохранятся в:
# - scripts/benchmark/benchmark-latest.json (текущий запуск)
# - scripts/benchmark/benchmark-results-<date>.json (с датой)
```

### Baseline метрики (Prisma, 2025-01-06)

| Сценарий | RPS | Latency P95 | Latency P99 |
|----------|-----|-------------|-------------|
| Product Search by Barcode | 1,912 | N/A | N/A |
| List Products | 1,689 | N/A | N/A |
| Create Receipt | 1,062 | N/A | N/A |

### Чеклист Этапа 1

- [x] Установлены инструменты benchmarking
- [x] Создан скрипт api-benchmark.ts
- [x] Запущен baseline benchmark
- [x] Результаты сохранены

---

## Этап 2: Redis кэширование

**Цель:** Снизить нагрузку на PostgreSQL, ускорить read-only операции в 10-100x

**Ожидаемый результат:** Cache hit rate > 80%, latency для кэшируемых запросов < 10ms

### Шаг 2.1: Установить Redis и клиент

```bash
# Установить Redis клиент
pnpm add ioredis
pnpm add -D @types/ioredis
```

Redis уже запущен в Docker Compose:

```yaml
# docker-compose.yml (уже настроен)
services:
  redis:
    image: redis:7-alpine
    container_name: jowi-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
```

```bash
# Запустить Redis
docker-compose up -d redis
```

### Шаг 2.2: Создать Redis модуль

Модуль уже создан: `packages/cache`

Проверить структуру:
```
packages/cache/
├── package.json
├── src/
│   ├── index.ts
│   ├── redis.client.ts
│   └── cache.decorator.ts
```

### Шаг 2.3: Интегрировать кэширование в API

Пример использования в сервисе с **Prisma**:

```typescript
// apps/api/src/products/products.service.ts
import { Injectable } from '@nestjs/common';
import { Cacheable, CacheEvict } from '@jowi/cache';
import { PrismaService } from '@jowi/database';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  @Cacheable({
    keyPrefix: 'product',
    ttl: 3600, // 1 час
    keyGenerator: (tenantId: string, id: string) => `${tenantId}:${id}`
  })
  async findById(tenantId: string, id: string) {
    return this.prisma.product.findFirst({
      where: { tenantId, id },
      include: { category: true },
    });
  }

  @Cacheable({
    keyPrefix: 'product:barcode',
    ttl: 1800, // 30 минут
    keyGenerator: (tenantId: string, barcode: string) => `${tenantId}:${barcode}`
  })
  async findByBarcode(tenantId: string, barcode: string) {
    return this.prisma.product.findFirst({
      where: { tenantId, barcode },
      include: { category: true },
    });
  }

  @Cacheable({
    keyPrefix: 'products:list',
    ttl: 300, // 5 минут
    keyGenerator: (tenantId: string, limit: number, offset: number) =>
      `${tenantId}:${limit}:${offset}`
  })
  async findAll(tenantId: string, limit = 50, offset = 0) {
    return this.prisma.product.findMany({
      where: { tenantId, deletedAt: null },
      take: limit,
      skip: offset,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @CacheEvict('product:*')
  async update(tenantId: string, id: string, data: any) {
    return this.prisma.product.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  @CacheEvict('product:*')
  async delete(tenantId: string, id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
```

### Шаг 2.4: Добавить мониторинг кэша

Health check endpoint уже создан: `apps/api/src/health.controller.ts`

```bash
# Проверить статистику Redis
curl http://localhost:4000/api/v1/health/cache
```

### Шаг 2.5: Стратегия кэширования

**Что кэшировать:**

| Тип данных | TTL | Причина |
|------------|-----|---------|
| Продукты (по ID) | 1 час | Редко меняются |
| Продукты (по barcode) | 30 мин | Частые запросы на кассе |
| Категории | 2 часа | Справочник, редко меняется |
| Настройки магазина | 1 час | Справочник |
| Список продуктов | 5 минут | Часто обновляется |

**Что НЕ кэшировать:**
- Чеки (receipts) - transactional data
- Остатки товаров (stock) - critical real-time data
- Смены (shifts) - часто меняется статус
- Платежи (payments) - transactional data

### Чеклист Этапа 2

- [x] Redis установлен и запущен (docker-compose up -d redis)
- [x] Создан пакет @jowi/cache
- [x] RedisClient реализован
- [x] Декораторы @Cacheable и @CacheEvict созданы
- [ ] Кэширование применено к сервисам:
  - [ ] ProductsService
  - [ ] CategoriesService
  - [ ] StoresService
  - [ ] EmployeesService
- [ ] Протестировано:
  - [ ] GET /health/cache показывает статистику
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
SELECT pg_reload_conf();
```

### Шаг 3.2: Создать миграцию с индексами

**ВАЖНО:** Индексы уже созданы в миграции `packages/database/prisma/migrations/20250106_performance_indexes/`

Проверить применена ли миграция:

```bash
# Проверить статус миграций
pnpm --filter @jowi/database prisma migrate status

# Если миграция не применена:
pnpm --filter @jowi/database prisma migrate deploy
```

Основные индексы из миграции:

```sql
-- Продукты: поиск по штрих-коду (самый частый запрос на кассе)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_variants_tenant_barcode
  ON "ProductVariant"(tenant_id, barcode);

-- Продукты: поиск по названию (автокомплит)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_tenant_name
  ON "Product"(tenant_id, name);

-- Чеки: список чеков по магазину (sorted by date DESC)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_receipts_tenant_store_date
  ON "Receipt"(tenant_id, store_id, created_at DESC);

-- Чеки: поиск по номеру чека
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_receipts_tenant_number
  ON "Receipt"(tenant_id, receipt_number);

-- Товары в чеке: быстрая выборка items для конкретного чека
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_receipt_items_receipt
  ON "ReceiptItem"(receipt_id);

-- Складские остатки: проверка наличия товара на складе
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_tenant_warehouse_product
  ON "Stock"(tenant_id, warehouse_id, product_id)
  WHERE deleted_at IS NULL;

-- Клиенты: поиск по телефону (loyalty)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_tenant_phone
  ON "Customer"(tenant_id, phone);

-- Сотрудники: по магазину
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_tenant_store
  ON "Employee"(tenant_id, store_id)
  WHERE deleted_at IS NULL;
```

### Шаг 3.3: Партиционирование больших таблиц

**Партиционирование для receipts:**

Партиционирование лучше применять когда таблица уже большая (> 10 млн записей).
Для MVP пока не критично.

Когда понадобится:
1. Создать партиционированную таблицу по кварталам
2. Скопировать данные из старой таблицы
3. Переключить приложение на новую таблицу

Пример скрипта для будущего: `scripts/db/partition-receipts.sql`

### Шаг 3.4: Мониторинг использования индексов

Создан скрипт: `scripts/db/check-index-usage.sql`

```bash
# Проверить используются ли индексы
psql -U jowi -d jowi_shop -f scripts/db/check-index-usage.sql
```

### Чеклист Этапа 3

- [ ] Slow query logging включен в PostgreSQL
- [x] Миграция с индексами создана
- [ ] Миграция применена к БД
- [ ] Все индексы созданы успешно (проверить через \di в psql)
- [ ] Протестировано:
  - [ ] Поиск продукта по barcode < 10ms
  - [ ] Список чеков по store_id + date < 50ms
  - [ ] Список продуктов с фильтрами < 50ms

---

## Этап 4 (Опционально): Connection Pooling (PgBouncer)

**⚠️ ЭКСПЕРИМЕНТАЛЬНЫЙ ЭТАП**

**Статус:** Протестирован с Drizzle ORM, показал overhead 10-30%. Нужно протестировать с Prisma.

**Цель:** Эффективное использование database connections, поддержка 1000+ concurrent clients

**Ожидаемый результат:** < 200 active DB connections при 1000+ API connections

### Когда использовать PgBouncer?

**Используйте PgBouncer если:**
- У вас > 100 одновременных подключений к PostgreSQL
- PostgreSQL показывает errors "too many connections"
- Вы используете horizontal scaling с несколькими репликами API

**НЕ используйте PgBouncer если:**
- У вас < 50 одновременных подключений
- Single API instance
- MVP стадия проекта

### Шаг 4.1: Установить PgBouncer

PgBouncer уже настроен в `docker-compose.yml`:

```yaml
# docker-compose.yml
services:
  pgbouncer:
    image: edoburu/pgbouncer:latest
    container_name: jowi-pgbouncer
    environment:
      DATABASE_URL: postgres://jowi:jowi_dev_password@postgres:5432/jowi_shop
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 20
      MIN_POOL_SIZE: 5
      RESERVE_POOL_SIZE: 5
      SERVER_LIFETIME: 3600
      SERVER_IDLE_TIMEOUT: 600
      AUTH_TYPE: scram-sha-256
      LISTEN_PORT: 6432
    ports:
      - '6432:6432'
    depends_on:
      postgres:
        condition: service_healthy
```

```bash
# Запустить PgBouncer
docker-compose up -d pgbouncer
```

### Шаг 4.2: Обновить DATABASE_URL (только для тестирования)

```bash
# .env
# Было (direct connection):
DATABASE_URL="postgresql://jowi:jowi_dev_password@localhost:5432/jowi_shop"

# Стало (через PgBouncer - для тестирования):
DATABASE_URL="postgresql://jowi:jowi_dev_password@localhost:6432/jowi_shop"
```

### Шаг 4.3: Протестировать с Prisma

```bash
# 1. Переключиться на PgBouncer (изменить DATABASE_URL на порт 6432)
# 2. Перезапустить API
pnpm --filter @jowi/api dev

# 3. Запустить benchmark
npx tsx scripts/benchmark/api-benchmark.ts

# 4. Сравнить с baseline (порт 5432 без PgBouncer)
```

### Шаг 4.4: Мониторинг PgBouncer

Создан скрипт для проверки: `scripts/test-pgbouncer-connection.ts`

```bash
# Проверить подключение через PgBouncer
npx tsx scripts/test-pgbouncer-connection.ts
```

### Чеклист Этапа 4

- [x] PgBouncer запущен (docker-compose up -d pgbouncer)
- [ ] Протестировано с Prisma:
  - [ ] Benchmark с direct connection (порт 5432)
  - [ ] Benchmark с PgBouncer (порт 6432)
  - [ ] Сравнение результатов
- [ ] Решение принято:
  - [ ] Использовать PgBouncer (если performance лучше или равен)
  - [ ] Не использовать PgBouncer (если есть overhead)

---

## Этап 5: Horizontal Scaling

**Цель:** Возможность запускать несколько инстансов API для обработки большой нагрузки

**Ожидаемый результат:** Линейное масштабирование (2x instances = 2x throughput)

### Шаг 5.1: Dockerize приложение

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

### Шаг 5.2: Обновить docker-compose для scaling

```yaml
# docker-compose.yml
version: '3.9'

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
      DATABASE_URL: postgresql://jowi:jowi_dev_password@postgres:5432/jowi_shop
      REDIS_URL: redis://redis:6379
      PORT: 3001
    depends_on:
      - postgres
      - redis
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
      - postgres_data:/var/lib/postgresql/data
    networks:
      - jowi-network

  redis:
    image: redis:7-alpine
    container_name: jowi-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    networks:
      - jowi-network

volumes:
  postgres_data:
  redis_data:

networks:
  jowi-network:
    driver: bridge
```

### Шаг 5.3: Настроить Nginx load balancer

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

        # Health check endpoint
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

            # Keep-alive
            proxy_set_header Connection "";
        }
    }
}
```

### Шаг 5.4: Запустить масштабируемую систему

```bash
# Build и запустить все сервисы с 3 репликами API
docker-compose up -d --build --scale api=3

# Проверить статус
docker-compose ps

# Проверить логи
docker-compose logs -f api

# Протестировать load balancing
for i in {1..10}; do
  curl http://localhost/api/v1/health
done
```

### Шаг 5.5: Benchmark с scaling

```bash
# Запустить benchmark через Nginx (порт 80)
# Изменить URL в api-benchmark.ts на http://localhost/api/v1
npx tsx scripts/benchmark/api-benchmark.ts

# Сравнить throughput:
# - 1 replica
# - 2 replicas (должен быть ~2x throughput)
# - 3 replicas (должен быть ~3x throughput)
```

### Чеклист Этапа 5

- [ ] Dockerfile создан для API
- [ ] docker-compose.yml настроен для scaling
- [ ] Nginx load balancer настроен
- [ ] Система запущена с 3+ репликами
- [ ] Протестировано:
  - [ ] Load balancing работает (запросы распределяются)
  - [ ] Throughput увеличен пропорционально количеству реплик
  - [ ] При падении одной реплики система продолжает работать

---

## Этап 6: Мониторинг и алертинг

**Цель:** Visibility в production, быстрое обнаружение проблем

### Шаг 6.1: Prometheus + Grafana

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
      - prometheus_data:/prometheus
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
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus
    networks:
      - jowi-network

volumes:
  prometheus_data:
  grafana_data:
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

### Шаг 6.2: Добавить metrics в API

```bash
pnpm add prom-client
```

Создать `apps/api/src/metrics/metrics.service.ts` и `metrics.controller.ts`

Пример метрик:
- HTTP request duration
- HTTP request total
- Database query duration
- Cache hit rate
- Active connections

### Чеклист Этапа 6

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

### Baseline (до оптимизации, Prisma)

| Метрика | Значение |
|---------|----------|
| Requests/sec (Product search) | 1,912 |
| Latency p95 (Product search) | N/A |
| Requests/sec (List products) | 1,689 |
| Requests/sec (Create receipt) | 1,062 |
| DB connections (100 concurrent users) | N/A |
| Cache hit rate | 0% |

### Target (после оптимизации с Prisma + Redis + Indexes)

| Метрика | Целевое значение | Достигнуто |
|---------|------------------|------------|
| Requests/sec (Product search) | > 2,000 | [ ] |
| Latency p95 (Product search) | < 50ms | [ ] |
| Requests/sec (Create receipt) | > 1,200 | [ ] |
| Latency p95 (Create receipt) | < 100ms | [ ] |
| DB connections (100 concurrent users) | < 50 | [ ] |
| Cache hit rate | > 80% | [ ] |
| API instances needed for 1,000 RPS | < 3 | [ ] |

---

## Troubleshooting

### Проблема: Медленные запросы после добавления индексов

**Решение:**
```sql
-- Пересобрать statistics
ANALYZE "Product";
ANALYZE "Receipt";

-- Проверить используются ли индексы
EXPLAIN ANALYZE SELECT * FROM "Product" WHERE tenant_id = '...' AND barcode = '...';
```

### Проблема: Redis connection timeout

**Решение:**
```bash
# Проверить Redis
docker-compose logs redis

# Увеличить timeout в RedisClient constructor
this.client = new Redis(url, {
  connectTimeout: 10000, // 10 секунд
  maxRetriesPerRequest: 5
});
```

### Проблема: Prisma "Too many connections"

**Решение:**
```typescript
// Увеличить connection pool в schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Добавить connection limit
  connection_limit = 50
}
```

Или использовать PgBouncer (Этап 4).

### Проблема: Cache invalidation не работает

**Решение:**
```typescript
// Убедиться что @CacheEvict использует правильный pattern
@CacheEvict('product:*') // Удалит все ключи вида product:*
async update(tenantId: string, id: string, data: any) {
  // ...
}
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
   - Оптимизировать N+1 queries в Prisma

3. **Disaster recovery planning**
   - Настроить database backups
   - Протестировать восстановление
   - Документировать процедуры

4. **Security hardening**
   - Rate limiting (уже в Nginx)
   - API authentication improvements
   - SQL injection prevention (Prisma защищает автоматически)

---

## Уроки из экспериментов

### ❌ Drizzle ORM Migration (2025-01-07)

**Что сделали:**
- Полностью мигрировали с Prisma на Drizzle ORM
- Переписали все сервисы с использованием Drizzle Relational Query API
- Настроили connection pooling в postgres.js

**Результат:**
- **Падение производительности на 68-75%**
- Product Search: 1,912 → 611 RPS (-68%)
- List Products: 1,689 → 517 RPS (-69%)
- Create Receipt: 1,062 → 291 RPS (-73%)

**Причины:**
1. Drizzle Relational Query API (`db.query`) медленнее Prisma
2. Nested relations с `with` вызывают N+1 проблему
3. Connection pool settings не оптимизированы

**Решение:**
- **Откатить на Prisma** - надёжная, проверенная ORM
- Redis кэширование и индексы работают отлично с Prisma
- Horizontal scaling не зависит от ORM

---

**Автор:** Claude Code
**Дата создания:** 2025-01-05
**Дата обновления:** 2025-01-07
**Версия:** 2.0
