'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Hash, Barcode, Warehouse, Boxes, DollarSign, PackagePlus, Calendar } from 'lucide-react';
import {
  Button,
  Card,
  Badge,
  StatusBadge,
  formatDate,
  DataTable,
  DateRangePicker,
  Input,
  cn,
  type Column,
} from '@jowi/ui';
import { useTranslation } from 'react-i18next';

// ==================== TYPES ====================

type StockStatus = 'inStock' | 'lowStock' | 'outOfStock';

interface WarehouseStock {
  id: string;
  name: string;
  quantity: number;
  value: number; // quantity * purchasePrice
}

interface ProductMovement {
  id: string;
  datetime: Date;
  type: 'received' | 'written_off' | 'transfer' | 'sale';
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  price: number;
}

interface ProductDetail {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  categoryName: string;
  unit: string;
  status: StockStatus;

  // Stock
  totalStock: number;
  totalValue: number;
  warehouseStocks: WarehouseStock[];

  // Pricing
  purchasePrice: number;

  // Last received
  lastReceived: {
    date: Date;
    quantity: number;
    price: number;
  } | null;

  // Initial stock for calculations
  initialStock: number;

  // Movement history
  movements: ProductMovement[];
}

interface DateRangeState {
  from: Date;
  to: Date;
}

// ==================== MOCK DATA ====================

// Generate mock movements for calculation
const mockMovements: ProductMovement[] = Array.from({ length: 150 }, (_, i) => {
  const daysAgo = Math.floor(Math.random() * 30);
  const type: ProductMovement['type'] =
    i % 4 === 0 ? 'received' :
    i % 4 === 1 ? 'written_off' :
    i % 4 === 2 ? 'transfer' : 'sale';

  return {
    id: String(i + 1),
    datetime: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
    type,
    warehouseId: ['w1', 'w2', 'w3'][i % 3],
    warehouseName: ['Основной склад', 'Склад №2', 'Склад розничный'][i % 3],
    quantity: type === 'received' ? Math.floor(Math.random() * 50) + 10 : Math.floor(Math.random() * 30) + 5,
    price: 15000 + Math.floor(Math.random() * 5000),
  };
});

const mockProduct: ProductDetail = {
  id: '1',
  productId: 'p1',
  variantId: 'v1',
  name: 'Coca-Cola 0.5л',
  sku: 'CC-05L-001',
  barcode: '4820024700016',
  categoryId: 'cat1',
  categoryName: 'Напитки',
  unit: 'шт',
  status: 'inStock',

  totalStock: 845,
  totalValue: 12675000, // 845 * 15000
  warehouseStocks: [
    { id: 'w1', name: 'Основной склад', quantity: 450, value: 6750000 },
    { id: 'w2', name: 'Склад №2', quantity: 245, value: 3675000 },
    { id: 'w3', name: 'Склад розничный', quantity: 150, value: 2250000 },
  ],

  purchasePrice: 15000,

  lastReceived: {
    date: new Date('2024-11-10T10:30:00'),
    quantity: 100,
    price: 15000,
  },

  initialStock: 500,
  movements: mockMovements,
};

// ==================== MAIN COMPONENT ====================

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();

  const variantId = params.variantId as string;
  const storeId = params.id as string;

  const product = mockProduct;

  // State
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeState>({
    from: new Date(new Date().setHours(0, 0, 0, 0)),
    to: new Date(new Date().setHours(23, 59, 59, 999)),
  });
  const [warehouseSearch, setWarehouseSearch] = useState('');

  // Fix hydration issue
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // ==================== CALCULATIONS ====================

  // Calculate stats for selected date range
  const periodStats = useMemo(() => {
    // Filter movements within date range
    const periodMovements = product.movements.filter(
      (m) => m.datetime >= dateRange.from && m.datetime <= dateRange.to
    );

    // Calculate received and written off
    const received = periodMovements
      .filter((m) => m.type === 'received')
      .reduce((sum, m) => sum + m.quantity, 0);

    const writtenOff = periodMovements
      .filter((m) => m.type === 'written_off' || m.type === 'sale')
      .reduce((sum, m) => sum + m.quantity, 0);

    // Calculate stock at start of period
    const movementsBeforeStart = product.movements.filter(
      (m) => m.datetime < dateRange.from
    );

    const receivedBeforeStart = movementsBeforeStart
      .filter((m) => m.type === 'received')
      .reduce((sum, m) => sum + m.quantity, 0);

    const writtenOffBeforeStart = movementsBeforeStart
      .filter((m) => m.type === 'written_off' || m.type === 'sale')
      .reduce((sum, m) => sum + m.quantity, 0);

    const stockAtStart = product.initialStock + receivedBeforeStart - writtenOffBeforeStart;
    const stockAtEnd = stockAtStart + received - writtenOff;

    const receivedValue = received * product.purchasePrice;
    const writtenOffValue = writtenOff * product.purchasePrice;
    const stockAtStartValue = stockAtStart * product.purchasePrice;
    const stockAtEndValue = stockAtEnd * product.purchasePrice;

    return {
      received,
      receivedValue,
      writtenOff,
      writtenOffValue,
      stockAtStart,
      stockAtStartValue,
      stockAtEnd,
      stockAtEndValue,
    };
  }, [dateRange, product]);

  // ==================== EVENT HANDLERS ====================

  const handleBack = () => {
    router.push(`/store/${storeId}/warehouses/monitoring`);
  };

  // ==================== FILTERED DATA ====================

  const filteredWarehouses = useMemo(() => {
    if (!warehouseSearch.trim()) {
      return product.warehouseStocks;
    }

    const search = warehouseSearch.toLowerCase();
    return product.warehouseStocks.filter((w) =>
      w.name.toLowerCase().includes(search)
    );
  }, [warehouseSearch, product.warehouseStocks]);

  // ==================== TABLE COLUMNS ====================

  const warehouseColumns: Column<WarehouseStock>[] = [
    {
      key: 'name',
      label: t('warehouses.monitoring.detail.warehouseName'),
      sortable: true,
      render: (item) => (
        <div className="font-medium">{item.name}</div>
      ),
    },
    {
      key: 'quantity',
      label: t('warehouses.monitoring.detail.stockQuantity'),
      sortable: true,
      render: (item) => (
        <div>
          {item.quantity.toLocaleString()} {product.unit}
        </div>
      ),
    },
    {
      key: 'value',
      label: t('warehouses.monitoring.detail.stockValue'),
      sortable: true,
      render: (item) => (
        <div className="font-medium">
          {item.value.toLocaleString()} {t('currency')}
        </div>
      ),
    },
  ];

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('warehouses.monitoring.detail.backToMonitoring')}
        </Button>
      </div>

      {/* Two-column layout: 1/3 left (info + monitoring), 2/3 right (warehouses table) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Product Info + Monitoring */}
        <div className="space-y-6">
          {/* Product Info Card */}
          <Card className="p-6">
            <div className="space-y-4">
              {/* Product Name (without title) */}
              <h2 className="text-2xl font-bold">{product.name}</h2>

              {/* Product details with icons */}
              <div className="space-y-3">
                {/* Category */}
                <div className="flex items-start gap-3">
                  <Package className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('warehouses.monitoring.detail.category')}
                  </span>
                  <span className="text-sm font-medium text-right">
                    {product.categoryName}
                  </span>
                </div>

                {/* SKU */}
                <div className="flex items-start gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('warehouses.monitoring.detail.sku')}
                  </span>
                  <span className="text-sm font-medium font-mono text-right">
                    {product.sku}
                  </span>
                </div>

                {/* Barcode */}
                <div className="flex items-start gap-3">
                  <Barcode className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('warehouses.monitoring.detail.barcode')}
                  </span>
                  <span className="text-sm font-medium font-mono text-right">
                    {product.barcode || t('warehouses.monitoring.detail.noBarcode')}
                  </span>
                </div>

                {/* Warehouses count */}
                <div className="flex items-start gap-3">
                  <Warehouse className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('warehouses.monitoring.detail.warehousesCount')}
                  </span>
                  <span className="text-sm font-medium text-right">
                    {product.warehouseStocks.length}
                  </span>
                </div>

                {/* Total stock */}
                <div className="flex items-start gap-3">
                  <Boxes className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('warehouses.monitoring.detail.totalStockAllWarehouses')}
                  </span>
                  <span className="text-sm font-medium text-right">
                    {product.totalStock.toLocaleString()} {product.unit}
                  </span>
                </div>

                {/* Total value */}
                <div className="flex items-start gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('warehouses.monitoring.detail.totalValueAllWarehouses')}
                  </span>
                  <span className="text-sm font-medium text-right">
                    {product.totalValue.toLocaleString()} {t('currency')}
                  </span>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t" />

              {/* Last received info with icons */}
              <div className="space-y-3">
                {/* Last purchase price */}
                <div className="flex items-start gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('warehouses.monitoring.detail.lastPurchasePrice')}
                  </span>
                  <span className="text-sm font-medium text-right">
                    {product.purchasePrice.toLocaleString()} {t('currency')}
                  </span>
                </div>

                {product.lastReceived ? (
                  <>
                    {/* Last received quantity */}
                    <div className="flex items-start gap-3">
                      <PackagePlus className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground flex-1">
                        {t('warehouses.monitoring.detail.lastReceivedQuantity')}
                      </span>
                      <span className="text-sm font-medium text-right">
                        {product.lastReceived.quantity.toLocaleString()} {product.unit}
                      </span>
                    </div>

                    {/* Last received date */}
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground flex-1">
                        {t('warehouses.monitoring.detail.lastReceivedDate')}
                      </span>
                      <span className="text-sm font-medium text-right">
                        {formatDate(product.lastReceived.date)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {t('warehouses.monitoring.detail.notReceived')}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Monitoring Card */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">
                  {t('warehouses.monitoring.detail.monitoring')}
                </h2>
                <DateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                    } else if (range?.from) {
                      setDateRange({ from: range.from, to: range.from });
                    } else {
                      // Reset to today when range is cleared
                      setDateRange({
                        from: new Date(new Date().setHours(0, 0, 0, 0)),
                        to: new Date(new Date().setHours(23, 59, 59, 999)),
                      });
                    }
                  }}
                  placeholder={t('warehouses.monitoring.detail.selectDateRange')}
                />
              </div>

              {/* Stock at start and end */}
              {mounted ? (
                <>
                  <div className="grid gap-4 grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t('warehouses.monitoring.detail.stockAtStart')}
                      </p>
                      <p className="text-xl font-semibold">
                        {periodStats.stockAtStart.toLocaleString()} {product.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {periodStats.stockAtStartValue.toLocaleString()} {t('currency')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t('warehouses.monitoring.detail.stockAtEnd')}
                      </p>
                      <p className="text-xl font-semibold">
                        {periodStats.stockAtEnd.toLocaleString()} {product.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {periodStats.stockAtEndValue.toLocaleString()} {t('currency')}
                      </p>
                    </div>
                  </div>

                  {/* Received and written off for period */}
                  <div className="grid gap-4 grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t('warehouses.monitoring.detail.receivedForPeriod')}
                      </p>
                      <p className="text-xl font-semibold text-green-600">
                        +{periodStats.received.toLocaleString()} {product.unit}
                      </p>
                      <p className="text-xs text-muted-foreground text-green-600">
                        +{periodStats.receivedValue.toLocaleString()} {t('currency')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t('warehouses.monitoring.detail.writtenOffForPeriod')}
                      </p>
                      <p className="text-xl font-semibold text-red-600">
                        -{periodStats.writtenOff.toLocaleString()} {product.unit}
                      </p>
                      <p className="text-xs text-muted-foreground text-red-600">
                        -{periodStats.writtenOffValue.toLocaleString()} {t('currency')}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid gap-4 grid-cols-2">
                  <div className="h-20 animate-pulse bg-muted rounded" />
                  <div className="h-20 animate-pulse bg-muted rounded" />
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right column: Warehouses Table (spans 2 columns) */}
        <div className="lg:col-span-2">
          {/* Search Card */}
          <Card className="p-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                {t('warehouses.monitoring.detail.warehousesWithStock')}
              </h2>

              <Input
                type="text"
                placeholder={t('warehouses.monitoring.detail.searchWarehouse')}
                value={warehouseSearch}
                onChange={(e) => setWarehouseSearch(e.target.value)}
              />
            </div>
          </Card>

          {/* Table Card */}
          <Card className="mt-6">
            <DataTable
              columns={warehouseColumns}
              data={filteredWarehouses}
              onRowClick={(item) => router.push(`/store/${storeId}/warehouses/warehouses-list/${item.id}`)}
              emptyMessage={t('warehouses.monitoring.detail.emptyWarehouses')}
              pagination={{ enabled: true, pageSize: 10 }}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
