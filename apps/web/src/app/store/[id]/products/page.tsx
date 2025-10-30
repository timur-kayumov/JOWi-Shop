'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Pencil, Package } from 'lucide-react';
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
} from '@jowi/ui';

// Mock data
const mockCategories = [
  { id: '1', name: 'Напитки' },
  { id: '2', name: 'Молочные продукты' },
  { id: '3', name: 'Хлеб и выпечка' },
  { id: '4', name: 'Крупы' },
];

const mockProducts = [
  {
    id: '1',
    name: 'Coca-Cola 0.5л',
    category: 'Напитки',
    sku: 'CC-500',
    price: 15000,
    cost: 10000,
    stock: 150,
    isActive: true,
    imageUrl: undefined,
  },
  {
    id: '2',
    name: 'Молоко 1л',
    category: 'Молочные продукты',
    sku: 'MLK-1000',
    price: 12000,
    cost: 8000,
    stock: 80,
    isActive: true,
    imageUrl: undefined,
  },
  {
    id: '3',
    name: 'Хлеб белый',
    category: 'Хлеб и выпечка',
    sku: 'BRD-WH',
    price: 5000,
    cost: 3000,
    stock: 200,
    isActive: true,
    imageUrl: undefined,
  },
  {
    id: '4',
    name: 'Рис басмати 1кг',
    category: 'Крупы',
    sku: 'RICE-BAS',
    price: 25000,
    cost: 18000,
    stock: 50,
    isActive: true,
    imageUrl: undefined,
  },
  {
    id: '5',
    name: 'Pepsi 0.5л',
    category: 'Напитки',
    sku: 'PP-500',
    price: 14000,
    cost: 9500,
    stock: 120,
    isActive: true,
    imageUrl: undefined,
  },
  {
    id: '6',
    name: 'Кефир 0.5л',
    category: 'Молочные продукты',
    sku: 'KFR-500',
    price: 8000,
    cost: 5500,
    stock: 60,
    isActive: true,
    imageUrl: undefined,
  },
  {
    id: '7',
    name: 'Гречка 1кг',
    category: 'Крупы',
    sku: 'GRCH-1',
    price: 18000,
    cost: 13000,
    stock: 40,
    isActive: false,
    imageUrl: undefined,
  },
];

export default function StoreProductsPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation('common');
  const storeId = params.id as string;

  const [products] = useState(mockProducts);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && product.isActive) ||
      (statusFilter === 'inactive' && !product.isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const columns: Column<typeof mockProducts[0]>[] = [
    {
      key: 'name',
      label: t('pages.products.fields.product'),
      render: (product) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Package className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="font-medium">{product.name}</div>
            <div className="text-sm text-muted-foreground">{product.sku}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: t('pages.products.fields.category'),
    },
    {
      key: 'price',
      label: t('pages.products.fields.price'),
      render: (product) => (
        <span>{formatCurrency(product.price)} {t('currency.uzs')}</span>
      ),
    },
    {
      key: 'cost',
      label: t('pages.products.fields.cost'),
      render: (product) => (
        <span>{formatCurrency(product.cost)} {t('currency.uzs')}</span>
      ),
    },
    {
      key: 'stock',
      label: t('pages.products.stock'),
      render: (product) => (
        <span className={product.stock < 50 ? 'text-destructive font-medium' : ''}>
          {product.stock} {t('units.pcs')}
        </span>
      ),
    },
    {
      key: 'status',
      label: t('fields.status'),
      render: (product) => (
        <Badge variant={product.isActive ? 'success' : 'secondary'}>
          {product.isActive ? t('status.active') : t('status.inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (product) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/store/${storeId}/products/${product.id}`)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const hasActiveFilters = categoryFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('pages.products.title')}
        </h1>
        <p className="text-muted-foreground">{t('pages.products.subtitle')}</p>
      </div>

      {/* Actions and Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('pages.products.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('pages.products.categories.all')}
              </SelectItem>
              {mockCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('pages.products.filters.allStatuses')}
              </SelectItem>
              <SelectItem value="active">{t('status.active')}</SelectItem>
              <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={() => {
                setCategoryFilter('all');
                setStatusFilter('all');
              }}
            >
              {t('pages.products.resetFilters')}
            </Button>
          )}

          <Button onClick={() => router.push(`/store/${storeId}/products/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('pages.products.addProduct')}
          </Button>
        </div>
      </div>

      {/* Products count */}
      <div className="text-sm text-muted-foreground">
        {t('pages.products.showing', {
          count: filteredProducts.length,
          total: products.length,
        })}
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredProducts}
        columns={columns}
        emptyMessage={
          search || hasActiveFilters
            ? t('pages.products.notFound')
            : t('pages.products.noProducts')
        }
        onRowClick={(product) => router.push(`/store/${storeId}/products/${product.id}`)}
      />
    </div>
  );
}
