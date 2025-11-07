# Обновление финансовых моделей

Дата: 2025-01-07

## Изменения

### 1. Prisma Schema

Добавлены новые модели в `packages/database/prisma/schema.prisma`:

#### **Safe** (Сейфы)
- `id` - UUID, первичный ключ
- `tenantId` - UUID, связь с Business
- `storeId` - UUID, связь с Store
- `name` - Название сейфа
- `type` - Тип: `cash`, `bank_account`, `card_account`
- `accountNumber` - Номер счёта (опционально)
- `balance` - Баланс (DECIMAL 15,0)
- `isActive` - Активен/неактивен
- Timestamps: `createdAt`, `updatedAt`, `deletedAt`

#### **PaymentType** (Типы оплат)
- `id` - UUID, первичный ключ
- `tenantId` - UUID, связь с Business
- `safeId` - UUID, связь с Safe
- `name` - Название типа оплаты
- `icon` - Иконка (опционально)
- `color` - Цвет в формате #RRGGBB (опционально)
- Timestamps: `createdAt`, `updatedAt`, `deletedAt`

#### **TerminalPaymentType** (Связь касса-тип оплаты)
- `id` - UUID, первичный ключ
- `terminalId` - UUID, связь с Terminal
- `paymentTypeId` - UUID, связь с PaymentType
- `createdAt` - Дата создания
- Уникальный индекс: `(terminalId, paymentTypeId)`

### 2. Валидаторы Zod

Созданы валидаторы в `apps/api/src/modules/finance/dto/`:

#### **safe.dto.ts**
```typescript
CreateSafeSchema - создание сейфа
UpdateSafeSchema - обновление сейфа
SafeFilterSchema - фильтрация сейфов
```

#### **payment-type.dto.ts**
```typescript
CreatePaymentTypeSchema - создание типа оплаты
UpdatePaymentTypeSchema - обновление типа оплаты
PaymentTypeFilterSchema - фильтрация типов оплат
```

#### **terminal-payment-type.dto.ts**
```typescript
AssignPaymentTypesToTerminalSchema - привязка типов оплат к кассе
RemovePaymentTypeFromTerminalSchema - удаление типа оплаты с кассы
```

### 3. Обновленные страницы

#### **Safes Page** (`apps/web/src/app/store/[id]/finance/safes/page.tsx`)
- Удален `paymentMethod` из интерфейса Safe (это свойство Safe, а не способ оплаты)
- Обновлена валидация согласно Zod схеме
- Убраны лишние поля из формы создания

#### **Payment Types Page** (`apps/web/src/app/store/[id]/finance/payment-types/page.tsx`)
- Удален столбец "Способ оплаты" (это определяется через Safe)
- Добавлено отображение типа сейфа в столбце "Сейф"
- Обновлена валидация с проверкой формата цвета (#RRGGBB)
- Обновлена валидация UUID для safeId

#### **Cash Registers Page** (`apps/web/src/app/store/[id]/finance/cash-registers/page.tsx`)
- Обновлена валидация схемы создания кассы
- Интеграция с TerminalPaymentType для связи касс и типов оплат

### 4. Миграция базы данных

Создан SQL скрипт миграции: `packages/database/migrations/006_add_finance_models.sql`

**Включает:**
- Создание таблиц `safes`, `payment_types`, `terminal_payment_types`
- Индексы для оптимизации запросов
- Триггеры для автоматического обновления `updated_at`
- Внешние ключи и ограничения целостности

### 5. API модуль Finance

Создан модуль `apps/api/src/modules/finance/`:
```
finance/
├── dto/
│   ├── safe.dto.ts
│   ├── payment-type.dto.ts
│   ├── terminal-payment-type.dto.ts
│   └── index.ts
└── finance.module.ts
```

## Следующие шаги

1. **Применить миграцию**:
   ```bash
   cd packages/database
   # После остановки Prisma Studio:
   npx prisma db push
   # Или применить SQL миграцию вручную
   ```

2. **Генерация Prisma Client**:
   ```bash
   cd packages/database
   npx prisma generate
   ```

3. **Создать контроллеры и сервисы** для Finance модуля:
   - `SafesController` + `SafesService`
   - `PaymentTypesController` + `PaymentTypesService`
   - `TerminalPaymentTypesController` + `TerminalPaymentTypesService`

4. **Обновить seed данные** (`packages/database/src/seed.ts`):
   - Добавить примеры сейфов
   - Добавить примеры типов оплат
   - Связать кассы с типами оплат

5. **Тестирование**:
   - Юнит-тесты для валидаторов
   - Интеграционные тесты для API endpoints
   - E2E тесты для финансовых страниц

## Архитектурные решения

### Почему Safe отдельно от PaymentType?
- **Safe** - физическое хранилище денег (касса, банковский счёт, карточный счёт)
- **PaymentType** - способ оплаты, который привязан к конкретному Safe
- Пример:
  - Safe "Эквайринг Uzcard" (type: card_account)
  - PaymentType "Карта Uzcard" (привязан к Safe "Эквайринг Uzcard")
  - PaymentType "Карта Humo" (привязан к Safe "Эквайринг Uzcard")

### Связь Terminal - PaymentType
- Many-to-Many через junction table `terminal_payment_types`
- Каждая касса может принимать несколько способов оплаты
- Каждый способ оплаты может быть доступен на нескольких кассах

## Валидация

Все Zod схемы валидации синхронизированы между frontend и backend:
- Минимальная длина названий: 2 символа
- Максимальная длина названий: 100 символов
- UUID валидация для внешних ключей
- Regex валидация для цветов (#RRGGBB)
- Проверка обязательности полей

## Примечания

- Все таблицы включают `tenant_id` для multi-tenancy
- Soft delete через `deleted_at` для сохранения истории
- Индексы созданы для оптимизации запросов по tenant_id и связанным ключам
- Триггеры автоматически обновляют `updated_at` при изменении записей
