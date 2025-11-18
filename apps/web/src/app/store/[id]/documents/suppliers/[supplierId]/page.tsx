'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  FileText,
  CreditCard,
  Hash,
  Building,
} from 'lucide-react';
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
  DateRangePicker,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
  type Column,
} from '@jowi/ui';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toast';
import { mockSuppliers, type Supplier } from '@/types/supplier';

// ==================== TYPES ====================

type EntityType = 'safe' | 'cash_register' | 'supplier';
type TransactionType = 'system' | 'user';
type TransactionStatus = 'draft' | 'published' | 'canceled';

interface Transaction {
  id: string;
  datetime: Date;
  purposeName: string;
  sourceType: EntityType;
  sourceId: string;
  sourceName: string;
  recipientType: EntityType;
  recipientId: string;
  recipientName: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
}

interface Accrual {
  id: string;
  datetime: Date;
  purposeName: string;
  sourceType: EntityType;
  sourceId: string;
  sourceName: string;
  recipientType: EntityType;
  recipientId: string;
  recipientName: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
}

interface DateRangeState {
  from: Date;
  to: Date;
}

// ==================== MOCK DATA ====================

// Mock transactions for supplier
const generateMockTransactions = (supplierId: string, supplierName: string): Transaction[] =>
  Array.from({ length: 95 }, (_, i) => ({
    id: String(i + 1),
    datetime: new Date(Date.now() - i * 86400000 * 2),
    purposeName: i % 3 === 0 ? 'Оплата за товар' : i % 3 === 1 ? 'Закупка оборудования' : 'Оплата услуг',
    sourceType: i % 2 === 0 ? 'safe' : 'supplier',
    sourceId: i % 2 === 0 ? '1' : supplierId,
    sourceName: i % 2 === 0 ? 'Основная касса' : supplierName,
    recipientType: i % 2 === 0 ? 'supplier' : 'safe',
    recipientId: i % 2 === 0 ? supplierId : '1',
    recipientName: i % 2 === 0 ? supplierName : 'Основная касса',
    amount: Math.floor(Math.random() * 5000000) + 100000,
    type: i % 4 === 0 ? 'system' : 'user',
    status: i % 3 === 0 ? 'published' : i % 3 === 1 ? 'draft' : 'canceled',
  }));

// Mock accruals for supplier
const generateMockAccruals = (supplierId: string, supplierName: string): Accrual[] =>
  Array.from({ length: 30 }, (_, i) => ({
    id: String(i + 1),
    datetime: new Date(Date.now() - i * 86400000 * 5),
    purposeName: 'Автоматическое начисление',
    sourceType: 'supplier' as EntityType,
    sourceId: supplierId,
    sourceName: supplierName,
    recipientType: 'safe' as EntityType,
    recipientId: '1',
    recipientName: 'Основная касса',
    amount: 1500000,
    type: 'system' as TransactionType,
    status: (i % 3 === 0 ? 'published' : i % 3 === 1 ? 'draft' : 'canceled') as TransactionStatus,
  }));

// ==================== CUSTOM TOGGLE GROUP COMPONENT ====================

interface ToggleGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}

const ToggleGroup: React.FC<ToggleGroupProps> = ({ value, onValueChange, options }) => {
  return (
    <div className="inline-flex items-center rounded-lg border bg-muted p-1 h-10">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onValueChange(option.value)}
          className={cn(
            'px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap',
            value === option.value
              ? 'bg-white dark:bg-slate-950 text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'invoices' | 'transactions' | 'accruals'>('invoices');
  const [dateRange, setDateRange] = useState<DateRangeState>({
    from: new Date(new Date().setHours(0, 0, 0, 0)),
    to: new Date(new Date().setHours(23, 59, 59, 999)),
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const supplierId = params.supplierId as string;
  const storeId = params.id as string;

  // Find supplier by ID
  const supplier = useMemo(() => {
    return mockSuppliers.find((s) => s.id === supplierId);
  }, [supplierId]);

  // Generate mock data for this supplier
  const mockTransactions = useMemo(
    () => (supplier ? generateMockTransactions(supplier.id, supplier.name) : []),
    [supplier]
  );

  const mockAccruals = useMemo(
    () => (supplier ? generateMockAccruals(supplier.id, supplier.name) : []),
    [supplier]
  );

  // Filters for transactions
  const [transactionStatusFilter, setTransactionStatusFilter] = useState<string>('all');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('all');

  // Filters for accruals
  const [accrualStatusFilter, setAccrualStatusFilter] = useState<string>('all');
  const [accrualTypeFilter, setAccrualTypeFilter] = useState<string>('all');

  // ==================== CALCULATIONS ====================

  // Calculate stats for selected date range
  const periodStats = useMemo(() => {
    const filteredTransactions = mockTransactions.filter(
      (t) =>
        t.datetime >= dateRange.from &&
        t.datetime <= dateRange.to &&
        t.status === 'published'
    );

    const income = filteredTransactions
      .filter((t) => t.recipientType === 'supplier' && t.recipientId === supplierId)
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = filteredTransactions
      .filter((t) => t.sourceType === 'supplier' && t.sourceId === supplierId)
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate balance at start and end of period
    const transactionsBeforeStart = mockTransactions.filter(
      (t) => t.datetime < dateRange.from && t.status === 'published'
    );

    const incomeBeforeStart = transactionsBeforeStart
      .filter((t) => t.recipientType === 'supplier' && t.recipientId === supplierId)
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseBeforeStart = transactionsBeforeStart
      .filter((t) => t.sourceType === 'supplier' && t.sourceId === supplierId)
      .reduce((sum, t) => sum + t.amount, 0);

    const balanceAtStart = incomeBeforeStart - expenseBeforeStart;
    const balanceAtEnd = balanceAtStart + income - expense;

    return { income, expense, balanceAtStart, balanceAtEnd };
  }, [dateRange, supplierId, mockTransactions]);

  // ==================== EVENT HANDLERS ====================

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    toast({
      title: t('documents.suppliers.deleteSuccess'),
    });
    router.push(`/store/${storeId}/documents/suppliers`);
    setShowDeleteDialog(false);
  };

  const handleBack = () => {
    router.push(`/store/${storeId}/documents/suppliers`);
  };

  // ==================== FILTERED DATA ====================

  const filteredTransactions = useMemo(() => {
    return mockTransactions.filter((t) => {
      const matchesStatus = transactionStatusFilter === 'all' || t.status === transactionStatusFilter;
      const matchesType = transactionTypeFilter === 'all' || t.type === transactionTypeFilter;
      return matchesStatus && matchesType;
    });
  }, [transactionStatusFilter, transactionTypeFilter, mockTransactions]);

  const filteredAccruals = useMemo(() => {
    return mockAccruals.filter((a) => {
      const matchesStatus = accrualStatusFilter === 'all' || a.status === accrualStatusFilter;
      const matchesType = accrualTypeFilter === 'all' || a.type === accrualTypeFilter;
      return matchesStatus && matchesType;
    });
  }, [accrualStatusFilter, accrualTypeFilter, mockAccruals]);

  // ==================== TABLE COLUMNS ====================

  const transactionColumns: Column<Transaction>[] = [
    {
      key: 'id',
      label: '№',
      render: (item) => mockTransactions.indexOf(item) + 1,
    },
    {
      key: 'datetime',
      label: t('fields.date'),
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-medium">{formatDate(item.datetime)}</div>
          <div className="text-sm text-muted-foreground">
            {item.type === 'system' ? t('finance.transactions.system') : t('finance.transactions.user')}
          </div>
        </div>
      ),
    },
    {
      key: 'purposeName',
      label: t('finance.transactions.purpose'),
      sortable: true,
    },
    {
      key: 'category',
      label: t('finance.transactions.category'),
      render: (item) => {
        const isIncome = item.recipientType === 'supplier' && item.recipientId === supplierId;
        return (
          <Badge variant={isIncome ? 'success' : 'destructive'} className={isIncome ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}>
            {isIncome ? t('finance.transactions.income') : t('finance.transactions.expense')}
          </Badge>
        );
      },
    },
    {
      key: 'amount',
      label: t('fields.amount'),
      sortable: true,
      render: (item) => {
        const isIncome = item.recipientType === 'supplier' && item.recipientId === supplierId;
        return (
          <span className={isIncome ? 'text-green-600' : 'text-red-600'}>
            {isIncome ? '+' : '-'}{item.amount.toLocaleString()} {t('currency')}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: t('fields.status'),
      render: (item) => <StatusBadge type="transaction" status={item.status} t={t} />,
    },
  ];

  const accrualColumns: Column<Accrual>[] = [
    {
      key: 'id',
      label: '№',
      render: (item) => mockAccruals.indexOf(item) + 1,
    },
    {
      key: 'datetime',
      label: t('fields.date'),
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-medium">{formatDate(item.datetime)}</div>
          <div className="text-sm text-muted-foreground">
            {item.type === 'system' ? t('finance.transactions.system') : t('finance.transactions.user')}
          </div>
        </div>
      ),
    },
    {
      key: 'purposeName',
      label: t('finance.accruals.purpose'),
      sortable: true,
    },
    {
      key: 'amount',
      label: t('fields.amount'),
      sortable: true,
      render: (item) => {
        const isIncome = item.recipientType === 'supplier' && item.recipientId === supplierId;
        return (
          <span className={isIncome ? 'text-green-600' : 'text-red-600'}>
            {isIncome ? '+' : '-'}{item.amount.toLocaleString()} {t('currency')}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: t('fields.status'),
      render: (item) => <StatusBadge type="transaction" status={item.status} t={t} />,
    },
  ];

  // ==================== RENDER ====================

  if (!mounted) {
    return null;
  }

  if (!supplier) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-muted-foreground">
            {t('documents.suppliers.emptyMessage')}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button only */}
      <div className="flex items-center">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('actions.backToList')}
        </Button>
      </div>

      {/* Two-column layout: 1/3 left (info + monitoring), 2/3 right (tables) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Supplier Info + Monitoring */}
        <div className="space-y-6">
          {/* Supplier Info Card */}
          <Card className="p-6">
            <div className="space-y-4">
              {/* Supplier Name (without title) */}
              <h2 className="text-2xl font-bold">{supplier.name}</h2>

              {/* Supplier details with icons */}
              <div className="space-y-3">
                {/* Entity Type */}
                <div className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('documents.suppliers.entityType')}
                  </span>
                  <Badge variant={supplier.entityType === 'legal' ? 'default' : 'secondary'}>
                    {t(`documents.suppliers.${supplier.entityType}`)}
                  </Badge>
                </div>

                {/* Phone */}
                {supplier.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground flex-1">
                      {t('documents.suppliers.phone')}
                    </span>
                    <span className="text-sm font-medium text-right">
                      {supplier.phone}
                    </span>
                  </div>
                )}

                {/* Email */}
                {supplier.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground flex-1">
                      {t('documents.suppliers.email')}
                    </span>
                    <span className="text-sm font-medium text-right">
                      {supplier.email}
                    </span>
                  </div>
                )}

                {/* Address */}
                {supplier.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground flex-1">
                      {t('documents.suppliers.address')}
                    </span>
                    <span className="text-sm font-medium text-right">
                      {supplier.address}
                    </span>
                  </div>
                )}

                {/* Current Balance */}
                <div className="flex items-start gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('documents.suppliers.balance')}
                  </span>
                  <span className={cn('text-sm font-medium text-right', supplier.balance >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {supplier.balance >= 0 ? '+' : ''}{supplier.balance.toLocaleString()} {t('currency')}
                  </span>
                </div>
              </div>

              {/* Separator for legal entity data */}
              {supplier.entityType === 'legal' && (
                <>
                  <div className="border-t" />

                  {/* Legal entity details with icons */}
                  <div className="space-y-3">
                    {/* Legal Name */}
                    {supplier.legalName && (
                      <div className="flex items-start gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground flex-1">
                          {t('documents.suppliers.legalName')}
                        </span>
                        <span className="text-sm font-medium text-right">
                          {supplier.legalName}
                        </span>
                      </div>
                    )}

                    {/* INN */}
                    {supplier.inn && (
                      <div className="flex items-start gap-3">
                        <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground flex-1">
                          {t('documents.suppliers.inn')}
                        </span>
                        <span className="text-sm font-medium font-mono text-right">
                          {supplier.inn}
                        </span>
                      </div>
                    )}

                    {/* Bank Account */}
                    {supplier.bankAccount && (
                      <div className="flex items-start gap-3">
                        <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground flex-1">
                          {t('documents.suppliers.bankAccount')}
                        </span>
                        <span className="text-sm font-medium font-mono text-right">
                          {supplier.bankAccount}
                        </span>
                      </div>
                    )}

                    {/* MFO */}
                    {supplier.mfo && (
                      <div className="flex items-start gap-3">
                        <Building className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground flex-1">
                          {t('documents.suppliers.mfo')}
                        </span>
                        <span className="text-sm font-medium font-mono text-right">
                          {supplier.mfo}
                        </span>
                      </div>
                    )}

                    {/* Bank Name */}
                    {supplier.bankName && (
                      <div className="flex items-start gap-3">
                        <Building className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground flex-1">
                          {t('documents.suppliers.bankName')}
                        </span>
                        <span className="text-sm font-medium text-right">
                          {supplier.bankName}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Action buttons */}
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
                  onClick={() => router.push(`/store/${storeId}/documents/suppliers`)}
                  className="h-10 w-10 bg-muted hover:bg-muted/80"
                >
                  <Pencil className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Monitoring Card */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">{t('documents.suppliers.detail.monitoring')}</h2>
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
                  placeholder={t('documents.suppliers.selectDateRange')}
                />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">{t('documents.suppliers.detail.balanceAtStart')}</p>
                  <p className={cn('text-xl font-semibold', periodStats.balanceAtStart >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {periodStats.balanceAtStart >= 0 ? '+' : ''}{periodStats.balanceAtStart.toLocaleString()} {t('currency')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('documents.suppliers.detail.balanceAtEnd')}</p>
                  <p className={cn('text-xl font-semibold', periodStats.balanceAtEnd >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {periodStats.balanceAtEnd >= 0 ? '+' : ''}{periodStats.balanceAtEnd.toLocaleString()} {t('currency')}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">{t('documents.suppliers.detail.incomeForPeriod')}</p>
                  <p className="text-xl font-semibold text-green-600">
                    +{periodStats.income.toLocaleString()} {t('currency')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('documents.suppliers.detail.expenseForPeriod')}</p>
                  <p className="text-xl font-semibold text-red-600">
                    -{periodStats.expense.toLocaleString()} {t('currency')}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column: Tables with Toggle and Filters (spans 2 columns) */}
        <div className="lg:col-span-2">
          <Card className="p-6 pb-0">
            {/* Toggle Group and Filters */}
            <div className="flex items-center gap-4 pb-6">
              <ToggleGroup
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as 'invoices' | 'transactions' | 'accruals')}
                options={[
                  { value: 'invoices', label: t('documents.suppliers.detail.invoicesTab') },
                  { value: 'transactions', label: t('documents.suppliers.detail.transactionsTab') },
                  { value: 'accruals', label: t('documents.suppliers.detail.accrualsTab') },
                ]}
              />

              {/* Filters */}
              <div className="flex-1" />

              {activeTab === 'transactions' ? (
                <>
                  <Select value={transactionStatusFilter} onValueChange={setTransactionStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder={t('finance.transactions.allStatuses')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('finance.transactions.allStatuses')}</SelectItem>
                      <SelectItem value="draft">{t('status.draft')}</SelectItem>
                      <SelectItem value="published">{t('status.published')}</SelectItem>
                      <SelectItem value="canceled">{t('status.canceled')}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder={t('finance.transactions.allTypes')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('finance.transactions.allTypes')}</SelectItem>
                      <SelectItem value="system">{t('finance.transactions.system')}</SelectItem>
                      <SelectItem value="user">{t('finance.transactions.user')}</SelectItem>
                    </SelectContent>
                  </Select>

                  {(transactionStatusFilter !== 'all' || transactionTypeFilter !== 'all') && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setTransactionStatusFilter('all');
                        setTransactionTypeFilter('all');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </>
              ) : activeTab === 'accruals' ? (
                <>
                  <Select value={accrualStatusFilter} onValueChange={setAccrualStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder={t('finance.accruals.allStatuses')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('finance.accruals.allStatuses')}</SelectItem>
                      <SelectItem value="draft">{t('status.draft')}</SelectItem>
                      <SelectItem value="published">{t('status.published')}</SelectItem>
                      <SelectItem value="canceled">{t('status.canceled')}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={accrualTypeFilter} onValueChange={setAccrualTypeFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder={t('finance.accruals.allTypes')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('finance.accruals.allTypes')}</SelectItem>
                      <SelectItem value="system">{t('finance.accruals.system')}</SelectItem>
                      <SelectItem value="user">{t('finance.accruals.user')}</SelectItem>
                    </SelectContent>
                  </Select>

                  {(accrualStatusFilter !== 'all' || accrualTypeFilter !== 'all') && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setAccrualStatusFilter('all');
                        setAccrualTypeFilter('all');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </>
              ) : null}
            </div>
          </Card>

          <Card className="mt-6">
            {activeTab === 'invoices' ? (
              <div className="p-6">
                <p className="text-muted-foreground text-center py-8">
                  {t('documents.suppliers.detail.noInvoices')}
                </p>
              </div>
            ) : activeTab === 'transactions' ? (
              <DataTable
                columns={transactionColumns}
                data={filteredTransactions}
                emptyMessage={t('finance.transactions.emptyMessage')}
                pagination={{ enabled: true, pageSize: 15 }}
              />
            ) : (
              <DataTable
                columns={accrualColumns}
                data={filteredAccruals}
                emptyMessage={t('finance.accruals.emptyMessage')}
                pagination={{ enabled: true, pageSize: 15 }}
              />
            )}
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('actions.delete')}</DialogTitle>
            <DialogDescription>
              {t('documents.suppliers.deleteConfirm')}
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
