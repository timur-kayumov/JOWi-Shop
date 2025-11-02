'use client';

import { useState } from 'react';
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
import { IconPicker } from '@/components/icon-picker';
import { ColorPicker } from '@/components/color-picker';

// Mock data
const mockCategories = [
  {
    id: '1',
    name: 'Напитки',
    icon: 'Coffee',
    color: '#3B82F6',
    isSystem: true,
    parentId: null,
    sortOrder: 1,
    productCount: 25,
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
  },
  {
    id: '6',
    name: 'Крупы',
    icon: 'Wheat',
    color: '#F59E0B',
    isSystem: false,
    parentId: null,
    sortOrder: 6,
    productCount: 8,
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
  },
];

type Category = (typeof mockCategories)[0];

const categorySchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
});

type CategoryFormData = z.infer<typeof categorySchema>;

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

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      icon: 'ShoppingBag',
      color: '#6B7280',
      parentId: undefined,
      sortOrder: 0,
    },
  });

  const filteredData = data.filter((category) => {
    const matchesSearch = category.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'system' && category.isSystem) ||
      (typeFilter === 'user' && !category.isSystem);
    return matchesSearch && matchesType;
  });

  const handleCreate = (formData: CategoryFormData) => {
    const newCategory: Category = {
      id: String(data.length + 1),
      name: formData.name,
      icon: formData.icon,
      color: formData.color || '#6B7280',
      isSystem: false,
      parentId: formData.parentId || null,
      sortOrder: formData.sortOrder,
      productCount: 0,
    };
    setData([...data, newCategory]);
    setIsCreateDialogOpen(false);
    form.reset();
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
              sortOrder: formData.sortOrder,
            }
          : cat
      )
    );
    setIsEditDialogOpen(false);
    setSelectedCategory(null);
    form.reset();
  };

  const handleDelete = (category: Category) => {
    if (
      window.confirm(
        `Вы уверены, что хотите удалить категорию "${category.name}"?`
      )
    ) {
      setData(data.filter((cat) => cat.id !== category.id));
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    form.reset({
      name: category.name,
      icon: category.icon,
      color: category.color,
      parentId: category.parentId || undefined,
      sortOrder: category.sortOrder,
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
      key: 'parentId',
      label: t('fields.parentCategory'),
      render: (category) => {
        if (!category.parentId) return <span className="text-muted-foreground">-</span>;
        const parent = data.find((c) => c.id === category.parentId);
        return parent ? (
          <CategoryBadge
            name={parent.name}
            icon={parent.icon}
            color={parent.color}
            size="sm"
          />
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
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

  const CategoryDialog = ({
    open,
    onOpenChange,
    onSubmit,
    title,
    description,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CategoryFormData) => void;
    title: string;
    description: string;
  }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.icon')}</FormLabel>
                  <FormControl>
                    <IconPicker
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
                  <FormLabel>{t('fields.color')}</FormLabel>
                  <FormControl>
                    <ColorPicker
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.name')}</FormLabel>
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
                  <FormLabel>{t('fields.parentCategory')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите родительскую категорию" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Без родительской</SelectItem>
                      {data
                        .filter((cat) => cat.id !== selectedCategory?.id)
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
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.sortOrder')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="0"
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
                onClick={() => onOpenChange(false)}
              >
                {t('actions.cancel')}
              </Button>
              <Button type="submit">{t('actions.save')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('storeNavigation.categories')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('pages.categories.description')}
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('pages.categories.createCategory')}
          </Button>
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
        />
      </Card>

      <CategoryDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreate}
        title={t('pages.categories.createCategory')}
        description={t('pages.categories.createCategoryDescription')}
      />

      <CategoryDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleEdit}
        title={t('pages.categories.editCategory')}
        description={t('pages.categories.editCategoryDescription')}
      />
    </div>
  );
}
