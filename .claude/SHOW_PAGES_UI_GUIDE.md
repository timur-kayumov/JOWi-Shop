# Show Pages UI Guide

Этот гайд определяет унифицированную структуру и стандарты для всех страниц детального просмотра (show pages) в JOWi Shop.

## Общие принципы

1. **Консистентность**: Все show pages должны следовать единому паттерну
2. **Минимализм**: Убирать избыточную информацию, дублирующуюся в разных местах
3. **Очевидность действий**: Кнопки действий всегда в одном месте
4. **Иерархия**: Основная информация слева, статистика и детали справа

---

## Структура страницы

### 1. Header (Хедер с действиями)

**Обязательные элементы:**
```tsx
<div className="flex items-center justify-between mb-6">
  {/* Left: Back button */}
  <Button variant="ghost" onClick={() => router.push('/back-url')}>
    <ArrowLeft className="mr-2 h-4 w-4" />
    {t('actions.backToList')}
  </Button>

  {/* Right: Action buttons */}
  <div className="flex items-center gap-2">
    {/* Edit button - prominent */}
    <Button onClick={handleEdit}>
      <Pencil className="mr-2 h-4 w-4" />
      {t('actions.edit')}
    </Button>

    {/* Delete button - ghost with destructive color */}
    <Button
      variant="ghost"
      onClick={handleDelete}
      className="text-destructive hover:bg-destructive/10"
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {t('actions.delete')}
    </Button>
  </div>
</div>
```

**Правила:**
- Кнопка "Назад" всегда слева с иконкой `ArrowLeft`
- Кнопки действий всегда справа
- Кнопка "Изменить" - default variant (синяя)
- Кнопка "Удалить" - ghost variant с красным текстом (`text-destructive hover:bg-destructive/10`)
- Отступ снизу `mb-6`

---

### 2. Content Layout (Основной контент)

**Два варианта layout:**

#### A. 3-Column Grid (для сложных сущностей)
```tsx
<div className="grid gap-6 md:grid-cols-3">
  {/* Left column (1/3) - Entity info card */}
  <div className="md:col-span-1">
    <Card className="p-6">
      {/* Avatar/Icon */}
      {/* Name and status */}
      {/* Contact details */}
      {/* Metadata (created date, etc) */}
    </Card>
  </div>

  {/* Right columns (2/3) - Stats and additional sections */}
  <div className="md:col-span-2 space-y-6">
    {/* Stats cards grid */}
    {/* Additional sections (optional) */}
  </div>
</div>
```

**Когда использовать:**
- Магазины, клиенты, сотрудники
- Когда есть много контактной информации
- Когда нужно показать аватар/иконку сущности

#### B. Full-Width Cards (для простых сущностей)
```tsx
<div className="space-y-6">
  <Card>
    {/* Entity details */}
  </Card>

  <Card>
    {/* Additional information */}
  </Card>
</div>
```

**Когда использовать:**
- Товары, категории, документы
- Когда информации меньше
- Когда не нужна жесткая структура с аватаром

---

### 3. Stats Cards (Карточки статистики)

**Стандартная структура:**
```tsx
<div className="grid gap-4 md:grid-cols-2">
  <Card className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
        <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
      </div>
    </div>
  </Card>
</div>
```

**Правила:**
- Grid 2 колонки на md+ экранах
- Padding `p-6`
- Текст: маленький серый label + крупное жирное значение
- Иконка справа в цветном круге
- Цвета фона иконок: `blue-100`, `purple-100`, `green-100`, `orange-100`, etc.

---

### 4. Entity Info Card (Карточка информации о сущности)

**Стандартная структура (левая колонка):**
```tsx
<Card className="p-6 space-y-6">
  {/* Avatar/Icon section */}
  <div className="flex flex-col items-center">
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
      <Icon className="h-10 w-10 text-muted-foreground" />
    </div>
    <h2 className="text-2xl font-bold text-center">{name}</h2>
    <Badge variant={isActive ? 'success' : 'outline'} className="mt-2">
      {status}
    </Badge>
  </div>

  {/* Contact details section */}
  <div className="space-y-4 border-t pt-4">
    <div className="flex items-start gap-3 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div>
        <div className="font-medium">{primaryText}</div>
        <div className="text-muted-foreground">{secondaryText}</div>
      </div>
    </div>
  </div>

  {/* Metadata section */}
  <div className="border-t pt-4 space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  </div>
</Card>
```

**Правила:**
- Аватар/иконка всегда сверху, центрированы
- Название и статус под аватаром
- Контактные детали отделены border-top
- Метаданные (дата создания и т.д.) в самом низу
- Иконки размером `h-4 w-4` с `text-muted-foreground`

---

## Диалоги и модальные окна

### Edit Dialog (Диалог редактирования)

```tsx
<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
  <DialogContent className="sm:max-w-[600px]">
    <DialogHeader>
      <DialogTitle>{t('pages.entity.edit')}</DialogTitle>
      <DialogDescription>{t('pages.entity.editDescription')}</DialogDescription>
    </DialogHeader>

    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Form fields */}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit">{t('actions.save')}</Button>
        </DialogFooter>
      </form>
    </Form>
  </DialogContent>
</Dialog>
```

**Правила:**
- Максимальная ширина `sm:max-w-[600px]`
- Всегда используем DialogHeader с Title и Description
- Form с spacing `space-y-4`
- DialogFooter с кнопками Cancel (outline) и Save (default)

### Delete Confirmation Dialog

```tsx
<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{t('confirmations.deleteEntity.title')}</AlertDialogTitle>
      <AlertDialogDescription>
        {t('confirmations.deleteEntity.description')}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{t('confirmations.deleteEntity.cancel')}</AlertDialogCancel>
      <AlertDialogAction
        onClick={confirmDelete}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {t('confirmations.deleteEntity.confirm')}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Правила:**
- Используем `AlertDialog`, а не `Dialog` для подтверждений
- Кнопка подтверждения всегда с destructive стилем
- Текст предупреждения должен быть четким

---

## Переводы

### Обязательные ключи для каждой сущности:

```json
{
  "actions": {
    "edit": "Изменить",
    "delete": "Удалить",
    "backToList": "Назад к списку"
  },
  "confirmations": {
    "deleteEntity": {
      "title": "Удалить [сущность]?",
      "description": "Вы уверены? Это действие необратимо.",
      "confirm": "Удалить",
      "cancel": "Отмена"
    }
  },
  "pages": {
    "entityDetail": {
      "backToList": "Назад к списку", // Deprecated, use actions.backToList
      "notFound": "[Сущность] не найдена"
    },
    "entity": {
      "edit": "Редактировать [сущность]",
      "editDescription": "Внесите изменения"
    }
  }
}
```

---

## Стейт менеджмент

### Обязательные state переменные:

```tsx
const [editDialogOpen, setEditDialogOpen] = useState(false);
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

// Form для редактирования
const form = useForm<EntitySchema>({
  resolver: zodResolver(entitySchema),
  defaultValues: entity ? {
    // Map entity to form fields
  } : {},
});
```

### Обязательные обработчики:

```tsx
const handleEdit = () => {
  setEditDialogOpen(true);
};

const handleDelete = () => {
  setDeleteDialogOpen(true);
};

const onSubmit = (data: EntitySchema) => {
  // TODO: Implement actual update
  console.log('Updating entity:', data);
  setEditDialogOpen(false);
};

const confirmDelete = () => {
  // TODO: Implement actual deletion
  console.log('Deleting entity:', id);
  setDeleteDialogOpen(false);
  router.push('/entities');
};
```

---

## Чего НЕ делать

❌ **Не дублировать информацию**
- Если информация уже показана в левой карточке, не показывать её в блоке "Дополнительная информация"

❌ **Не создавать блоки "Быстрые действия" с нефункциональными кнопками**
- Либо кнопки должны быть рабочими, либо их не должно быть

❌ **Не использовать иконки без текста в главных действиях**
- Кнопка "Изменить" должна иметь текст, а не только иконку карандаша

❌ **Не использовать слишком заметные кнопки удаления**
- Кнопка удаления должна быть ghost variant, а не destructive variant

❌ **Не размещать кнопки действий в разных местах на разных страницах**
- Всегда используйте единую структуру хедера

---

## Примеры реализации

### Магазины (Stores)
- ✅ Используется 3-column grid
- ✅ Левая карточка с иконкой магазина, названием, статусом, адресом, телефоном
- ✅ Правая часть со статистикой (сотрудники, кассы, продажи)
- ✅ Удалены блоки "Дополнительная информация" и "Быстрые действия"

### Клиенты (Customers)
- ✅ Используется 3-column grid
- ✅ Левая карточка с аватаром, именем, картой лояльности
- ✅ Правая часть со статистикой и историей покупок

### Сотрудники (Employees)
- ⚠️ Использует другой layout (не 3-column grid)
- ✅ Имеет кнопку Save вместо Edit (inline editing)
- 📝 Рекомендация: переделать на единый паттерн с модальным редактированием

---

## Контрольный чеклист для новых show pages

- [ ] Есть хедер с кнопкой "Назад к списку" слева
- [ ] Есть кнопки "Изменить" и "Удалить" справа в хедере
- [ ] Кнопка удаления - ghost variant с красным текстом
- [ ] Используется правильный layout (3-column или full-width)
- [ ] Нет дублирования информации
- [ ] Все кнопки действий функциональны
- [ ] Есть диалог редактирования с формой
- [ ] Есть диалог подтверждения удаления
- [ ] Добавлены все необходимые переводы (RU и UZ)
- [ ] Соблюдены правила стилизации (padding, spacing, colors)

---

## Будущие улучшения

- [ ] Создать общий компонент `ShowPageLayout` для переиспользования
- [ ] Создать хук `useShowPage` для общей логики (edit, delete)
- [ ] Добавить поддержку tabs для сложных сущностей
- [ ] Добавить breadcrumbs для навигации
- [ ] Добавить экшн "Дублировать" для некоторых сущностей
