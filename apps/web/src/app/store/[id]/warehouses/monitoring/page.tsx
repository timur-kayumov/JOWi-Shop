'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Search, Package } from 'lucide-react';
import {
  Card,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  MultiSelect,
  DataTable,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  type Column,
} from '@jowi/ui';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface WarehouseStock {
  id: string;
  name: string;
  quantity: number;
}

interface ProductMonitoring {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  categoryName: string;
  imageUrl?: string;

  // Остатки
  totalStock: number;
  warehouseStocks: WarehouseStock[];

  // Цены
  sellingPrice: number;         // Цена продажи
  purchasePrice: number;        // Цена закупки (из StockBatch FIFO)
  margin: number;               // Маржа в процентах

  // Последний приход
  lastReceived: {
    date: Date;
    quantity: number;
  } | null;

  // Дополнительная информация
  unit: string;                 // Единица измерения (шт, кг, л)
  status: 'inStock' | 'lowStock' | 'outOfStock';
}

interface Category {
  id: string;
  name: string;
}

interface Warehouse {
  id: string;
  name: string;
}

// ============================================================================
// Mock Data
// ============================================================================

const mockCategories: Category[] = [
  { id: '1', name: 'Напитки' },
  { id: '2', name: 'Молочные продукты' },
  { id: '3', name: 'Хлеб и выпечка' },
  { id: '4', name: 'Крупы' },
  { id: '5', name: 'Мясо и рыба' },
  { id: '6', name: 'Консервы' },
  { id: '7', name: 'Сладости' },
];

const mockWarehouses: Warehouse[] = [
  { id: '1', name: 'Основной' },
  { id: '2', name: 'Возвратов' },
  { id: '3', name: 'Транзитный' },
];

const mockProducts: ProductMonitoring[] = [
  {
    id: '1',
    productId: 'prod-1',
    variantId: 'var-1',
    name: 'Coca-Cola 0.5л',
    sku: 'CC-500',
    barcode: '5449000000996',
    categoryId: '1',
    categoryName: 'Напитки',
    totalStock: 350,
    warehouseStocks: [
      { id: '1', name: 'Основной', quantity: 200 },
      { id: '2', name: 'Возвратов', quantity: 50 },
      { id: '3', name: 'Транзитный', quantity: 100 },
    ],
    sellingPrice: 15000,
    purchasePrice: 10500,
    margin: 30,
    lastReceived: { date: new Date('2024-11-05T10:30:00Z'), quantity: 500 },
    unit: 'шт',
    status: 'inStock',
  },
  {
    id: '2',
    productId: 'prod-2',
    variantId: 'var-2',
    name: 'Молоко 1л',
    sku: 'MLK-1000',
    barcode: '4607025392010',
    categoryId: '2',
    categoryName: 'Молочные продукты',
    totalStock: 120,
    warehouseStocks: [
      { id: '1', name: 'Основной', quantity: 80 },
      { id: '2', name: 'Возвратов', quantity: 40 },
    ],
    sellingPrice: 12000,
    purchasePrice: 8500,
    margin: 29.17,
    lastReceived: { date: new Date('2024-11-08T09:15:00Z'), quantity: 200 },
    unit: 'шт',
    status: 'inStock',
  },
  {
    id: '3',
    productId: 'prod-3',
    variantId: 'var-3',
    name: 'Хлеб белый',
    sku: 'BRD-WH',
    barcode: '4606034011538',
    categoryId: '3',
    categoryName: 'Хлеб и выпечка',
    totalStock: 15,
    warehouseStocks: [
      { id: '1', name: 'Основной', quantity: 15 },
    ],
    sellingPrice: 5000,
    purchasePrice: 3200,
    margin: 36,
    lastReceived: { date: new Date('2024-11-11T07:00:00Z'), quantity: 50 },
    unit: 'шт',
    status: 'lowStock',
  },
  {
    id: '4',
    productId: 'prod-4',
    variantId: 'var-4',
    name: 'Рис басмати 1кг',
    sku: 'RICE-BAS',
    barcode: '4607011111110',
    categoryId: '4',
    categoryName: 'Крупы',
    totalStock: 0,
    warehouseStocks: [],
    sellingPrice: 25000,
    purchasePrice: 18000,
    margin: 28,
    lastReceived: { date: new Date('2024-10-25T14:00:00Z'), quantity: 100 },
    unit: 'кг',
    status: 'outOfStock',
  },
  {
    id: '5',
    productId: 'prod-5',
    variantId: 'var-5',
    name: 'Говядина 1кг',
    sku: 'BEEF-1KG',
    barcode: undefined,
    categoryId: '5',
    categoryName: 'Мясо и рыба',
    totalStock: 45,
    warehouseStocks: [
      { id: '1', name: 'Основной', quantity: 30 },
      { id: '3', name: 'Транзитный', quantity: 15 },
    ],
    sellingPrice: 95000,
    purchasePrice: 75000,
    margin: 21.05,
    lastReceived: { date: new Date('2024-11-10T06:00:00Z'), quantity: 50 },
    unit: 'кг',
    status: 'inStock',
  },
  {
    id: '6',
    productId: 'prod-6',
    variantId: 'var-6',
    name: 'Pepsi 1л',
    sku: 'PP-1000',
    barcode: '4600494001468',
    categoryId: '1',
    categoryName: 'Напитки',
    totalStock: 280,
    warehouseStocks: [
      { id: '1', name: 'Основной', quantity: 150 },
      { id: '3', name: 'Транзитный', quantity: 130 },
    ],
    sellingPrice: 18000,
    purchasePrice: 13000,
    margin: 27.78,
    lastReceived: { date: new Date('2024-11-09T15:20:00Z'), quantity: 300 },
    unit: 'шт',
    status: 'inStock',
  },
  {
    id: '7',
    productId: 'prod-7',
    variantId: 'var-7',
    name: 'Кефир 1л',
    sku: 'KFR-1000',
    barcode: '4607025392027',
    categoryId: '2',
    categoryName: 'Молочные продукты',
    totalStock: 85,
    warehouseStocks: [
      { id: '1', name: 'Основной', quantity: 60 },
      { id: '2', name: 'Возвратов', quantity: 25 },
    ],
    sellingPrice: 10000,
    purchasePrice: 7000,
    margin: 30,
    lastReceived: { date: new Date('2024-11-10T08:00:00Z'), quantity: 150 },
    unit: 'шт',
    status: 'inStock',
  },
  {
    id: '8',
    productId: 'prod-8',
    variantId: 'var-8',
    name: 'Батон нарезной',
    sku: 'BTN-SLC',
    barcode: '4606034011545',
    categoryId: '3',
    categoryName: 'Хлеб и выпечка',
    totalStock: 22,
    warehouseStocks: [
      { id: '1', name: 'Основной', quantity: 22 },
    ],
    sellingPrice: 4500,
    purchasePrice: 2800,
    margin: 37.78,
    lastReceived: { date: new Date('2024-11-11T06:30:00Z'), quantity: 60 },
    unit: 'шт',
    status: 'lowStock',
  },
  {
    id: '9',
    productId: 'prod-9',
    variantId: 'var-9',
    name: 'Гречка 1кг',
    sku: 'BCK-1KG',
    barcode: '4607011111127',
    categoryId: '4',
    categoryName: 'Крупы',
    totalStock: 150,
    warehouseStocks: [
      { id: '1', name: 'Основной', quantity: 100 },
      { id: '3', name: 'Транзитный', quantity: 50 },
    ],
    sellingPrice: 22000,
    purchasePrice: 16000,
    margin: 27.27,
    lastReceived: { date: new Date('2024-11-07T11:00:00Z'), quantity: 200 },
    unit: 'кг',
    status: 'inStock',
  },
  {
    id: '10',
    productId: 'prod-10',
    variantId: 'var-10',
    name: 'Курица охлажденная 1кг',
    sku: 'CHK-1KG',
    barcode: undefined,
    categoryId: '5',
    categoryName: 'Мясо и рыба',
    totalStock: 60,
    warehouseStocks: [
      { id: '1', name: 'Основной', quantity: 45 },
      { id: '3', name: 'Транзитный', quantity: 15 },
    ],
    sellingPrice: 45000,
    purchasePrice: 35000,
    margin: 22.22,
    lastReceived: { date: new Date('2024-11-11T10:00:00Z'), quantity: 80 },
    unit: 'кг',
    status: 'inStock',
  },
  {
    id: '11',
    productId: 'prod-11',
    variantId: 'var-11',
    name: 'Консервы "Тунец" 185г',
    sku: 'TUNA-185',
    barcode: '4820024771234',
    categoryId: '6',
    categoryName: 'Консервы',
    totalStock: 200,
    warehouseStocks: [
      { id: '1', name: 'Основной', quantity: 120 },
      { id: '3', name: 'Транзитный', quantity: 80 },
    ],
    sellingPrice: 35000,
    purchasePrice: 26000,
    margin: 25.71,
    lastReceived: { date: new Date('2024-11-06T14:30:00Z'), quantity: 250 },
    unit: 'шт',
    status: 'inStock',
  },
  {
    id: '12',
    productId: 'prod-12',
    variantId: 'var-12',
    name: 'Шоколад "Alpen Gold" 90г',
    sku: 'CHC-AG-90',
    barcode: '4690228001234',
    categoryId: '7',
    categoryName: 'Сладости',
    totalStock: 180,
    warehouseStocks: [
      { id: '1', name: 'Основной', quantity: 120 },
      { id: '2', name: 'Возвратов', quantity: 30 },
      { id: '3', name: 'Транзитный', quantity: 30 },
    ],
    sellingPrice: 12000,
    purchasePrice: 8500,
    margin: 29.17,
    lastReceived: { date: new Date('2024-11-08T16:00:00Z'), quantity: 240 },
    unit: 'шт',
    status: 'inStock',
  },
  {
    id: '13',
    productId: 'prod-13',
    variantId: 'var-13',
    name: 'Сметана 20% 400г',
    sku: 'SMT-400',
    barcode: '4607025392034',
    categoryId: '2',
    categoryName: 'Молочные продукты',
    totalStock: 40,
    warehouseStocks: [
      { id: '1', name: 'Основной', quantity: 25 },
      { id: '2', name: 'Возвратов', quantity: 15 },
    ],
    sellingPrice: 16000,
    purchasePrice: 11500,
    margin: 28.13,
    lastReceived: { date: new Date('2024-11-09T09:00:00Z'), quantity: 80 },
    unit: 'шт',
    status: 'lowStock',
  },
  {
    id: '14',
    productId: 'prod-14',
    variantId: 'var-14',
    name: 'Масло подсолнечное 1л',
    sku: 'OIL-SUN-1',
    barcode: '4607033001234',
    categoryId: '6',
    categoryName: 'Консервы',
    totalStock: 95,
    warehouseStocks: [
      { id: '1', name: 'Основной', quantity: 70 },
      { id: '3', name: 'Транзитный', quantity: 25 },
    ],
    sellingPrice: 28000,
    purchasePrice: 21000,
    margin: 25,
    lastReceived: { date: new Date('2024-11-05T13:00:00Z'), quantity: 120 },
    unit: 'шт',
    status: 'inStock',
  },
  {
    id: '15',
    productId: 'prod-15',
    variantId: 'var-15',
    name: 'Печенье "Юбилейное" 112г',
    sku: 'COK-JUB-112',
    barcode: '4690228005678',
    categoryId: '7',
    categoryName: 'Сладости',
    totalStock: 140,
    warehouseStocks: [
      { id: '1', name: 'Основной', quantity: 90 },
      { id: '2', name: 'Возвратов', quantity: 20 },
      { id: '3', name: 'Транзитный', quantity: 30 },
    ],
    sellingPrice: 9000,
    purchasePrice: 6500,
    margin: 27.78,
    lastReceived: { date: new Date('2024-11-07T10:30:00Z'), quantity: 180 },
    unit: 'шт',
    status: 'inStock',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  // Простое форматирование с пробелами для тысяч (избегаем проблем с SSR)
  const formatted = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} сум`;
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function formatDateShort(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
}

// ============================================================================
// Main Component
// ============================================================================

export default function WarehouseMonitoringPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;

  // State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState('all');

  // Filtered data
  const filteredData = useMemo(() => {
    return mockProducts.filter((product) => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower) ||
        product.barcode?.toLowerCase().includes(searchLower);

      // Category filter
      const matchesCategory =
        categoryFilter === 'all' || product.categoryId === categoryFilter;

      // Warehouse filter (OR logic: товар есть хотя бы на одном из выбранных складов)
      const matchesWarehouse =
        selectedWarehouses.length === 0 ||
        product.warehouseStocks.some((wh) => selectedWarehouses.includes(wh.id));

      // Stock filter
      const matchesStock =
        stockFilter === 'all' || product.status === stockFilter;

      return matchesSearch && matchesCategory && matchesWarehouse && matchesStock;
    });
  }, [search, categoryFilter, selectedWarehouses, stockFilter]);

  // Table columns
  const columns: Column<ProductMonitoring>[] = [
    {
      key: 'name',
      label: t('warehouses.monitoring.columns.product'),
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Package className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{item.name}</div>
            <div className="text-sm text-muted-foreground">{item.sku}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'categoryName',
      label: t('warehouses.monitoring.columns.category'),
      sortable: true,
      render: (item) => (
        <span className="text-sm text-muted-foreground">{item.categoryName}</span>
      ),
    },
    {
      key: 'totalStock',
      label: t('warehouses.monitoring.columns.stock'),
      sortable: true,
      render: (item) => {
        const statusColors = {
          inStock: 'text-success',
          lowStock: 'text-warning',
          outOfStock: 'text-destructive',
        };
        return (
          <span className={`font-medium ${statusColors[item.status]}`}>
            {item.totalStock} {item.unit}
          </span>
        );
      },
    },
    {
      key: 'warehouseStocks',
      label: t('warehouses.monitoring.columns.warehouses'),
      render: (item) => (
        <TooltipProvider delayDuration={0}>
          <div className="flex flex-wrap gap-1">
            {item.warehouseStocks.length === 0 ? (
              <span className="text-sm text-muted-foreground">—</span>
            ) : (
              item.warehouseStocks.map((wh) => (
                <Tooltip key={wh.id}>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="cursor-help">
                      {wh.name}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {wh.name}: {wh.quantity} {item.unit}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))
            )}
          </div>
        </TooltipProvider>
      ),
    },
    {
      key: 'sellingPrice',
      label: t('warehouses.monitoring.columns.sellingPrice') + ' / ' + t('warehouses.monitoring.columns.margin'),
      sortable: true,
      render: (item) => (
        <div className="text-sm">
          <div className="font-medium">{formatCurrency(item.sellingPrice)}</div>
          <div className="text-muted-foreground text-success">
            {item.margin.toFixed(1)}%
          </div>
        </div>
      ),
    },
    {
      key: 'lastReceived',
      label: t('warehouses.monitoring.columns.lastReceived'),
      sortable: true,
      render: (item) => {
        if (!item.lastReceived) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        return (
          <div className="text-sm">
            <div className="font-medium">{formatDateShort(item.lastReceived.date)}</div>
            <div className="text-muted-foreground">
              {item.lastReceived.quantity} {item.unit}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('warehouses.monitoring.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('warehouses.monitoring.description')}
          </p>
        </div>

        <div className="flex gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('warehouses.monitoring.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('warehouses.monitoring.filters.allCategories')}
              </SelectItem>
              {mockCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Warehouse Filter */}
          <MultiSelect
            value={selectedWarehouses}
            onValueChange={setSelectedWarehouses}
            options={mockWarehouses.map((wh) => ({
              value: wh.id,
              label: wh.name,
            }))}
            placeholder={t('warehouses.monitoring.filters.allWarehouses')}
            emptyText={t('warehouses.monitoring.filters.allWarehouses')}
            selectAllText={t('warehouses.monitoring.filters.selectAll')}
            clearAllText={t('warehouses.monitoring.filters.clearAll')}
            className="w-[200px]"
          />

          {/* Stock Filter */}
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('warehouses.monitoring.filters.allStock')}
              </SelectItem>
              <SelectItem value="inStock">
                {t('warehouses.monitoring.filters.inStock')}
              </SelectItem>
              <SelectItem value="lowStock">
                {t('warehouses.monitoring.filters.lowStock')}
              </SelectItem>
              <SelectItem value="outOfStock">
                {t('warehouses.monitoring.filters.outOfStock')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table Card */}
      <Card>
        <DataTable
          data={filteredData}
          columns={columns}
          onRowClick={(item) => router.push(`/store/${storeId}/warehouses/monitoring/${item.variantId}`)}
          emptyMessage={t('warehouses.monitoring.noProducts')}
          defaultSortKey="name"
          defaultSortDirection="asc"
          pagination={{ enabled: true, pageSize: 15 }}
        />
      </Card>
    </div>
  );
}
