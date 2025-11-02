'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Package, TrendingUp, DollarSign } from 'lucide-react';
import {
  Button,
  Card,
  DataTable,
  Column,
  Badge,
} from '@jowi/ui';
import { CategoryBadge } from '@/components/category-badge';

// Mock categories (должны быть те же, что на главной странице)
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

// Mock products в категории
const mockProductsInCategory: Record<string, any[]> = {
  '1': [
    {
      id: '1',
      name: 'Coca-Cola 0.5л',
      sku: 'CC-500',
      price: 15000,
      cost: 10000,
      stock: 150,
      isActive: true,
    },
    {
      id: '5',
      name: 'Pepsi 0.5л',
      sku: 'PP-500',
      price: 14000,
      cost: 9500,
      stock: 120,
      isActive: true,
    },
  ],
  '2': [
    {
      id: '2',
      name: 'Молоко 1л',
      sku: 'MLK-1000',
      price: 12000,
      cost: 8000,
      stock: 80,
      isActive: true,
    },
    {
      id: '6',
      name: 'Кефир 0.5л',
      sku: 'KFR-500',
      price: 8000,
      cost: 5500,
      stock: 60,
      isActive: true,
    },
  ],
  '3': [
    {
      id: '10',
      name: 'Куриное филе 1кг',
      sku: 'CHKN-FLT',
      price: 45000,
      cost: 35000,
      stock: 25,
      isActive: true,
    },
  ],
  '4': [
    {
      id: '11',
      name: 'Хлеб белый',
      sku: 'BRD-WHT',
      price: 5000,
      cost: 3000,
      stock: 50,
      isActive: true,
    },
    {
      id: '12',
      name: 'Булочка с маком',
      sku: 'BUN-PPY',
      price: 3000,
      cost: 1800,
      stock: 30,
      isActive: true,
    },
  ],
  '5': [
    {
      id: '13',
      name: 'Яблоки 1кг',
      sku: 'APL-1KG',
      price: 18000,
      cost: 12000,
      stock: 100,
      isActive: true,
    },
    {
      id: '14',
      name: 'Бананы 1кг',
      sku: 'BNN-1KG',
      price: 22000,
      cost: 15000,
      stock: 80,
      isActive: true,
    },
  ],
  '6': [
    {
      id: '15',
      name: 'Рис 1кг',
      sku: 'RIC-1KG',
      price: 16000,
      cost: 11000,
      stock: 120,
      isActive: true,
    },
    {
      id: '16',
      name: 'Гречка 1кг',
      sku: 'BCK-1KG',
      price: 18000,
      cost: 13000,
      stock: 90,
      isActive: true,
    },
  ],
  '7': [
    {
      id: '17',
      name: 'Шоколад молочный',
      sku: 'CHC-MLK',
      price: 25000,
      cost: 18000,
      stock: 60,
      isActive: true,
    },
    {
      id: '18',
      name: 'Конфеты ассорти 500г',
      sku: 'CND-AST',
      price: 35000,
      cost: 25000,
      stock: 40,
      isActive: true,
    },
  ],
};

export default function CategoryDetailPage() {
  const { t } = useTranslation('common');
  const params = useParams();
  const router = useRouter();
  const categoryId = params.categoryId as string;
  const storeId = params.id as string;

  const category = mockCategories.find((c) => c.id === categoryId);
  const products = mockProductsInCategory[categoryId] || [];

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
    (sum, p) => sum + p.price * p.stock,
    0
  );
  const inStockProducts = products.filter((p) => p.stock > 0).length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const columns: Column<any>[] = [
    {
      key: 'name',
      label: t('fields.name'),
      sortable: true,
    },
    {
      key: 'sku',
      label: t('fields.sku'),
    },
    {
      key: 'price',
      label: t('fields.price'),
      sortable: true,
      render: (product) => (
        <span>{formatCurrency(product.price)} {t('currency')}</span>
      ),
    },
    {
      key: 'stock',
      label: t('fields.stock'),
      sortable: true,
      render: (product) => (
        <Badge variant={product.stock > 0 ? 'success' : 'secondary'}>
          {product.stock} {t('units.pcs')}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      label: t('fields.status'),
      render: (product) => (
        <Badge variant={product.isActive ? 'success' : 'secondary'}>
          {product.isActive ? t('statuses.active') : t('statuses.inactive')}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/store/${storeId}/categories`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <CategoryBadge
            name={category.name}
            icon={category.icon}
            color={category.color}
            size="lg"
          />
          <p className="text-muted-foreground mt-2">
            {category.isSystem
              ? t('pages.categories.systemCategory')
              : t('pages.categories.userCategory')}
          </p>
        </div>
        <Button onClick={() => router.push(`/store/${storeId}/products/new/manual?categoryId=${categoryId}`)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('pages.categories.addProduct')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full p-3 bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('pages.categories.totalProducts')}
              </p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full p-3 bg-green-500/10">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('pages.categories.inStock')}
              </p>
              <p className="text-2xl font-bold">{inStockProducts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full p-3 bg-blue-500/10">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('pages.categories.totalValue')}
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(totalValue)} {t('currency')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            {t('pages.categories.productsInCategory')}
          </h2>
        </div>

        {products.length > 0 ? (
          <DataTable
            data={products}
            columns={columns}
            onRowClick={(product) =>
              router.push(`/store/${storeId}/products/${product.id}`)
            }
            emptyMessage={t('pages.categories.noProducts')}
          />
        ) : (
          <div className="text-center p-12 border-2 border-dashed rounded-lg">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {t('pages.categories.noProducts')}
            </p>
            <Button onClick={() => router.push(`/store/${storeId}/products/new/manual?categoryId=${categoryId}`)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('pages.categories.addFirstProduct')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
