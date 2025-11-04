'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DateRangePicker,
  Badge,
  Button,
} from '@jowi/ui';
import type { DateRange } from 'react-day-picker';
import { Search, Store, ChevronLeft, ChevronRight } from 'lucide-react';
// import { getCustomerReceipts } from '../app/intranet/customers/[id]/actions';
import { ReceiptDetailDialog } from './receipt-detail-dialog';

type CustomerPurchaseHistoryProps = {
  customerId: string;
  stores: Array<{ id: string; name: string }>;
};

// Mock data for receipts (temporary until DB is connected)
const mockReceipts = [
  {
    id: 'receipt-1',
    receiptNumber: 'CH-2024-001234',
    storeId: 'store1',
    createdAt: new Date('2024-03-15T14:30:00'),
    total: 250000,
    subtotal: 250000,
    discountAmount: 0,
    taxAmount: 0,
    status: 'completed',
    comment: null,
    store: {
      id: 'store1',
      name: 'Магазин Центральный',
    },
    employee: {
      user: {
        firstName: 'Олег',
        lastName: 'Иванов',
      },
    },
    terminal: {
      id: 'terminal-1',
      name: 'Касса №1',
    },
    items: [
      {
        quantity: 1,
        price: 150000,
        discountAmount: 0,
        total: 150000,
        variant: {
          sku: 'NIKE-AM-001',
          name: 'Размер 42',
          unit: 'шт',
          product: {
            id: 'prod-1',
            name: 'Кроссовки Nike Air Max',
            imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200',
          },
        },
      },
      {
        quantity: 2,
        price: 50000,
        discountAmount: 0,
        total: 100000,
        variant: {
          sku: 'ADIDAS-TS-001',
          name: 'Размер L',
          unit: 'шт',
          product: {
            id: 'prod-2',
            name: 'Футболка Adidas',
            imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200',
          },
        },
      },
    ],
    payments: [
      {
        method: 'card',
        amount: 250000,
      },
    ],
  },
  {
    id: 'receipt-2',
    receiptNumber: 'CH-2024-001233',
    storeId: 'store2',
    createdAt: new Date('2024-03-10T10:15:00'),
    total: 120000,
    subtotal: 130000,
    discountAmount: 10000,
    taxAmount: 0,
    status: 'completed',
    comment: 'Скидка постоянного клиента',
    store: {
      id: 'store2',
      name: 'Магазин Чиланзар',
    },
    employee: {
      user: {
        firstName: 'Анна',
        lastName: 'Петрова',
      },
    },
    terminal: {
      id: 'terminal-2',
      name: 'Касса №2',
    },
    items: [
      {
        quantity: 1,
        price: 80000,
        discountAmount: 10000,
        total: 70000,
        variant: {
          sku: 'PUMA-SH-001',
          name: 'Размер M',
          unit: 'шт',
          product: {
            id: 'prod-3',
            name: 'Шорты Puma',
            imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=200',
          },
        },
      },
      {
        quantity: 5,
        price: 10000,
        discountAmount: 0,
        total: 50000,
        variant: {
          sku: 'SOCK-001',
          name: 'Размер 39-42',
          unit: 'пар',
          product: {
            id: 'prod-4',
            name: 'Носки спортивные',
            imageUrl: null,
          },
        },
      },
    ],
    payments: [
      {
        method: 'cash',
        amount: 120000,
      },
    ],
  },
  {
    id: 'receipt-3',
    receiptNumber: 'CH-2024-001200',
    storeId: 'store1',
    createdAt: new Date('2024-02-28T16:45:00'),
    total: 350000,
    subtotal: 350000,
    discountAmount: 0,
    taxAmount: 0,
    status: 'completed',
    comment: null,
    store: {
      id: 'store1',
      name: 'Магазин Центральный',
    },
    employee: {
      user: {
        firstName: 'Олег',
        lastName: 'Иванов',
      },
    },
    terminal: {
      id: 'terminal-1',
      name: 'Касса №1',
    },
    items: [
      {
        quantity: 1,
        price: 350000,
        discountAmount: 0,
        total: 350000,
        variant: {
          sku: 'JACKET-WIN-001',
          name: 'Размер XL',
          unit: 'шт',
          product: {
            id: 'prod-5',
            name: 'Куртка зимняя The North Face',
            imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200',
          },
        },
      },
    ],
    payments: [
      {
        method: 'card',
        amount: 350000,
      },
    ],
  },
  {
    id: 'receipt-4',
    receiptNumber: 'CH-2024-001150',
    storeId: 'store2',
    createdAt: new Date('2024-02-15T12:20:00'),
    total: 420000,
    subtotal: 420000,
    discountAmount: 0,
    taxAmount: 0,
    status: 'completed',
    comment: null,
    store: {
      id: 'store2',
      name: 'Магазин Чиланзар',
    },
    employee: {
      user: {
        firstName: 'Анна',
        lastName: 'Петрова',
      },
    },
    terminal: {
      id: 'terminal-2',
      name: 'Касса №2',
    },
    items: [
      {
        quantity: 1,
        price: 280000,
        discountAmount: 0,
        total: 280000,
        variant: {
          sku: 'NIKE-JS-001',
          name: 'Размер M',
          unit: 'шт',
          product: {
            id: 'prod-6',
            name: 'Спортивный костюм Nike',
            imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200',
          },
        },
      },
      {
        quantity: 1,
        price: 90000,
        discountAmount: 0,
        total: 90000,
        variant: {
          sku: 'BAG-001',
          name: 'Универсальный',
          unit: 'шт',
          product: {
            id: 'prod-7',
            name: 'Рюкзак спортивный',
            imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200',
          },
        },
      },
      {
        quantity: 1,
        price: 50000,
        discountAmount: 0,
        total: 50000,
        variant: {
          sku: 'CAP-001',
          name: 'Размер универсальный',
          unit: 'шт',
          product: {
            id: 'prod-8',
            name: 'Кепка Adidas',
            imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=200',
          },
        },
      },
    ],
    payments: [
      {
        method: 'transfer',
        amount: 420000,
      },
    ],
  },
];

export function CustomerPurchaseHistory({
  customerId,
  stores,
}: CustomerPurchaseHistoryProps) {
  const { t } = useTranslation();

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const pageSize = 10;

  // Fetch receipts when filters change (using mock data for now)
  useEffect(() => {
    setLoading(true);

    // Simulate API delay
    setTimeout(() => {
      // Filter mock data
      let filtered = mockReceipts.filter((receipt) => {
        // Filter by search query
        if (searchQuery && !receipt.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }

        // Filter by store
        if (selectedStore !== 'all' && receipt.storeId !== selectedStore) {
          return false;
        }

        // Filter by payment method
        if (selectedPaymentMethod !== 'all' && !receipt.payments.some((p) => p.method === selectedPaymentMethod)) {
          return false;
        }

        // Filter by date range
        if (dateRange?.from && new Date(receipt.createdAt) < dateRange.from) {
          return false;
        }
        if (dateRange?.to && new Date(receipt.createdAt) > dateRange.to) {
          return false;
        }

        return true;
      });

      // Pagination
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedReceipts = filtered.slice(startIndex, endIndex);

      setReceipts(paginatedReceipts);
      setTotal(filtered.length);
      setTotalPages(Math.ceil(filtered.length / pageSize));
      setLoading(false);
    }, 300);
  }, [customerId, currentPage, searchQuery, selectedStore, selectedPaymentMethod, dateRange]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStore, selectedPaymentMethod, dateRange]);

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(date));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: t('paymentMethods.cash'),
      card: t('paymentMethods.card'),
      transfer: t('paymentMethods.transfer'),
      installment: t('paymentMethods.installment'),
    };
    return labels[method] || method;
  };

  const handleReceiptClick = (receipt: any) => {
    setSelectedReceipt(receipt);
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="rounded-2xl border bg-card">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">
            {t('pages.customerDetail.purchaseHistory')}
          </h3>
        </div>

        {/* Filters */}
        <div className="p-6 border-b">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('pages.customerDetail.searchReceipts')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Filters on one line */}
            <div className="flex flex-wrap gap-4">
              {/* Date Range Picker */}
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                placeholder={t('pages.customerDetail.filterByPeriod')}
                className="w-full sm:w-[200px]"
              />

              {/* Store Filter */}
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder={t('pages.customerDetail.filterByStore')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('pages.customerDetail.allStores')}</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Payment Method Filter */}
              <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder={t('pages.customerDetail.filterByPaymentMethod')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('pages.customerDetail.allPaymentMethods')}</SelectItem>
                  <SelectItem value="cash">{t('paymentMethods.cash')}</SelectItem>
                  <SelectItem value="card">{t('paymentMethods.card')}</SelectItem>
                  <SelectItem value="transfer">{t('paymentMethods.transfer')}</SelectItem>
                  <SelectItem value="installment">{t('paymentMethods.installment')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Receipts List */}
        <div className="divide-y">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {t('messages.loading')}
            </div>
          ) : receipts.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {t('pages.customerDetail.noPurchaseHistory')}
            </div>
          ) : (
            receipts.map((receipt) => {
              const visibleItems = receipt.items.slice(0, 3);
              const hasMore = receipt.items.length > 3;
              const remainingCount = receipt.items.length - 3;

              return (
                <div
                  key={receipt.id}
                  className="p-6 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleReceiptClick(receipt)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <p className="font-semibold">
                        {t('pages.customerDetail.receipt')} #{receipt.receiptNumber}
                      </p>
                      <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                        {formatDateTime(receipt.createdAt)}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Store className="h-3 w-3" />
                        <span>{receipt.store.name}</span>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {getPaymentMethodLabel(receipt.payments[0]?.method)}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    {visibleItems.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.variant.product.name} × {Number(item.quantity)}
                        </span>
                        <span className="font-medium" suppressHydrationWarning>
                          {formatCurrency(Number(item.total))} {t('currency')}
                        </span>
                      </div>
                    ))}
                    {hasMore && (
                      <div className="text-sm text-muted-foreground">
                        {t('pages.customerDetail.showMore', { count: remainingCount })}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="font-semibold">{t('pages.customerDetail.total')}:</span>
                    <span className="text-lg font-bold" suppressHydrationWarning>
                      {formatCurrency(Number(receipt.total))} {t('currency')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-6 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Показано {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, total)} из {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Страница {currentPage} из {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Receipt Detail Dialog */}
      <ReceiptDetailDialog
        receipt={selectedReceipt}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}
