'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Package, User } from 'lucide-react';
import {
  Button,
  Card,
  Badge,
  StatusBadge,
  formatDate,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
  type Column,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@jowi/ui';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ==================== TYPES ====================

interface Warehouse {
  id: string;
  name: string;
  managerName: string | null;
  managerId: string | null;
  productsCount: number;
  totalValue: number;
  isActive: boolean;
  createdAt: Date;
}

interface StockItem {
  id: string;
  productName: string;
  variantName: string;
  categoryName: string | null;
  quantity: number;
  unit: string;
  totalValue: number;
}

type StockStatusFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

// ==================== VALIDATION SCHEMA ====================

const editWarehouseSchema = z.object({
  name: z.string().min(2, 'Name is required').max(200),
  managerId: z.string().nullable(),
});

type EditWarehouseInput = z.infer<typeof editWarehouseSchema>;

// ==================== MOCK DATA ====================

const mockWarehouse: Warehouse = {
  id: '1',
  name: 'Основной склад',
  managerName: 'Алишер Каримов',
  managerId: '1',
  productsCount: 245,
  totalValue: 125750000,
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00'),
};

const mockStockItems: StockItem[] = [
  {
    id: '1',
    productName: 'Coca-Cola',
    variantName: '0.5л',
    categoryName: 'Напитки',
    quantity: 120,
    unit: 'шт',
    totalValue: 6000000,
  },
  {
    id: '2',
    productName: 'Pepsi',
    variantName: '0.5л',
    categoryName: 'Напитки',
    quantity: 85,
    unit: 'шт',
    totalValue: 4250000,
  },
  {
    id: '3',
    productName: 'Фанта',
    variantName: '0.5л',
    categoryName: 'Напитки',
    quantity: 95,
    unit: 'шт',
    totalValue: 4750000,
  },
  {
    id: '4',
    productName: 'Молоко',
    variantName: '1л',
    categoryName: 'Молочные',
    quantity: 45,
    unit: 'л',
    totalValue: 2250000,
  },
  {
    id: '5',
    productName: 'Кефир',
    variantName: '1л',
    categoryName: 'Молочные',
    quantity: 30,
    unit: 'л',
    totalValue: 1500000,
  },
  {
    id: '6',
    productName: 'Хлеб',
    variantName: 'Белый 500г',
    categoryName: 'Хлеб',
    quantity: 150,
    unit: 'шт',
    totalValue: 3000000,
  },
  {
    id: '7',
    productName: 'Рис',
    variantName: '1кг',
    categoryName: 'Крупы',
    quantity: 200,
    unit: 'кг',
    totalValue: 10000000,
  },
  {
    id: '8',
    productName: 'Гречка',
    variantName: '1кг',
    categoryName: 'Крупы',
    quantity: 180,
    unit: 'кг',
    totalValue: 9000000,
  },
  {
    id: '9',
    productName: 'Масло подсолнечное',
    variantName: '1л',
    categoryName: 'Масла',
    quantity: 75,
    unit: 'л',
    totalValue: 7500000,
  },
  {
    id: '10',
    productName: 'Сахар',
    variantName: '1кг',
    categoryName: 'Сыпучие',
    quantity: 250,
    unit: 'кг',
    totalValue: 12500000,
  },
  {
    id: '11',
    productName: 'Соль',
    variantName: '1кг',
    categoryName: 'Сыпучие',
    quantity: 300,
    unit: 'кг',
    totalValue: 3000000,
  },
  {
    id: '12',
    productName: 'Чай черный',
    variantName: '100г',
    categoryName: 'Чай и кофе',
    quantity: 60,
    unit: 'шт',
    totalValue: 6000000,
  },
  {
    id: '13',
    productName: 'Кофе растворимый',
    variantName: '200г',
    categoryName: 'Чай и кофе',
    quantity: 40,
    unit: 'шт',
    totalValue: 8000000,
  },
  {
    id: '14',
    productName: 'Макароны',
    variantName: '500г',
    categoryName: 'Крупы',
    quantity: 220,
    unit: 'шт',
    totalValue: 11000000,
  },
  {
    id: '15',
    productName: 'Томатная паста',
    variantName: '400г',
    categoryName: 'Консервы',
    quantity: 90,
    unit: 'шт',
    totalValue: 9000000,
  },
];

const mockCategories = ['Напитки', 'Молочные', 'Хлеб', 'Крупы', 'Масла', 'Сыпучие', 'Чай и кофе', 'Консервы'];

const mockManagers = [
  { id: '1', name: 'Алишер Каримов' },
  { id: '2', name: 'Нигора Усманова' },
  { id: '3', name: 'Шохрух Рахимов' },
];

// ==================== MAIN COMPONENT ====================

export default function WarehouseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatusFilter>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  const warehouse = mockWarehouse;
  const warehouseId = params.warehouseId as string;
  const storeId = params.id as string;

  const editForm = useForm<EditWarehouseInput>({
    resolver: zodResolver(editWarehouseSchema),
    defaultValues: {
      name: warehouse.name,
      managerId: warehouse.managerId,
    },
  });

  // ==================== EVENT HANDLERS ====================

  const handleEdit = () => {
    editForm.reset({
      name: warehouse.name,
      managerId: warehouse.managerId,
    });
    setShowEditDialog(true);
  };

  const handleEditSubmit = (data: EditWarehouseInput) => {
    // TODO: Replace with actual API call
    console.log('Edit warehouse:', data);
    toast.success(t('warehouses.updateSuccess'));
    setShowEditDialog(false);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    toast.success(t('warehouses.deleteSuccess'));
    router.push(`/store/${storeId}/warehouses/warehouses-list`);
    setShowDeleteDialog(false);
  };

  const handleBack = () => {
    router.push(`/store/${storeId}/warehouses/warehouses-list`);
  };

  // ==================== FILTERED DATA ====================

  const filteredStock = useMemo(() => {
    return mockStockItems.filter((item) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.variantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.categoryName && item.categoryName.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category filter
      const matchesCategory =
        categoryFilter === 'all' || item.categoryName === categoryFilter;

      // Stock status filter
      let matchesStockStatus = true;
      if (stockStatusFilter === 'in_stock') {
        matchesStockStatus = item.quantity > 50;
      } else if (stockStatusFilter === 'low_stock') {
        matchesStockStatus = item.quantity > 0 && item.quantity <= 50;
      } else if (stockStatusFilter === 'out_of_stock') {
        matchesStockStatus = item.quantity === 0;
      }

      return matchesSearch && matchesCategory && matchesStockStatus;
    });
  }, [searchQuery, categoryFilter, stockStatusFilter]);

  // ==================== TABLE COLUMNS ====================

  const stockColumns: Column<StockItem>[] = [
    {
      key: 'id',
      label: '№',
      render: (item) => mockStockItems.indexOf(item) + 1,
    },
    {
      key: 'product',
      label: t('warehouses.detail.product'),
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="font-medium">{item.productName}</div>
            <div className="text-sm text-muted-foreground">{item.variantName}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'categoryName',
      label: t('warehouses.detail.category'),
      sortable: true,
      render: (item) => (
        <Badge variant="secondary">
          {item.categoryName || t('pages.products.categories.uncategorized')}
        </Badge>
      ),
    },
    {
      key: 'quantity',
      label: t('warehouses.detail.quantity'),
      sortable: true,
      render: (item) => (
        <span className={cn(
          'font-medium',
          item.quantity === 0 && 'text-red-600',
          item.quantity > 0 && item.quantity <= 50 && 'text-yellow-600',
          item.quantity > 50 && 'text-green-600'
        )}>
          {item.quantity} {item.unit}
        </span>
      ),
    },
    {
      key: 'totalValue',
      label: t('warehouses.detail.totalCost'),
      sortable: true,
      render: (item) => (
        <span className="font-medium">
          {item.totalValue.toLocaleString()} {t('currency')}
        </span>
      ),
    },
  ];

  // ==================== RENDER ====================

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with back button only */}
      <div className="flex items-center">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('warehouses.detail.backToList')}
        </Button>
      </div>

      {/* Two-column layout: 1/3 left (info), 2/3 right (stock table) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Warehouse Info */}
        <div className="space-y-6">
          {/* Warehouse Details Card */}
          <Card className="p-6">
            <div className="space-y-4">
              {/* Warehouse Name as first field (larger text) */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('warehouses.name')}</p>
                <h2 className="text-2xl font-bold">{warehouse.name}</h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('warehouses.manager')}</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {warehouse.managerName || t('warehouses.noManager')}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('status.label')}</p>
                  <Badge variant={warehouse.isActive ? 'success' : 'destructive'}>
                    {warehouse.isActive ? t('status.active') : t('status.inactive')}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('warehouses.productsCount')}</p>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xl font-semibold">{warehouse.productsCount}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('warehouses.totalValue')}</p>
                  <p className="text-2xl font-bold text-green-600">
                    {warehouse.totalValue.toLocaleString()} {t('currency')}
                  </p>
                </div>
              </div>

              {/* Action buttons inside card */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="h-10 w-10 bg-muted hover:bg-muted/80"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEdit}
                  className="h-10 w-10 bg-muted hover:bg-muted/80"
                >
                  <Pencil className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column: Stock table with search and filters (spans 2 columns) */}
        <div className="lg:col-span-2">
          <Card className="p-6 pb-0">
            {/* Search and Filters */}
            <div className="flex items-center gap-4 pb-6">
              {/* Search */}
              <div className="flex-1">
                <Input
                  placeholder={t('warehouses.detail.searchProducts')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t('warehouses.detail.allCategories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('warehouses.detail.allCategories')}</SelectItem>
                  {mockCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Stock Status Filter */}
              <Select value={stockStatusFilter} onValueChange={(value) => setStockStatusFilter(value as StockStatusFilter)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t('warehouses.detail.allStock')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('warehouses.detail.allStock')}</SelectItem>
                  <SelectItem value="in_stock">{t('warehouses.detail.inStock')}</SelectItem>
                  <SelectItem value="low_stock">{t('warehouses.detail.lowStock')}</SelectItem>
                  <SelectItem value="out_of_stock">{t('warehouses.detail.outOfStock')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="mt-6">
            <DataTable
              columns={stockColumns}
              data={filteredStock}
              emptyMessage={t('warehouses.detail.noProducts')}
              pagination={{ enabled: true, pageSize: 15 }}
            />
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('warehouses.detail.editWarehouse')}</DialogTitle>
            <DialogDescription>
              {t('warehouses.editWarehouseDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('warehouses.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('warehouses.namePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('warehouses.manager')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('warehouses.managerPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">{t('warehouses.noManager')}</SelectItem>
                        {mockManagers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  {t('actions.cancel')}
                </Button>
                <Button type="submit">{t('actions.save')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('warehouses.detail.deleteWarehouse')}</DialogTitle>
            <DialogDescription>
              {t('warehouses.detail.deleteWarehouseConfirm', { name: warehouse.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t('actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t('actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
