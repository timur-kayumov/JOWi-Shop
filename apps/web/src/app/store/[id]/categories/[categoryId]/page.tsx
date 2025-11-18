'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Plus,
  Package,
  TrendingUp,
  DollarSign,
  Pencil,
  Trash2,
  Search,
  Hash,
  Layers,
} from 'lucide-react';
import {
  Button,
  Card,
  DataTable,
  Column,
  Badge,
  Input,
  Checkbox,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@jowi/ui';
import { CategoryBadge } from '@/components/category-badge';
import { EditCategoryDialog } from '@/components/edit-category-dialog';
import { DeleteCategoryDialog } from '@/components/delete-category-dialog';
import { AddProductsDialog } from '@/components/add-products-dialog';
import { toast } from '@/lib/toast';

// Mock categories (should match main categories page)
const mockCategories = [
  {
    id: '1',
    name: 'Напитки',
    icon: 'Coffee',
    color: '#3B82F6',
    isSystem: true,
    productCount: 25,
  },
  {
    id: '2',
    name: 'Молочные продукты',
    icon: 'Milk',
    color: '#06B6D4',
    isSystem: true,
    productCount: 18,
  },
  {
    id: '3',
    name: 'Мясо и рыба',
    icon: 'Beef',
    color: '#EF4444',
    isSystem: true,
    productCount: 12,
  },
  {
    id: '4',
    name: 'Хлеб и выпечка',
    icon: 'Cookie',
    color: '#F97316',
    isSystem: true,
    productCount: 15,
  },
  {
    id: '5',
    name: 'Фрукты и овощи',
    icon: 'Apple',
    color: '#10B981',
    isSystem: true,
    productCount: 30,
  },
  {
    id: '6',
    name: 'Крупы',
    icon: 'Wheat',
    color: '#F59E0B',
    isSystem: false,
    productCount: 8,
  },
  {
    id: '7',
    name: 'Сладости',
    icon: 'Candy',
    color: '#EC4899',
    isSystem: false,
    productCount: 20,
  },
];

// Mock all products (for AddProductsDialog)
const mockAllProducts = [
  { id: '1', name: 'Coca-Cola 0.5л', sku: 'CC-500', price: 15000, categoryId: '1', categoryName: 'Напитки' },
  { id: '2', name: 'Молоко 1л', sku: 'MLK-1000', price: 12000, categoryId: '2', categoryName: 'Молочные продукты' },
  { id: '3', name: 'Сок апельсиновый 1л', sku: 'JC-ORG', price: 18000, categoryId: undefined, categoryName: undefined },
  { id: '4', name: 'Вода минеральная 0.5л', sku: 'WTR-MIN', price: 5000, categoryId: undefined, categoryName: undefined },
  { id: '5', name: 'Pepsi 0.5л', sku: 'PP-500', price: 14000, categoryId: '1', categoryName: 'Напитки' },
  { id: '6', name: 'Кефир 0.5л', sku: 'KFR-500', price: 8000, categoryId: '2', categoryName: 'Молочные продукты' },
  { id: '7', name: 'Йогурт питьевой', sku: 'YGT-DRN', price: 6000, categoryId: '2', categoryName: 'Молочные продукты' },
  { id: '8', name: 'Творог 200г', sku: 'CTG-200', price: 9000, categoryId: '2', categoryName: 'Молочные продукты' },
  { id: '9', name: 'Сметана 20% 200г', sku: 'SMT-200', price: 7000, categoryId: undefined, categoryName: undefined },
  { id: '10', name: 'Куриное филе 1кг', sku: 'CHKN-FLT', price: 45000, categoryId: '3', categoryName: 'Мясо и рыба' },
  { id: '11', name: 'Хлеб белый', sku: 'BRD-WHT', price: 5000, categoryId: '4', categoryName: 'Хлеб и выпечка' },
  { id: '12', name: 'Булочка с маком', sku: 'BUN-PPY', price: 3000, categoryId: '4', categoryName: 'Хлеб и выпечка' },
  { id: '13', name: 'Яблоки 1кг', sku: 'APL-1KG', price: 18000, categoryId: '5', categoryName: 'Фрукты и овощи' },
  { id: '14', name: 'Бананы 1кг', sku: 'BNN-1KG', price: 22000, categoryId: '5', categoryName: 'Фрукты и овощи' },
  { id: '15', name: 'Рис 1кг', sku: 'RIC-1KG', price: 16000, categoryId: '6', categoryName: 'Крупы' },
  { id: '16', name: 'Гречка 1кг', sku: 'BCK-1KG', price: 18000, categoryId: '6', categoryName: 'Крупы' },
  { id: '17', name: 'Шоколад молочный', sku: 'CHC-MLK', price: 25000, categoryId: '7', categoryName: 'Сладости' },
  { id: '18', name: 'Конфеты ассорти 500г', sku: 'CND-AST', price: 35000, categoryId: '7', categoryName: 'Сладости' },
];

// Mock products в категории
const mockProductsInCategory: Record<string, any[]> = {
  '1': [
    {
      id: '1',
      name: 'Coca-Cola',
      brandAndVolume: '0.5 л',
      sku: 'CC-500',
      price: 15000,
      cost: 10000,
      stock: 150,
      isActive: true,
      image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=100&h=100&fit=crop',
    },
    {
      id: '5',
      name: 'Pepsi',
      brandAndVolume: '0.5 л',
      sku: 'PP-500',
      price: 14000,
      cost: 9500,
      stock: 120,
      isActive: true,
      image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=100&h=100&fit=crop',
    },
  ],
  '2': [
    {
      id: '2',
      name: 'Молоко',
      brandAndVolume: 'Простоквашино · 1 л',
      sku: 'MLK-1000',
      price: 12000,
      cost: 8000,
      stock: 80,
      isActive: true,
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&h=100&fit=crop',
    },
    {
      id: '6',
      name: 'Кефир',
      brandAndVolume: 'Простоквашино · 0.5 л',
      sku: 'KFR-500',
      price: 8000,
      cost: 5500,
      stock: 60,
      isActive: true,
      image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=100&h=100&fit=crop',
    },
  ],
  '3': [
    {
      id: '10',
      name: 'Куриное филе',
      brandAndVolume: '1 кг',
      sku: 'CHKN-FLT',
      price: 45000,
      cost: 35000,
      stock: 25,
      isActive: true,
      image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100&h=100&fit=crop',
    },
  ],
  '4': [
    {
      id: '11',
      name: 'Хлеб белый',
      brandAndVolume: '400 г',
      sku: 'BRD-WHT',
      price: 5000,
      cost: 3000,
      stock: 50,
      isActive: true,
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&h=100&fit=crop',
    },
    {
      id: '12',
      name: 'Булочка с маком',
      brandAndVolume: '80 г',
      sku: 'BUN-PPY',
      price: 3000,
      cost: 1800,
      stock: 30,
      isActive: true,
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=100&h=100&fit=crop',
    },
  ],
  '5': [
    {
      id: '13',
      name: 'Яблоки',
      brandAndVolume: '1 кг',
      sku: 'APL-1KG',
      price: 18000,
      cost: 12000,
      stock: 100,
      isActive: true,
      image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=100&h=100&fit=crop',
    },
    {
      id: '14',
      name: 'Бананы',
      brandAndVolume: '1 кг',
      sku: 'BNN-1KG',
      price: 22000,
      cost: 15000,
      stock: 80,
      isActive: true,
      image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100&h=100&fit=crop',
    },
  ],
  '6': [
    {
      id: '15',
      name: 'Рис',
      brandAndVolume: '1 кг',
      sku: 'RIC-1KG',
      price: 16000,
      cost: 11000,
      stock: 120,
      isActive: true,
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100&h=100&fit=crop',
    },
    {
      id: '16',
      name: 'Гречка',
      brandAndVolume: '1 кг',
      sku: 'BCK-1KG',
      price: 18000,
      cost: 13000,
      stock: 90,
      isActive: true,
      image: 'https://images.unsplash.com/photo-1612058936115-42fc0db93127?w=100&h=100&fit=crop',
    },
  ],
  '7': [
    {
      id: '17',
      name: 'Шоколад молочный',
      brandAndVolume: 'Alpen Gold · 90 г',
      sku: 'CHC-MLK',
      price: 25000,
      cost: 18000,
      stock: 60,
      isActive: true,
      image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=100&h=100&fit=crop',
    },
    {
      id: '18',
      name: 'Конфеты ассорти',
      brandAndVolume: 'Rafaello · 500 г',
      sku: 'CND-AST',
      price: 35000,
      cost: 25000,
      stock: 40,
      isActive: true,
      image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=100&h=100&fit=crop',
    },
  ],
};

export default function CategoryDetailPage() {
  const { t } = useTranslation('common');
  const params = useParams();
  const router = useRouter();
  const categoryId = params.categoryId as string;
  const storeId = params.id as string;

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddProductsDialogOpen, setIsAddProductsDialogOpen] = useState(false);

  // Mock state for category (in real app this would come from API)
  const [categoryState, setCategoryState] = useState(mockCategories.find((c) => c.id === categoryId));
  const [productsState, setProductsState] = useState(mockProductsInCategory[categoryId] || []);

  // Search and selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const category = categoryState;
  const products = productsState;

  // Filtered products based on search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }
    const search = searchQuery.toLowerCase();
    return products.filter(
      (product: any) =>
        product.name.toLowerCase().includes(search) ||
        product.brandAndVolume?.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search)
    );
  }, [products, searchQuery]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map((p: any) => p.id)));
    }
  };

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleBulkRemove = () => {
    setProductsState((prev: any[]) => prev.filter((p) => !selectedProducts.has(p.id)));
    setSelectedProducts(new Set());
    toast.success(t('components.toast.success'), t('pages.categories.productsRemoved'));
  };

  // Handlers
  const handleEditCategory = async (data: { name: string; icon?: string; color?: string }) => {
    // Mock implementation - update local state
    if (category) {
      setCategoryState({
        ...category,
        name: data.name,
        icon: data.icon,
        color: data.color,
      });
    }
    toast.success(t('components.toast.success'), t('pages.categories.categoryUpdated'));
    // TODO: Call API to update category
  };

  const handleDeleteCategory = async () => {
    // Mock implementation - navigate back
    toast.success(t('components.toast.success'), t('pages.categories.categoryDeleted'));
    // TODO: Call API to delete category
    router.push(`/store/${storeId}/categories`);
  };

  const handleAttachProducts = async (productIds: string[]) => {
    // Mock implementation - add products to category
    // Find products and update their categoryId
    const newProducts = mockAllProducts.filter((p) => productIds.includes(p.id));
    const updatedProducts = newProducts.map((p) => ({
      ...p,
      categoryId: categoryId,
      categoryName: category?.name,
    }));

    // Update local state (merge with existing)
    setProductsState((prev: any[]) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const toAdd = updatedProducts.filter((p) => !existingIds.has(p.id));
      return [...prev, ...toAdd];
    });

    toast.success(t('components.toast.success'), t('pages.categories.productsAttached'));
    // TODO: Call API to attach products
  };

  if (!category) {
    return (
      <div className="space-y-6">
        <div className="text-center p-12">
          <h2 className="text-2xl font-bold">Категория не найдена</h2>
          <Button
            onClick={() => router.push(`/store/${storeId}/categories`)}
            className="mt-4"
          >
            Вернуться к категориям
          </Button>
        </div>
      </div>
    );
  }

  // Подсчёт статистики
  const totalProducts = products.length;
  const totalValue = products.reduce(
    (sum: number, p: any) => sum + p.price * p.stock,
    0
  );
  const inStockProducts = products.filter((p: any) => p.stock > 0).length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const columns: Column<any>[] = [
    {
      key: 'checkbox',
      label: (
        <Checkbox
          checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
          onCheckedChange={handleSelectAll}
        />
      ),
      render: (product: any) => (
        <Checkbox
          checked={selectedProducts.has(product.id)}
          onCheckedChange={() => handleSelectProduct(product.id)}
        />
      ),
    },
    {
      key: 'name',
      label: t('fields.name'),
      sortable: true,
      render: (product: any) => (
        <div className="flex items-center gap-3">
          {product.image && (
            <img
              src={product.image}
              alt={product.name}
              className="w-10 h-10 rounded object-cover flex-shrink-0"
            />
          )}
          <div>
            <p className="font-medium">{product.name}</p>
            {product.brandAndVolume && (
              <p className="text-sm text-muted-foreground">{product.brandAndVolume}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'sku',
      label: t('fields.sku'),
      render: (product: any) => (
        <span className="text-sm">{product.sku}</span>
      ),
    },
    {
      key: 'price',
      label: t('fields.price'),
      sortable: true,
      render: (product: any) => (
        <span>{formatCurrency(product.price)} {t('currency')}</span>
      ),
    },
    {
      key: 'stock',
      label: t('fields.stock'),
      sortable: true,
      render: (product: any) => (
        <span className="text-sm">{product.stock} {t('units.pcs')}</span>
      ),
    },
    {
      key: 'isActive',
      label: t('fields.status'),
      render: (product: any) => (
        <Badge variant={product.isActive ? 'success' : 'secondary'}>
          {product.isActive ? t('statuses.active') : t('statuses.inactive')}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => router.push(`/store/${storeId}/categories`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('pages.categories.backToList')}
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (~33%): Info card */}
        <div className="space-y-6">
          {/* Information Card */}
          <Card className="p-6">
            <div className="space-y-4">
              {/* Category badge and name */}
              <div>
                <CategoryBadge
                  name={category.name}
                  icon={category.icon}
                  color={category.color}
                  size="lg"
                />
              </div>

              {/* Information with icons */}
              <div className="space-y-3">
                {/* Type */}
                <div className="flex items-start gap-3">
                  <Layers className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('pages.categories.type')}
                  </span>
                  <div className="text-right">
                    <Badge variant={category.isSystem ? 'secondary' : 'outline'}>
                      {category.isSystem
                        ? t('pages.categories.systemCategory')
                        : t('pages.categories.userCategory')}
                    </Badge>
                  </div>
                </div>

                {/* Total Products */}
                <div className="flex items-start gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('pages.categories.totalProducts')}
                  </span>
                  <span className="text-sm font-medium text-right">
                    {totalProducts}
                  </span>
                </div>

                {/* In Stock */}
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('pages.categories.inStock')}
                  </span>
                  <span className="text-sm font-medium text-right">
                    {inStockProducts}
                  </span>
                </div>

                {/* Total Value */}
                <div className="flex items-start gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('pages.categories.totalValue')}
                  </span>
                  <span className="text-sm font-bold text-right">
                    {formatCurrency(totalValue)} {t('currency')}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <TooltipProvider delayDuration={0}>
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="h-10 w-10 bg-muted hover:bg-muted/80"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('actions.delete')}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEditDialogOpen(true)}
                        className="h-10 w-10 bg-muted hover:bg-muted/80"
                      >
                        <Pencil className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('actions.edit')}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
          </Card>
        </div>

        {/* Right column (~67%): Table only */}
        <div className="lg:col-span-2 space-y-0">
          {/* Search and buttons with padding */}
          <Card className="p-6 rounded-b-none">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('pages.categories.searchProducts')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBulkRemove}
                disabled={selectedProducts.size === 0}
                className="h-10 w-10 disabled:bg-muted enabled:bg-red-50 enabled:hover:bg-red-100 enabled:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button onClick={() => setIsAddProductsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('pages.categories.addProducts')}
              </Button>
            </div>
          </Card>

          {/* Table without padding */}
          <Card className="rounded-t-none border-t-0">
            {filteredProducts.length > 0 ? (
              <DataTable
                data={filteredProducts}
                columns={columns}
                onRowClick={(product: any) =>
                  router.push(`/store/${storeId}/products/${product.id}`)
                }
                pagination={{ enabled: false }}
              />
            ) : (
              <div className="text-center p-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? t('globalSearch.noResults')
                    : t('pages.categories.noProducts')}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      {category && (
        <>
          <EditCategoryDialog
            category={category}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSave={handleEditCategory}
          />

          <DeleteCategoryDialog
            category={{
              ...category,
              productCount: products.length,
            }}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onConfirm={handleDeleteCategory}
          />

          <AddProductsDialog
            currentCategoryId={categoryId}
            currentCategoryName={category.name}
            products={mockAllProducts}
            open={isAddProductsDialogOpen}
            onOpenChange={setIsAddProductsDialogOpen}
            onAttach={handleAttachProducts}
          />
        </>
      )}
    </div>
  );
}
