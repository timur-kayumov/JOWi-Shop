'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  DataTable,
  Badge,
  Button,
  DateRangePicker,
} from '@jowi/ui';
import {
  Receipt,
  DollarSign,
  Tag,
  TrendingUp,
  Search,
  X,
} from 'lucide-react';
import type { DateRange } from 'react-day-picker';

// Mock data types
interface MockReceipt {
  id: string;
  receiptNumber: string;
  createdAt: Date;
  employee: {
    firstName: string;
    lastName: string;
  };
  customer: {
    firstName: string;
    lastName: string;
  } | null;
  discount: {
    amount: number;
    percentage: number;
  };
  total: number;
  status: 'draft' | 'completed' | 'refunded';
  paymentMethod: 'cash' | 'card' | 'transfer' | 'installment';
}

// Mock data
const mockReceipts: MockReceipt[] = [
  {
    id: '1',
    receiptNumber: 'R-10001',
    createdAt: new Date('2025-11-03T10:30:00'),
    employee: { firstName: 'Азиз', lastName: 'Каримов' },
    customer: { firstName: 'Алишер', lastName: 'Усманов' },
    discount: { amount: 50000, percentage: 10 },
    total: 450000,
    status: 'completed',
    paymentMethod: 'cash',
  },
  {
    id: '2',
    receiptNumber: 'R-10002',
    createdAt: new Date('2025-11-03T11:15:00'),
    employee: { firstName: 'Нигора', lastName: 'Усманова' },
    customer: null,
    discount: { amount: 0, percentage: 0 },
    total: 250000,
    status: 'completed',
    paymentMethod: 'card',
  },
  {
    id: '3',
    receiptNumber: 'R-10003',
    createdAt: new Date('2025-11-03T12:00:00'),
    employee: { firstName: 'Азиз', lastName: 'Каримов' },
    customer: { firstName: 'Дилноза', lastName: 'Рахимова' },
    discount: { amount: 100000, percentage: 15 },
    total: 566667,
    status: 'completed',
    paymentMethod: 'transfer',
  },
  {
    id: '4',
    receiptNumber: 'R-10004',
    createdAt: new Date('2025-11-03T13:45:00'),
    employee: { firstName: 'Нигора', lastName: 'Усманова' },
    customer: null,
    discount: { amount: 0, percentage: 0 },
    total: 180000,
    status: 'refunded',
    paymentMethod: 'cash',
  },
  {
    id: '5',
    receiptNumber: 'R-10005',
    createdAt: new Date('2025-11-03T14:20:00'),
    employee: { firstName: 'Азиз', lastName: 'Каримов' },
    customer: { firstName: 'Фарход', lastName: 'Салимов' },
    discount: { amount: 75000, percentage: 12 },
    total: 625000,
    status: 'completed',
    paymentMethod: 'installment',
  },
];

const mockEmployees = [
  { id: '1', name: 'Азиз Каримов' },
  { id: '2', name: 'Нигора Усманова' },
];

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' сўм';
}

// Format date
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function StoreReceiptsPage() {
  const { t } = useTranslation('common');
  const params = useParams();
  const router = useRouter();
  const storeId = params?.id as string;

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery !== '' ||
      selectedStatus !== 'all' ||
      selectedEmployee !== 'all' ||
      dateRange?.from !== undefined
    );
  }, [searchQuery, selectedStatus, selectedEmployee, dateRange]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedEmployee('all');
    setDateRange(undefined);
  };

  // Filtered receipts
  const filteredReceipts = useMemo(() => {
    return mockReceipts.filter((receipt) => {
      // Search filter
      if (
        searchQuery &&
        !receipt.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && receipt.status !== selectedStatus) {
        return false;
      }

      // Employee filter
      if (selectedEmployee !== 'all') {
        const employeeName = `${receipt.employee.firstName} ${receipt.employee.lastName}`;
        if (!employeeName.includes(selectedEmployee)) {
          return false;
        }
      }

      // Date range filter
      if (dateRange?.from) {
        const receiptDate = receipt.createdAt;
        if (dateRange.to) {
          if (receiptDate < dateRange.from || receiptDate > dateRange.to) {
            return false;
          }
        } else {
          if (receiptDate < dateRange.from) {
            return false;
          }
        }
      }

      return true;
    });
  }, [searchQuery, selectedStatus, selectedEmployee, dateRange]);

  // Statistics - based on filtered receipts
  const stats = useMemo(() => {
    const totalReceipts = filteredReceipts.filter(
      (r) => r.status === 'completed'
    ).length;
    const totalAmount = filteredReceipts
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + r.total, 0);
    const totalDiscount = filteredReceipts
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + r.discount.amount, 0);

    // Top employee
    const employeeSales: Record<string, number> = {};
    filteredReceipts
      .filter((r) => r.status === 'completed')
      .forEach((r) => {
        const name = `${r.employee.firstName} ${r.employee.lastName}`;
        employeeSales[name] = (employeeSales[name] || 0) + r.total;
      });
    const topEmployee = Object.entries(employeeSales).sort(
      ([, a], [, b]) => b - a
    )[0];

    return {
      totalReceipts,
      totalAmount,
      totalDiscount,
      topEmployee: topEmployee ? topEmployee[0] : '-',
    };
  }, [filteredReceipts]);

  // Table columns
  const columns = [
    {
      key: 'receiptNumber',
      label: t('pages.receipts.fields.receiptNumber'),
      sortable: true,
      render: (receipt: MockReceipt) => (
        <span className="font-medium">{receipt.receiptNumber}</span>
      ),
    },
    {
      key: 'createdAt',
      label: t('pages.receipts.fields.date'),
      sortable: true,
      render: (receipt: MockReceipt) => (
        <span className="text-muted-foreground">
          {formatDate(receipt.createdAt)}
        </span>
      ),
    },
    {
      key: 'employee',
      label: t('pages.receipts.fields.employee'),
      render: (receipt: MockReceipt) => (
        <span>
          {receipt.employee.firstName} {receipt.employee.lastName}
        </span>
      ),
    },
    {
      key: 'customer',
      label: t('pages.receipts.fields.customer'),
      render: (receipt: MockReceipt) => (
        <span>
          {receipt.customer
            ? `${receipt.customer.firstName} ${receipt.customer.lastName}`
            : t('pages.receipts.fields.noCustomer')}
        </span>
      ),
    },
    {
      key: 'discount',
      label: t('pages.receipts.fields.discount'),
      render: (receipt: MockReceipt) => (
        <span>
          {formatCurrency(receipt.discount.amount)} ({receipt.discount.percentage}%)
        </span>
      ),
    },
    {
      key: 'total',
      label: t('pages.receipts.fields.amount'),
      sortable: true,
      render: (receipt: MockReceipt) => (
        <span className="font-semibold">{formatCurrency(receipt.total)}</span>
      ),
    },
    {
      key: 'status',
      label: t('pages.receipts.fields.status'),
      render: (receipt: MockReceipt) => {
        const variantMap = {
          draft: 'warning' as const,
          completed: 'success' as const,
          refunded: 'destructive' as const,
        };
        return (
          <Badge variant={variantMap[receipt.status]}>
            {t(`pages.receipts.statuses.${receipt.status}`)}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Card with Search and Filters */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('pages.receipts.title')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('pages.receipts.description')}
            </p>
          </div>
        </div>

        {/* Search and Filters on one line */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('pages.receipts.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              placeholder={t('pages.receipts.filters.dateRange')}
              className="w-full sm:w-[200px]"
            />

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={t('pages.receipts.filters.allStatuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('pages.receipts.filters.allStatuses')}
                </SelectItem>
                <SelectItem value="draft">
                  {t('pages.receipts.statuses.draft')}
                </SelectItem>
                <SelectItem value="completed">
                  {t('pages.receipts.statuses.completed')}
                </SelectItem>
                <SelectItem value="refunded">
                  {t('pages.receipts.statuses.refunded')}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={t('pages.receipts.filters.allEmployees')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('pages.receipts.filters.allEmployees')}
                </SelectItem>
                {mockEmployees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.name}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="icon"
                onClick={resetFilters}
                className="h-10 w-10 shrink-0"
                title={t('pages.customers.resetFilters')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Statistics Cards - Below header */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('pages.receipts.statistics.totalReceipts')}
              </p>
              <p className="text-2xl font-bold">{stats.totalReceipts}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Receipt className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('pages.receipts.statistics.totalAmount')}
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.totalAmount)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('pages.receipts.statistics.totalDiscount')}
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.totalDiscount)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Tag className="h-6 w-6 text-orange-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('pages.receipts.statistics.topEmployee')}
              </p>
              <p className="text-2xl font-bold truncate">{stats.topEmployee}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Table Card */}
      <Card>
        <DataTable
          columns={columns}
          data={filteredReceipts}
          emptyMessage={t('pages.receipts.noReceipts')}
          onRowClick={(receipt) => router.push(`/store/${storeId}/orders/${receipt.id}`)}
        />
      </Card>
    </div>
  );
}
