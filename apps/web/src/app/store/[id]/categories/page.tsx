'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import {
  Button,
  Input,
  Badge,
  DataTable,
  Column,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@jowi/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CategoryBadge } from '@/components/category-badge';
import { IconPickerPopover } from '@/components/icon-picker-popover';
import { ColorPickerPopover } from '@/components/color-picker-popover';
import { toast } from '@/lib/toast';

// Mock data
const mockCategories = [
  // Системные категории (created earlier)
  {
    id: '1',
    name: 'Напитки',
    icon: 'Coffee',
    color: '#3B82F6',
    isSystem: true,
    parentId: null,
    sortOrder: 1,
    productCount: 25,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Молочные продукты',
    icon: 'Milk',
    color: '#06B6D4',
    isSystem: true,
    parentId: null,
    sortOrder: 2,
    productCount: 18,
    createdAt: '2024-01-15T10:05:00Z',
  },
  {
    id: '3',
    name: 'Мясо и рыба',
    icon: 'Beef',
    color: '#EF4444',
    isSystem: true,
    parentId: null,
    sortOrder: 3,
    productCount: 12,
    createdAt: '2024-01-15T10:10:00Z',
  },
  {
    id: '4',
    name: 'Хлеб и выпечка',
    icon: 'Cookie',
    color: '#F97316',
    isSystem: true,
    parentId: null,
    sortOrder: 4,
    productCount: 15,
    createdAt: '2024-01-15T10:15:00Z',
  },
  {
    id: '5',
    name: 'Фрукты и овощи',
    icon: 'Apple',
    color: '#10B981',
    isSystem: true,
    parentId: null,
    sortOrder: 5,
    productCount: 30,
    createdAt: '2024-01-15T10:20:00Z',
  },
  {
    id: '8',
    name: 'Алкоголь',
    icon: 'Wine',
    color: '#92400E',
    isSystem: true,
    parentId: null,
    sortOrder: 8,
    productCount: 10,
    createdAt: '2024-01-15T10:25:00Z',
  },
  {
    id: '9',
    name: 'Пиво',
    icon: 'Beer',
    color: '#F59E0B',
    isSystem: true,
    parentId: null,
    sortOrder: 9,
    productCount: 7,
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '10',
    name: 'Рыба',
    icon: 'Fish',
    color: '#06B6D4',
    isSystem: true,
    parentId: null,
    sortOrder: 10,
    productCount: 9,
    createdAt: '2024-01-15T10:35:00Z',
  },
  {
    id: '11',
    name: 'Супы',
    icon: 'Soup',
    color: '#EF4444',
    isSystem: true,
    parentId: null,
    sortOrder: 11,
    productCount: 5,
    createdAt: '2024-01-15T10:40:00Z',
  },
  {
    id: '12',
    name: 'Яйца',
    icon: 'Egg',
    color: '#F59E0B',
    isSystem: true,
    parentId: null,
    sortOrder: 12,
    productCount: 4,
    createdAt: '2024-01-15T10:45:00Z',
  },
  {
    id: '13',
    name: 'Виноград',
    icon: 'Grape',
    color: '#A855F7',
    isSystem: true,
    parentId: null,
    sortOrder: 13,
    productCount: 3,
    createdAt: '2024-01-15T10:50:00Z',
  },
  {
    id: '14',
    name: 'Салаты',
    icon: 'Salad',
    color: '#10B981',
    isSystem: true,
    parentId: null,
    sortOrder: 14,
    productCount: 8,
    createdAt: '2024-01-15T10:55:00Z',
  },
  {
    id: '15',
    name: 'Пицца',
    icon: 'Pizza',
    color: '#F97316',
    isSystem: true,
    parentId: null,
    sortOrder: 15,
    productCount: 6,
    createdAt: '2024-01-15T11:00:00Z',
  },
  // Пользовательские категории (created more recently)
  {
    id: '6',
    name: 'Крупы',
    icon: 'Wheat',
    color: '#F59E0B',
    isSystem: false,
    parentId: null,
    sortOrder: 6,
    productCount: 8,
    createdAt: '2024-10-01T14:00:00Z',
  },
  {
    id: '7',
    name: 'Сладости',
    icon: 'Candy',
    color: '#EC4899',
    isSystem: false,
    parentId: null,
    sortOrder: 7,
    productCount: 20,
    createdAt: '2024-10-05T15:30:00Z',
  },
  {
    id: '16',
    name: 'Кондитерские изделия',
    icon: 'Cake',
    color: '#EC4899',
    isSystem: false,
    parentId: null,
    sortOrder: 16,
    productCount: 14,
    createdAt: '2024-10-10T09:00:00Z',
  },
  {
    id: '17',
    name: 'Печенье и вафли',
    icon: 'Cookie',
    color: '#F97316',
    isSystem: false,
    parentId: null,
    sortOrder: 17,
    productCount: 11,
    createdAt: '2024-10-12T10:15:00Z',
  },
  {
    id: '18',
    name: 'Мороженое',
    icon: 'IceCream',
    color: '#06B6D4',
    isSystem: false,
    parentId: null,
    sortOrder: 18,
    productCount: 9,
    createdAt: '2024-10-15T11:30:00Z',
  },
  {
    id: '19',
    name: 'Торты и пирожные',
    icon: 'CakeSlice',
    color: '#EC4899',
    isSystem: false,
    parentId: null,
    sortOrder: 19,
    productCount: 7,
    createdAt: '2024-10-18T13:45:00Z',
  },
  {
    id: '20',
    name: 'Бытовая химия',
    icon: 'Sparkles',
    color: '#6366F1',
    isSystem: false,
    parentId: null,
    sortOrder: 20,
    productCount: 22,
    createdAt: '2024-10-20T14:00:00Z',
  },
  {
    id: '21',
    name: 'Товары для дома',
    icon: 'ShoppingBag',
    color: '#6B7280',
    isSystem: false,
    parentId: null,
    sortOrder: 21,
    productCount: 16,
    createdAt: '2024-10-22T15:20:00Z',
  },
  {
    id: '22',
    name: 'Замороженные продукты',
    icon: 'Fish',
    color: '#06B6D4',
    isSystem: false,
    parentId: null,
    sortOrder: 22,
    productCount: 13,
    createdAt: '2024-10-25T16:00:00Z',
  },
  {
    id: '23',
    name: 'Специи и приправы',
    icon: 'Soup',
    color: '#EF4444',
    isSystem: false,
    parentId: null,
    sortOrder: 23,
    productCount: 18,
    createdAt: '2024-10-27T09:30:00Z',
  },
  {
    id: '24',
    name: 'Консервы',
    icon: 'Beef',
    color: '#92400E',
    isSystem: false,
    parentId: null,
    sortOrder: 24,
    productCount: 12,
    createdAt: '2024-10-29T10:45:00Z',
  },
  {
    id: '25',
    name: 'Снеки',
    icon: 'Candy',
    color: '#F59E0B',
    isSystem: false,
    parentId: null,
    sortOrder: 25,
    productCount: 19,
    createdAt: '2024-11-01T11:00:00Z',
  },
  {
    id: '26',
    name: 'Здоровое питание',
    icon: 'Apple',
    color: '#10B981',
    isSystem: false,
    parentId: null,
    sortOrder: 26,
    productCount: 10,
    createdAt: '2024-11-02T12:15:00Z',
  },
  {
    id: '27',
    name: 'Детское питание',
    icon: 'Milk',
    color: '#EC4899',
    isSystem: false,
    parentId: null,
    sortOrder: 27,
    productCount: 8,
    createdAt: '2024-11-02T13:30:00Z',
  },
];

type Category = (typeof mockCategories)[0];

const categorySchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CategoryFormData) => void;
  title: string;
  description: string;
  form: ReturnType<typeof useForm<CategoryFormData>>;
  categories: Category[];
  excludeCategoryId?: string;
  translations: {
    name: string;
    parentCategory: string;
    icon: string;
    color: string;
    cancel: string;
    save: string;
  };
}

const CategoryDialog = React.memo(({
  open,
  onOpenChange,
  onSubmit,
  title,
  description,
  form,
  categories,
  excludeCategoryId,
  translations,
}: CategoryDialogProps) => {
  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.name}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Введите название категории" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.parentCategory}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите родительскую категорию" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Без родительской</SelectItem>
                      {categories
                        .filter((cat) => cat.id !== excludeCategoryId)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.icon}</FormLabel>
                  <FormControl>
                    <IconPickerPopover
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.color}</FormLabel>
                  <FormControl>
                    <ColorPickerPopover
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Предпросмотр:</p>
              <CategoryBadge
                name={form.watch('name') || 'Категория'}
                icon={form.watch('icon')}
                color={form.watch('color')}
                size="lg"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
              >
                {translations.cancel}
              </Button>
              <Button type="submit">{translations.save}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});

CategoryDialog.displayName = 'CategoryDialog';

export default function CategoriesPage() {
  const { t } = useTranslation('common');
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<Category[]>(mockCategories);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  const createForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      icon: 'ShoppingBag',
      color: '#6B7280',
      parentId: undefined,
    },
  });

  const editForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      icon: 'ShoppingBag',
      color: '#6B7280',
      parentId: undefined,
    },
  });

  const translations = useMemo(
    () => ({
      name: t('fields.name'),
      parentCategory: t('fields.parentCategory'),
      icon: t('fields.icon'),
      color: t('fields.color'),
      cancel: t('actions.cancel'),
      save: t('actions.save'),
    }),
    [t]
  );

  const filteredData = data
    .filter((category) => {
      const matchesSearch = category.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesType =
        typeFilter === 'all' ||
        (typeFilter === 'system' && category.isSystem) ||
        (typeFilter === 'user' && !category.isSystem);
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      // 1. Пользовательские категории выше системных
      if (a.isSystem !== b.isSystem) {
        return a.isSystem ? 1 : -1;
      }
      // 2. Внутри каждой группы: новые выше (сортировка по дате создания)
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // descending order (newest first)
    });

  const handleCreate = (formData: CategoryFormData) => {
    const newCategory: Category = {
      id: String(data.length + 1),
      name: formData.name,
      icon: formData.icon,
      color: formData.color || '#6B7280',
      isSystem: false,
      parentId: formData.parentId || null,
      sortOrder: data.length + 1,
      productCount: 0,
      createdAt: new Date().toISOString(),
    };
    setData([...data, newCategory]);
    toast.success('Категория создана', `${formData.name} добавлена в систему`);
    setIsCreateDialogOpen(false);
    createForm.reset();
  };

  const handleEdit = (formData: CategoryFormData) => {
    if (!selectedCategory) return;

    setData(
      data.map((cat) =>
        cat.id === selectedCategory.id
          ? {
              ...cat,
              name: formData.name,
              icon: formData.icon,
              color: formData.color || '#6B7280',
              parentId: formData.parentId || null,
            }
          : cat
      )
    );
    toast.success('Категория обновлена', 'Изменения успешно сохранены');
    setIsEditDialogOpen(false);
    setSelectedCategory(null);
    editForm.reset();
  };

  const handleDelete = (category: Category) => {
    if (
      window.confirm(
        `Вы уверены, что хотите удалить категорию "${category.name}"?`
      )
    ) {
      setData(data.filter((cat) => cat.id !== category.id));
      toast.success('Категория удалена', 'Данные успешно удалены из системы');
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    editForm.reset({
      name: category.name,
      icon: category.icon,
      color: category.color,
      parentId: category.parentId || undefined,
    });
    setIsEditDialogOpen(true);
  };

  const columns: Column<Category>[] = [
    {
      key: 'name',
      label: t('fields.name'),
      sortable: true,
      render: (category) => (
        <CategoryBadge
          name={category.name}
          icon={category.icon}
          color={category.color}
        />
      ),
    },
    {
      key: 'productCount',
      label: t('pages.categories.productCount'),
      sortable: true,
      render: (category) => (
        <span className="text-muted-foreground">{category.productCount}</span>
      ),
    },
    {
      key: 'isSystem',
      label: t('pages.categories.type'),
      render: (category) => (
        <Badge variant={category.isSystem ? 'secondary' : 'default'}>
          {category.isSystem
            ? t('pages.categories.systemCategory')
            : t('pages.categories.userCategory')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: t('fields.actions'),
      render: (category) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditDialog(category)}
            disabled={category.isSystem}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(category)}
            disabled={category.isSystem}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('storeNavigation.categories')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('pages.categories.description')}
          </p>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('actions.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('pages.categories.allCategories')}</SelectItem>
              <SelectItem value="system">{t('pages.categories.systemCategories')}</SelectItem>
              <SelectItem value="user">{t('pages.categories.userCategories')}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('pages.categories.createCategory')}
          </Button>
        </div>
      </Card>

      <Card>
        <DataTable
          data={filteredData}
          columns={columns}
          onRowClick={(category) =>
            router.push(`/store/${params.id}/categories/${category.id}`)
          }
          emptyMessage={t('pages.categories.noCategories')}
          pagination={{ enabled: true, pageSize: 15 }}
        />
      </Card>

      <CategoryDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreate}
        title={t('pages.categories.createCategory')}
        description={t('pages.categories.createCategoryDescription')}
        form={createForm}
        categories={data}
        excludeCategoryId={undefined}
        translations={translations}
      />

      <CategoryDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleEdit}
        title={t('pages.categories.editCategory')}
        description={t('pages.categories.editCategoryDescription')}
        form={editForm}
        categories={data}
        excludeCategoryId={selectedCategory?.id}
        translations={translations}
      />
    </div>
  );
}
