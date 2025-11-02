# Руководство по UI для Index страниц

## Описание

Этот документ описывает стандартную структуру UI для всех index/list страниц в приложении JOWi Shop. Следование этим правилам обеспечивает консистентность дизайна во всём приложении.

## Визуальная структура

```
┌─────────────────────────────────────────────────────────────┐
│ Card (белый контейнер с padding p-6)                        │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Заголовок (слева) + Кнопка создать (справа)          │   │
│  │                                                        │   │
│  │  H1: Название страницы                    [+ Создать] │   │
│  │  Description: Описание страницы                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Поиск (flex-1) + Фильтры (фиксированная ширина)      │   │
│  │                                                        │   │
│  │  [🔍 Поиск...]              [Фильтр 1▼] [Фильтр 2▼] │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Card (белый контейнер без padding)                          │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ DataTable (таблица с данными)                         │   │
│  │                                                        │   │
│  │  Название        │  Статус  │  Действия              │   │
│  │  ───────────────────────────────────────────────      │   │
│  │  Элемент 1       │  Активен │  [✏️] [🗑️] [→]        │   │
│  │  Элемент 2       │  Активен │  [✏️] [🗑️] [→]        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Структура кода

### Базовая структура

```tsx
export default function IndexPage() {
  const { t } = useTranslation('common');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6">
        {/* Заголовок и кнопка создать */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('pages.pageName.title')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('pages.pageName.description')}
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('pages.pageName.createButton')}
          </Button>
        </div>

        {/* Поиск и фильтры */}
        <div className="flex gap-4">
          {/* Поиск (flex-1 занимает всё доступное пространство) */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('pages.pageName.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Фильтры (фиксированная ширина w-[200px]) */}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('pages.pageName.filters.all')}</SelectItem>
              <SelectItem value="active">{t('pages.pageName.filters.active')}</SelectItem>
              <SelectItem value="inactive">{t('pages.pageName.filters.inactive')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Дополнительные фильтры (если нужны) */}
          <Select value={filter2} onValueChange={setFilter2}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {/* ... */}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table Card */}
      <Card>
        <DataTable
          data={filteredData}
          columns={columns}
          onRowClick={(item) => router.push(`/path/${item.id}`)}
          emptyMessage={t('pages.pageName.noItems')}
        />
      </Card>
    </div>
  );
}
```

## Правила и стандарты

### 1. Контейнеры

- **Верхний Card (Header)**: `<Card className="p-6">`
  - Содержит заголовок, описание, кнопку создать, поиск и фильтры
  - Padding `p-6` (24px) со всех сторон

- **Нижний Card (Table)**: `<Card>` (без padding)
  - Содержит только DataTable
  - Padding управляется самой таблицей

- **Отступ между Card**: `space-y-6` (24px между элементами)

### 2. Заголовок

```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-3xl font-bold tracking-tight">
      {t('pages.pageName.title')}
    </h1>
    <p className="text-muted-foreground mt-2">
      {t('pages.pageName.description')}
    </p>
  </div>
  <Button onClick={() => setIsCreateDialogOpen(true)}>
    <Plus className="mr-2 h-4 w-4" />
    {t('pages.pageName.createButton')}
  </Button>
</div>
```

**Характеристики:**
- Заголовок H1: `text-3xl font-bold tracking-tight`
- Описание: `text-muted-foreground mt-2`
- Кнопка справа: стандартный `Button` с иконкой `Plus`
- Отступ снизу: `mb-6` (24px)

### 3. Поиск

```tsx
<div className="flex-1">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      placeholder={t('pages.pageName.searchPlaceholder')}
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="pl-9"
    />
  </div>
</div>
```

**Характеристики:**
- Обертка: `flex-1` (занимает всё доступное пространство)
- Иконка поиска: `Search` из `lucide-react`, абсолютное позиционирование слева
- Input: padding слева `pl-9` для иконки
- Placeholder из переводов

### 4. Фильтры

```tsx
<Select value={filter} onValueChange={setFilter}>
  <SelectTrigger className="w-[200px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">{t('pages.pageName.filters.all')}</SelectItem>
    <SelectItem value="option1">{t('pages.pageName.filters.option1')}</SelectItem>
  </SelectContent>
</Select>
```

**Характеристики:**
- Ширина: фиксированная `w-[200px]`
- Расстояние между фильтрами: `gap-4` (16px) в родительском flex-контейнере
- Все опции из переводов

### 5. Контейнер для поиска и фильтров

```tsx
<div className="flex gap-4">
  {/* Поиск */}
  {/* Фильтры */}
</div>
```

**Характеристики:**
- Display: `flex`
- Gap: `gap-4` (16px между элементами)
- Поиск первый, фильтры после

## Примеры реализации

### Страница сотрудников (Employee List)
- ✅ Правильная структура
- Местоположение: `apps/web/src/app/(intranet)/employees/page.tsx`

### Страница категорий (Categories List)
- ✅ Правильная структура (после исправления)
- Местоположение: `apps/web/src/app/store/[id]/categories/page.tsx`

### Страница магазинов (Stores List)
- Местоположение: `apps/web/src/app/(intranet)/stores/page.tsx`
- Проверить соответствие структуре

### Страница клиентов (Customers List)
- Местоположение: `apps/web/src/app/(intranet)/customers/page.tsx`
- Проверить соответствие структуре

### Страница товаров (Products List)
- Местоположение: `apps/web/src/app/store/[id]/products/page.tsx`
- Проверить соответствие структуре

## Адаптивность

### Мобильные устройства (md и ниже)

На мобильных устройствах структура может меняться:

```tsx
<div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
  <div>
    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
      {t('pages.pageName.title')}
    </h1>
    <p className="text-muted-foreground mt-2">
      {t('pages.pageName.description')}
    </p>
  </div>
  <Button
    onClick={() => setIsCreateDialogOpen(true)}
    className="mt-4 md:mt-0"
  >
    <Plus className="mr-2 h-4 w-4" />
    {t('pages.pageName.createButton')}
  </Button>
</div>
```

Для поиска и фильтров:

```tsx
<div className="flex flex-col md:flex-row gap-4">
  <div className="flex-1">
    {/* Поиск */}
  </div>
  <Select value={filter} onValueChange={setFilter}>
    <SelectTrigger className="w-full md:w-[200px]">
      {/* ... */}
    </SelectTrigger>
  </Select>
</div>
```

## Переводы

Все текстовые элементы должны быть в файлах переводов:

```json
{
  "pages": {
    "pageName": {
      "title": "Заголовок страницы",
      "description": "Описание страницы",
      "createButton": "Создать элемент",
      "searchPlaceholder": "Поиск...",
      "filters": {
        "all": "Все",
        "active": "Активные",
        "inactive": "Неактивные"
      },
      "noItems": "Нет элементов"
    }
  }
}
```

## Компоненты из UI библиотеки

Все компоненты импортируются из `@jowi/ui`:

```tsx
import {
  Button,
  Input,
  Card,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DataTable,
} from '@jowi/ui';
import { Plus, Search } from 'lucide-react';
```

## Чек-лист для новых index страниц

- [ ] Используется структура с двумя Card (header + table)
- [ ] Верхний Card имеет `className="p-6"`
- [ ] Нижний Card без padding
- [ ] Заголовок H1 с правильными классами
- [ ] Описание с `text-muted-foreground`
- [ ] Кнопка создать справа с иконкой Plus
- [ ] Поиск с иконкой и `flex-1`
- [ ] Фильтры с фиксированной шириной `w-[200px]`
- [ ] Контейнер поиска/фильтров с `flex gap-4`
- [ ] Отступ между секциями `mb-6`
- [ ] Отступ между Cards `space-y-6`
- [ ] Все тексты из переводов
- [ ] DataTable в нижнем Card
- [ ] Адаптивность для мобильных устройств (опционально)

## Частые ошибки

❌ **Неправильно:**
```tsx
// Поиск и фильтры в одном Card с таблицей
<Card className="p-6">
  <div className="flex gap-4 mb-6">
    {/* поиск и фильтры */}
  </div>
  <DataTable />
</Card>
```

✅ **Правильно:**
```tsx
// Поиск и фильтры в отдельном Card
<Card className="p-6">
  <div className="flex items-center justify-between mb-6">
    {/* заголовок и кнопка */}
  </div>
  <div className="flex gap-4">
    {/* поиск и фильтры */}
  </div>
</Card>

<Card>
  <DataTable />
</Card>
```

---

❌ **Неправильно:**
```tsx
// Заголовок не в Card
<div>
  <h1>Заголовок</h1>
</div>
<Card>
  <div className="flex gap-4">
    {/* поиск и фильтры */}
  </div>
</Card>
```

✅ **Правильно:**
```tsx
// Всё в одном верхнем Card
<Card className="p-6">
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1>Заголовок</h1>
      <p>Описание</p>
    </div>
    <Button>Создать</Button>
  </div>
  <div className="flex gap-4">
    {/* поиск и фильтры */}
  </div>
</Card>
```

---

## Исключения

В некоторых случаях структура может отличаться:

1. **Страница без кнопки создать**: используйте ту же структуру, просто не добавляйте кнопку
2. **Страница без фильтров**: поиск может занимать всю ширину с `flex-1`
3. **Страница с дополнительными действиями**: кнопки можно группировать справа с `gap-2`

```tsx
<div className="flex items-center gap-2">
  <Button variant="outline">
    <Download className="mr-2 h-4 w-4" />
    Экспорт
  </Button>
  <Button onClick={() => setIsCreateDialogOpen(true)}>
    <Plus className="mr-2 h-4 w-4" />
    Создать
  </Button>
</div>
```

## Обновления

- **2025-01-03**: Создан документ с базовой структурой
- **2025-01-03**: Добавлены примеры и чек-лист
