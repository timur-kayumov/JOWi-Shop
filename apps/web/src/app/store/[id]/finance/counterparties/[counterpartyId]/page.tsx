'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Calendar, X } from 'lucide-react';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  DatePicker,
  Switch,
} from '@jowi/ui';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ==================== TYPES ====================

type CounterpartyType = 'system' | 'custom';
type AutoChargeStatus = 'enabled' | 'disabled';
type PeriodUnit = 'days' | 'months';
type EntityType = 'safe' | 'cash_register' | 'counterparty';
type TransactionType = 'system' | 'user';
type TransactionStatus = 'draft' | 'published' | 'canceled';

interface Counterparty {
  id: string;
  name: string;
  type: CounterpartyType;
  balance: number;
  isActive: boolean;
  autoChargeStatus: AutoChargeStatus;
  autoChargePeriod?: number;
  autoChargePeriodUnit?: PeriodUnit;
  autoChargeAmount?: number;
  autoChargeStartDate?: Date;
  autoChargeStartTime?: string;
  createdAt: Date;
}

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

// ==================== VALIDATION SCHEMA ====================

const editCounterpartySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['system', 'custom']),
  balance: z.number(),
  autoChargeStatus: z.enum(['enabled', 'disabled']),
  autoChargePeriod: z.number().optional(),
  autoChargePeriodUnit: z.enum(['days', 'months']).optional(),
  autoChargeAmount: z.number().optional(),
  autoChargeStartDate: z.date().optional(),
  autoChargeStartTime: z.string().optional(),
});

type EditCounterpartyInput = z.infer<typeof editCounterpartySchema>;

// ==================== MOCK DATA ====================

const mockCounterparty: Counterparty = {
  id: '1',
  name: 'ООО "Поставщик продуктов"',
  type: 'custom',
  balance: -2500000,
  isActive: true,
  autoChargeStatus: 'enabled',
  autoChargePeriod: 30,
  autoChargePeriodUnit: 'days',
  autoChargeAmount: 1500000,
  autoChargeStartDate: new Date('2024-01-01T09:00:00'),
  autoChargeStartTime: '09:00',
  createdAt: new Date('2024-01-01T00:00:00'),
};

const mockTransactions: Transaction[] = Array.from({ length: 95 }, (_, i) => ({
  id: String(i + 1),
  datetime: new Date(Date.now() - i * 86400000 * 2),
  purposeName: i % 3 === 0 ? 'Оплата за товар' : i % 3 === 1 ? 'Закупка оборудования' : 'Оплата услуг',
  sourceType: i % 2 === 0 ? 'safe' : 'counterparty',
  sourceId: i % 2 === 0 ? '1' : mockCounterparty.id,
  sourceName: i % 2 === 0 ? 'Основная касса' : mockCounterparty.name,
  recipientType: i % 2 === 0 ? 'counterparty' : 'safe',
  recipientId: i % 2 === 0 ? mockCounterparty.id : '1',
  recipientName: i % 2 === 0 ? mockCounterparty.name : 'Основная касса',
  amount: Math.floor(Math.random() * 5000000) + 100000,
  type: i % 4 === 0 ? 'system' : 'user',
  status: i % 3 === 0 ? 'published' : i % 3 === 1 ? 'draft' : 'canceled',
}));

const mockAccruals: Accrual[] = Array.from({ length: 30 }, (_, i) => ({
  id: String(i + 1),
  datetime: new Date(Date.now() - i * 86400000 * 5),
  purposeName: 'Автоматическое начисление',
  sourceType: 'counterparty',
  sourceId: mockCounterparty.id,
  sourceName: mockCounterparty.name,
  recipientType: 'safe',
  recipientId: '1',
  recipientName: 'Основная касса',
  amount: 1500000,
  type: 'system',
  status: i % 3 === 0 ? 'published' : i % 3 === 1 ? 'draft' : 'canceled',
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

export default function CounterpartyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'accruals'>('transactions');
  const [dateRange, setDateRange] = useState<DateRangeState>({
    from: new Date(new Date().setHours(0, 0, 0, 0)),
    to: new Date(new Date().setHours(23, 59, 59, 999)),
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const counterparty = mockCounterparty;
  const counterpartyId = params.counterpartyId as string;
  const storeId = params.id as string;

  const editForm = useForm<EditCounterpartyInput>({
    resolver: zodResolver(editCounterpartySchema),
    defaultValues: {
      name: counterparty.name,
      type: counterparty.type,
      balance: counterparty.balance,
      autoChargeStatus: counterparty.autoChargeStatus,
      autoChargePeriod: counterparty.autoChargePeriod,
      autoChargePeriodUnit: counterparty.autoChargePeriodUnit,
      autoChargeAmount: counterparty.autoChargeAmount,
      autoChargeStartDate: counterparty.autoChargeStartDate,
      autoChargeStartTime: counterparty.autoChargeStartTime,
    },
  });

  // Filters for transactions
  const [transactionStatusFilter, setTransactionStatusFilter] = useState<string>('all');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('all');

  // Filters for accruals
  const [accrualStatusFilter, setAccrualStatusFilter] = useState<string>('all');
  const [accrualTypeFilter, setAccrualTypeFilter] = useState<string>('all');

  // ==================== CALCULATIONS ====================

  // Calculate next accrual date
  const nextAccrualDate = useMemo(() => {
    if (
      counterparty.autoChargeStatus === 'disabled' ||
      !counterparty.autoChargeStartDate ||
      !counterparty.autoChargePeriod ||
      !counterparty.autoChargePeriodUnit
    ) {
      return null;
    }

    const now = new Date();
    const startDate = new Date(counterparty.autoChargeStartDate);

    // Calculate how many periods have passed since start date
    const periodInMs =
      counterparty.autoChargePeriodUnit === 'days'
        ? counterparty.autoChargePeriod * 24 * 60 * 60 * 1000
        : counterparty.autoChargePeriod * 30 * 24 * 60 * 60 * 1000;

    const msSinceStart = now.getTime() - startDate.getTime();
    const periodsPassed = Math.floor(msSinceStart / periodInMs);

    // Next accrual is after the current period ends
    return new Date(startDate.getTime() + (periodsPassed + 1) * periodInMs);
  }, [counterparty]);

  // Calculate stats for selected date range
  const periodStats = useMemo(() => {
    const filteredTransactions = mockTransactions.filter(
      (t) =>
        t.datetime >= dateRange.from &&
        t.datetime <= dateRange.to &&
        t.status === 'published'
    );

    const income = filteredTransactions
      .filter((t) => t.recipientType === 'counterparty' && t.recipientId === counterpartyId)
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = filteredTransactions
      .filter((t) => t.sourceType === 'counterparty' && t.sourceId === counterpartyId)
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate balance at start and end of period
    const transactionsBeforeStart = mockTransactions.filter(
      (t) => t.datetime < dateRange.from && t.status === 'published'
    );

    const incomeBeforeStart = transactionsBeforeStart
      .filter((t) => t.recipientType === 'counterparty' && t.recipientId === counterpartyId)
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseBeforeStart = transactionsBeforeStart
      .filter((t) => t.sourceType === 'counterparty' && t.sourceId === counterpartyId)
      .reduce((sum, t) => sum + t.amount, 0);

    const balanceAtStart = incomeBeforeStart - expenseBeforeStart;
    const balanceAtEnd = balanceAtStart + income - expense;

    return { income, expense, balanceAtStart, balanceAtEnd };
  }, [dateRange, counterpartyId]);

  // ==================== EVENT HANDLERS ====================

  const handleEdit = () => {
    editForm.reset({
      name: counterparty.name,
      type: counterparty.type,
      balance: counterparty.balance,
      autoChargeStatus: counterparty.autoChargeStatus,
      autoChargePeriod: counterparty.autoChargePeriod,
      autoChargePeriodUnit: counterparty.autoChargePeriodUnit,
      autoChargeAmount: counterparty.autoChargeAmount,
      autoChargeStartDate: counterparty.autoChargeStartDate,
      autoChargeStartTime: counterparty.autoChargeStartTime,
    });
    setShowEditDialog(true);
  };

  const handleEditSubmit = (data: EditCounterpartyInput) => {
    // TODO: Replace with actual API call
    console.log('Edit counterparty:', data);
    toast.success(t('finance.counterparties.editSuccess'));
    setShowEditDialog(false);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    toast.success(t('messages.deleteSuccess'));
    router.push(`/store/${storeId}/finance/counterparties`);
    setShowDeleteDialog(false);
  };

  const handleBack = () => {
    router.push(`/store/${storeId}/finance/counterparties`);
  };

  // ==================== FILTERED DATA ====================

  const filteredTransactions = useMemo(() => {
    return mockTransactions.filter((t) => {
      const matchesStatus = transactionStatusFilter === 'all' || t.status === transactionStatusFilter;
      const matchesType = transactionTypeFilter === 'all' || t.type === transactionTypeFilter;
      return matchesStatus && matchesType;
    });
  }, [transactionStatusFilter, transactionTypeFilter]);

  const filteredAccruals = useMemo(() => {
    return mockAccruals.filter((a) => {
      const matchesStatus = accrualStatusFilter === 'all' || a.status === accrualStatusFilter;
      const matchesType = accrualTypeFilter === 'all' || a.type === accrualTypeFilter;
      return matchesStatus && matchesType;
    });
  }, [accrualStatusFilter, accrualTypeFilter]);

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
        const isIncome = item.recipientType === 'counterparty' && item.recipientId === counterpartyId;
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
        const isIncome = item.recipientType === 'counterparty' && item.recipientId === counterpartyId;
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
        const isIncome = item.recipientType === 'counterparty' && item.recipientId === counterpartyId;
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

  return (
    <div className="space-y-6">
      {/* Header with back button only */}
      <div className="flex items-center">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('actions.backToList')}
        </Button>
      </div>

      {/* Two-column layout: 1/3 left (info + auto-accrual + monitoring), 2/3 right (tables) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Counterparty Info + Auto-accrual Settings + Monitoring */}
        <div className="space-y-6">
          {/* Counterparty Details Card */}
          <Card className="p-6">
            <div className="space-y-4">
              {/* Counterparty Name as first field (larger text) */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('finance.counterparties.name')}</p>
                <h2 className="text-2xl font-bold">{counterparty.name}</h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('finance.counterparties.type')}</p>
                  <Badge variant={counterparty.type === 'system' ? 'secondary' : 'default'}>
                    {t(`finance.counterparties.${counterparty.type}`)}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('finance.counterparties.detail.currentBalance')}</p>
                  <p className={cn('text-2xl font-bold', counterparty.balance >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {counterparty.balance >= 0 ? '+' : ''}{counterparty.balance.toLocaleString()} {t('currency')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('status.label')}</p>
                  <Badge variant={counterparty.isActive ? 'success' : 'destructive'}>
                    {counterparty.isActive ? t('status.active') : t('status.inactive')}
                  </Badge>
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

          {/* Auto-accrual Settings Card */}
          {counterparty.autoChargeStatus === 'enabled' && (
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">{t('finance.counterparties.detail.autoAccrualSettings')}</h2>
                  <Badge variant="success" className="mt-2">
                    {t('finance.counterparties.detail.autoAccrualEnabled')}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('finance.counterparties.period')}</p>
                    <p className="text-lg font-medium">
                      {counterparty.autoChargePeriod} {t(`finance.counterparties.${counterparty.autoChargePeriodUnit}`)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">{t('finance.counterparties.autoChargeAmount')}</p>
                    <p className="text-lg font-medium">
                      {counterparty.autoChargeAmount?.toLocaleString()} {t('currency')}
                    </p>
                  </div>

                  {nextAccrualDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t('finance.counterparties.detail.nextAccrual')}</p>
                      <p className="text-lg font-medium">{formatDate(nextAccrualDate)}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Monitoring Card */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">{t('finance.counterparties.detail.monitoring')}</h2>
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
                  placeholder={t('finance.safes.selectDateRange')}
                />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">{t('finance.counterparties.detail.balanceAtStart')}</p>
                  <p className={cn('text-xl font-semibold', periodStats.balanceAtStart >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {periodStats.balanceAtStart >= 0 ? '+' : ''}{periodStats.balanceAtStart.toLocaleString()} {t('currency')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('finance.counterparties.detail.balanceAtEnd')}</p>
                  <p className={cn('text-xl font-semibold', periodStats.balanceAtEnd >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {periodStats.balanceAtEnd >= 0 ? '+' : ''}{periodStats.balanceAtEnd.toLocaleString()} {t('currency')}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">{t('finance.counterparties.detail.incomeForPeriod')}</p>
                  <p className="text-xl font-semibold text-green-600">
                    +{periodStats.income.toLocaleString()} {t('currency')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('finance.counterparties.detail.expenseForPeriod')}</p>
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
                onValueChange={(value) => setActiveTab(value as 'transactions' | 'accruals')}
                options={[
                  { value: 'transactions', label: t('finance.counterparties.detail.transactionsTab') },
                  { value: 'accruals', label: t('finance.counterparties.detail.accrualsTab') },
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
              ) : (
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
              )}
            </div>
          </Card>

          <Card className="mt-6">
            {activeTab === 'transactions' ? (
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('finance.counterparties.editCounterparty')}</DialogTitle>
            <DialogDescription>
              {t('finance.counterparties.editCounterpartyDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('finance.counterparties.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('finance.counterparties.namePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('finance.counterparties.type')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="custom">{t('finance.counterparties.custom')}</SelectItem>
                          <SelectItem value="system">{t('finance.counterparties.system')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('finance.counterparties.balance')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Auto-charge section */}
              <FormField
                control={editForm.control}
                name="autoChargeStatus"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t('finance.counterparties.autoCharge')}
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 'enabled'}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? 'enabled' : 'disabled')
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Conditional auto-charge fields */}
              {editForm.watch('autoChargeStatus') === 'enabled' && (
                <div className="space-y-4 rounded-lg border p-4">
                  {/* Period fields */}
                  <FormField
                    control={editForm.control}
                    name="autoChargePeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('finance.counterparties.periodValue')}</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="365"
                              placeholder="7"
                              className="flex-1"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormField
                            control={editForm.control}
                            name="autoChargePeriodUnit"
                            render={({ field: unitField }) => (
                              <Select onValueChange={unitField.onChange} value={unitField.value}>
                                <FormControl>
                                  <SelectTrigger className="w-auto">
                                    <SelectValue placeholder={t('finance.counterparties.selectUnit')} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="days">{t('finance.counterparties.days')}</SelectItem>
                                  <SelectItem value="months">{t('finance.counterparties.months')}</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Amount field */}
                  <FormField
                    control={editForm.control}
                    name="autoChargeAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('finance.counterparties.autoChargeAmount')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date and time fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="autoChargeStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('finance.counterparties.autoChargeStartDate')}</FormLabel>
                          <FormControl>
                            <DatePicker
                              date={field.value}
                              onDateChange={field.onChange}
                              placeholder={t('finance.counterparties.startDatePlaceholder')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="autoChargeStartTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('finance.counterparties.autoChargeStartTime')}</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              placeholder={t('finance.counterparties.startTimePlaceholder')}
                              value={field.value ?? ''}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

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
            <DialogTitle>{t('actions.delete')}</DialogTitle>
            <DialogDescription>
              {t('finance.counterparties.detail.deleteCounterpartyConfirm', { name: counterparty.name })}
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
