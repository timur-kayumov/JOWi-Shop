# Шаги восстановления после отката с Drizzle на Prisma

Этот файл содержит пошаговые инструкции для восстановления работоспособности проекта после отката коммитов с Drizzle ORM обратно на Prisma.

## Дата создания
2025-01-07

## Контекст
После тестирования производительности было обнаружено, что миграция на Drizzle ORM привела к падению производительности на 68-75%:
- Prisma baseline: Product Search 1,912 RPS
- Drizzle: Product Search 611 RPS (-68%)

Решение: откатить все изменения и остаться на Prisma ORM.

---

## Пошаговая инструкция

### Шаг 1: Завершить все background процессы

Сейчас запущено 19 background bash процессов. Их нужно завершить перед откатом.

**Команды для выполнения:**
```bash
# Проверить список процессов
# Используй команду: /bashes в CLI

# Завершить каждый процесс через KillShell tool
# ID процессов: 093935, c94954, 4e3ccf, 34fea7, ccf1dd, 39ece3, e7b543, b7cd62,
#               bbbf6c, 7c7552, ddc192, 263a7e, a602dc, aadc2c, b5eec8, 366e12,
#               d9d13c, c4faba, 6e4db5
```

### Шаг 2: Остановить Docker контейнеры и удалить volumes

```bash
docker-compose down -v
```

**Почему `-v` флаг:**
- Drizzle мог внести изменения в схему базы данных
- Безопаснее удалить старые volumes и пересоздать БД с чистого листа
- Будут удалены volumes: postgres_data, redis_data, nats_data, clickhouse_data, pgadmin_data

### Шаг 3: Git rollback

**НЕ ВЫПОЛНЯТЬ АВТОМАТИЧЕСКИ - ЖДАТЬ КОМАНДЫ ПОЛЬЗОВАТЕЛЯ**

Пользователь сам выполнит откат через GitHub веб-интерфейс или Git команды.

Целевой коммит: `5761a57` (последний коммит перед экспериментами с Drizzle)
Сообщение коммита: "полностью переработаны вход и регистрация, настроена мидлвэр для связи клиента и сервера"

### Шаг 4: Установить зависимости

После отката `package.json` и `pnpm-lock.yaml` вернутся к версии с Prisma.

```bash
pnpm install
```

**Что произойдет:**
- Будут удалены зависимости: `drizzle-orm`, `drizzle-kit`, `postgres` (postgres-js)
- Будут восстановлены зависимости: `@prisma/client`, `prisma`
- `node_modules` синхронизируется с `pnpm-lock.yaml`

### Шаг 5: Запустить Docker контейнеры

```bash
docker-compose up -d
```

**Что запустится:**
- `jowi-postgres` (PostgreSQL 16) на порту 5432
- `jowi-pgbouncer` (PgBouncer) на порту 6432
- `jowi-redis` (Redis 7) на порту 6379
- `jowi-nats` (NATS) на порту 4222
- `jowi-clickhouse` (ClickHouse 24) на порту 8123

### Шаг 6: Дождаться готовности PostgreSQL

```bash
timeout 10 bash -c 'until docker ps >/dev/null 2>&1; do sleep 1; done && echo "Docker is ready"'
```

Или проверить healthcheck:
```bash
docker ps
```

Дождаться пока статус `jowi-postgres` станет `healthy`.

### Шаг 7: Применить Prisma миграции

```bash
cd packages/database
npx prisma migrate deploy
```

**Что произойдет:**
- Prisma применит все миграции из `packages/database/prisma/migrations/`
- Будет создана таблица `_prisma_migrations` для отслеживания примененных миграций
- Будут созданы все таблицы согласно `schema.prisma`

### Шаг 8: Сгенерировать Prisma Client

```bash
cd packages/database
npx prisma generate
```

**Что произойдет:**
- Будет сгенерирован TypeScript-клиент в `node_modules/@prisma/client`
- Типы будут доступны для импорта в `apps/api`

### Шаг 9: Проверить переменные окружения

Убедиться, что `.env` использует правильный `DATABASE_URL`:

```bash
cat .env | findstr DATABASE_URL
```

**Ожидаемый результат:**
```
DATABASE_URL="postgresql://jowi:jowi_dev_password@localhost:5432/jowi_shop"
```

**Важно:**
- НЕ должно быть `?schema=public` в конце (это добавлял Prisma, но PgBouncer его не поддерживает)
- Если используется PgBouncer: заменить порт на `6432`

### Шаг 10: Проверить сборку API

```bash
cd apps/api
pnpm run type-check
```

**Ожидаемый результат:**
- Не должно быть TypeScript ошибок
- Все импорты `@prisma/client` должны разрешиться

### Шаг 11: Запустить API сервер

```bash
cd apps/api
pnpm dev
```

**Ожидаемый результат:**
```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] AppModule dependencies initialized
[Nest] INFO Application is running on: http://localhost:4000
```

### Шаг 12: Проверить healthcheck API

```bash
curl http://localhost:4000/health
```

**Ожидаемый результат:**
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected"
}
```

### Шаг 13: Восстановить finance страницы

Использовать файл `FINANCE_PAGES_BACKUP.md` для восстановления трёх страниц:

1. **Safes (Сейфы)**
   - Путь: `apps/web/src/app/store/[id]/finance/safes/page.tsx`
   - Скопировать код из секции "## 1. Safes Page" в backup файле

2. **Payment Types (Типы оплат)**
   - Путь: `apps/web/src/app/store/[id]/finance/payment-types/page.tsx`
   - Скопировать код из секции "## 2. Payment Types Page" в backup файле

3. **Cash Registers (Кассы)**
   - Путь: `apps/web/src/app/store/[id]/finance/cash-registers/page.tsx`
   - Скопировать код из секции "## 3. Cash Registers Page" в backup файле

**Зависимости (должны уже быть установлены):**
- `@jowi/ui` компоненты (Card, Button, Input, Form, DataTable, Dialog)
- `react-hook-form` + `zod`
- `lucide-react` (иконки)
- `i18next` (переводы)

### Шаг 14: Обновить переводы (если нужно)

Проверить, что в `packages/i18n/src/locales/*/finance.json` есть необходимые ключи:

```json
{
  "finance": {
    "safes": { ... },
    "paymentTypes": { ... },
    "cashRegisters": { ... }
  }
}
```

Если ключей нет, добавить их из секции "Translation Keys" в `FINANCE_PAGES_BACKUP.md`.

### Шаг 15: Проверить работу Web приложения

```bash
cd apps/web
pnpm dev
```

**Ожидаемый результат:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

Открыть в браузере:
- `http://localhost:3000/store/[id]/finance/safes`
- `http://localhost:3000/store/[id]/finance/payment-types`
- `http://localhost:3000/store/[id]/finance/cash-registers`

---

## Проверка успешности восстановления

### Чеклист

- [ ] Все background процессы завершены
- [ ] Docker контейнеры запущены и healthy
- [ ] Prisma миграции применены
- [ ] Prisma Client сгенерирован
- [ ] API сервер запускается без ошибок
- [ ] Healthcheck API возвращает `200 OK`
- [ ] Finance страницы восстановлены
- [ ] Web приложение запускается без ошибок
- [ ] Нет TypeScript ошибок
- [ ] Все зависимости установлены

---

## Следующие шаги (опционально)

После успешного восстановления можно попробовать оптимизации из `PERFORMANCE_OPTIMIZATION.md v2.0`:

1. **Redis кэширование** - добавить кэширование для read операций
2. **Database индексы** - применить миграцию с индексами
3. **Партиционирование** - для больших таблиц (receipts, stock_movements)
4. **PgBouncer тестирование** - протестировать PgBouncer с Prisma (без Drizzle!)

---

## Troubleshooting

### Проблема: Prisma миграции не применяются

**Симптом:**
```
Error: P1001: Can't reach database server
```

**Решение:**
1. Проверить статус PostgreSQL: `docker ps | findstr postgres`
2. Проверить логи: `docker logs jowi-postgres`
3. Проверить healthcheck: дождаться статуса `healthy`

### Проблема: TypeScript ошибки после отката

**Симптом:**
```
Cannot find module '@prisma/client'
```

**Решение:**
1. Удалить `node_modules`: `rm -rf node_modules`
2. Удалить lock файл: `rm pnpm-lock.yaml`
3. Переустановить: `pnpm install`
4. Перегенерировать Prisma: `cd packages/database && npx prisma generate`

### Проблема: API не может подключиться к БД

**Симптом:**
```
PrismaClientInitializationError: Can't reach database server
```

**Решение:**
1. Проверить `DATABASE_URL` в `.env`
2. Убрать `?schema=public` если есть
3. Использовать прямое подключение: порт `5432` (не PgBouncer `6432`)
4. Проверить логи PostgreSQL: `docker logs jowi-postgres`

### Проблема: Finance страницы не отображаются

**Симптом:**
404 Not Found или пустая страница

**Решение:**
1. Проверить, что файлы созданы в правильных путях
2. Проверить импорты компонентов из `@jowi/ui`
3. Проверить переводы в `packages/i18n/src/locales/*/finance.json`
4. Перезапустить Next.js dev сервер

---

## Контакты и документация

- **Performance Optimization Guide:** `PERFORMANCE_OPTIMIZATION.md`
- **Finance Pages Backup:** `FINANCE_PAGES_BACKUP.md`
- **Project Guidelines:** `CLAUDE.md`

---

**Создано:** 2025-01-07
**Версия:** 1.0
**Статус:** Ready for execution
