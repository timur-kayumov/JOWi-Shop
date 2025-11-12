'use client';

import React, { useState, useMemo } from 'react';
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
} from '@jowi/ui';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ==================== TYPES ====================

type SafeType = 'cash' | 'bank_account' | 'card_account';
type EntityType = 'safe' | 'cash_register' | 'counterparty';
type TransactionType = 'system' | 'user';
type TransactionStatus = 'draft' | 'published' | 'canceled';

interface Safe {
  id: string;
  name: string;
  type: SafeType;
  accountNumber?: string;
  balance: number;
  initialBalance: number;
  isActive: boolean;
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

const editSafeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['cash', 'bank_account', 'card_account']),
  balance: z.number(),
  accountNumber: z.string().optional(),
});

type EditSafeInput = z.infer<typeof editSafeSchema>;

// ==================== MOCK DATA ====================

const mockSafe: Safe = {
  id: '1',
  name: 'Название сейфа',
  type: 'cash',
  accountNumber: undefined,
  balance: 4508544,
  initialBalance: 1000000,
  isActive: true,
  createdAt: new Date('2024-03-19T15:06:00'),
};

const mockTransactions: Transaction[] = Array.from({ length: 183 }, (_, i) => ({
  id: String(i + 1),
  datetime: new Date('2024-03-19T15:06:00'),
  purposeName: 'Оплата за аренду',
  sourceType: i % 2 === 0 ? 'safe' : 'counterparty',
  sourceId: i % 2 === 0 ? '1' : '2',
  sourceName: i % 2 === 0 ? 'Название сейфа' : 'Контрагент А',
  recipientType: i % 2 === 0 ? 'counterparty' : 'safe',
  recipientId: i % 2 === 0 ? '2' : '1',
  recipientName: i % 2 === 0 ? 'Контрагент А' : 'Название сейфа',
  amount: 4508544,
  type: i % 3 === 0 ? 'system' : 'user',
  status: i % 3 === 0 ? 'published' : i % 3 === 1 ? 'draft' : 'canceled',
}));

const mockAccruals: Accrual[] = Array.from({ length: 50 }, (_, i) => ({
  id: String(i + 1),
  datetime: new Date('2024-03-19T15:06:00'),
  purposeName: 'Начисление процентов',
  sourceType: i % 2 === 0 ? 'safe' : 'counterparty',
  sourceId: i % 2 === 0 ? '1' : '2',
  sourceName: i % 2 === 0 ? 'Название сейфа' : 'Контрагент Б',
  recipientType: i % 2 === 0 ? 'counterparty' : 'safe',
  recipientId: i % 2 === 0 ? '2' : '1',
  recipientName: i % 2 === 0 ? 'Контрагент Б' : 'Название сейфа',
  amount: 22203323,
  type: i % 3 === 0 ? 'system' : 'user',
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

export default function SafeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'accruals'>('transactions');
  const [dateRange, setDateRange] = useState<DateRangeState>({
    from: new Date(new Date().setHours(0, 0, 0, 0)),
    to: new Date(new Date().setHours(23, 59, 59, 999)),
  });

  const safe = mockSafe;
  const safeId = params.safeId as string;
  const storeId = params.id as string;

  const editForm = useForm<EditSafeInput>({
    resolver: zodResolver(editSafeSchema),
    defaultValues: {
      name: safe.name,
      type: safe.type,
      balance: safe.balance,
      accountNumber: safe.accountNumber,
    },
  });

  // Filters for transactions
  const [transactionStatusFilter, setTransactionStatusFilter] = useState<string>('all');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('all');

  // Filters for accruals
  const [accrualStatusFilter, setAccrualStatusFilter] = useState<string>('all');
  const [accrualTypeFilter, setAccrualTypeFilter] = useState<string>('all');

  // ==================== CALCULATIONS ====================

  // Calculate today's income and expense
  const todayStats = useMemo(() => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todayTransactions = mockTransactions.filter(
      (t) =>
        t.datetime >= startOfDay &&
        t.datetime <= endOfDay &&
        t.status === 'published'
    );

    const income = todayTransactions
      .filter((t) => t.recipientType === 'safe' && t.recipientId === safeId)
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = todayTransactions
      .filter((t) => t.sourceType === 'safe' && t.sourceId === safeId)
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expense };
  }, [safeId]);

  // Calculate stats for selected date range
  const periodStats = useMemo(() => {
    const filteredTransactions = mockTransactions.filter(
      (t) =>
        t.datetime >= dateRange.from &&
        t.datetime <= dateRange.to &&
        t.status === 'published'
    );

    const income = filteredTransactions
      .filter((t) => t.recipientType === 'safe' && t.recipientId === safeId)
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = filteredTransactions
      .filter((t) => t.sourceType === 'safe' && t.sourceId === safeId)
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate balance at start and end of period
    const transactionsBeforeStart = mockTransactions.filter(
      (t) => t.datetime < dateRange.from && t.status === 'published'
    );

    const incomeBeforeStart = transactionsBeforeStart
      .filter((t) => t.recipientType === 'safe' && t.recipientId === safeId)
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseBeforeStart = transactionsBeforeStart
      .filter((t) => t.sourceType === 'safe' && t.sourceId === safeId)
      .reduce((sum, t) => sum + t.amount, 0);

    const balanceAtStart = safe.initialBalance + incomeBeforeStart - expenseBeforeStart;
    const balanceAtEnd = balanceAtStart + income - expense;

    return { income, expense, balanceAtStart, balanceAtEnd };
  }, [dateRange, safeId, safe.initialBalance]);

  // ==================== EVENT HANDLERS ====================

  const handleEdit = () => {
    editForm.reset({
      name: safe.name,
      type: safe.type,
      balance: safe.balance,
      accountNumber: safe.accountNumber,
    });
    setShowEditDialog(true);
  };

  const handleEditSubmit = (data: EditSafeInput) => {
    // TODO: Replace with actual API call
    console.log('Edit safe:', data);
    toast.success(t('finance.safes.editSuccess'));
    setShowEditDialog(false);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    toast.success(t('messages.deleteSuccess'));
    router.push(`/store/${storeId}/finance/safes`);
    setShowDeleteDialog(false);
  };

  const handleBack = () => {
    router.push(`/store/${storeId}/finance/safes`);
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
        const isIncome = item.recipientType === 'safe' && item.recipientId === safeId;
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
        const isIncome = item.recipientType === 'safe' && item.recipientId === safeId;
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
        const isIncome = item.recipientType === 'safe' && item.recipientId === safeId;
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
        {/* Left column: Safe Info + Monitoring */}
        <div className="space-y-6">
          {/* Safe Details Card - Combined Info and Balance */}
          <Card className="p-6">
            <div className="space-y-4">
              {/* Safe Name as first field (larger text) */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('finance.safes.safeName')}</p>
                <h2 className="text-2xl font-bold">{safe.name}</h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('finance.safes.safeType')}</p>
                  <p className="text-sm font-medium">{t(`finance.safes.${safe.type}`)}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('finance.safes.initialBalance')}</p>
                  <p className="text-sm font-medium">
                    {safe.initialBalance.toLocaleString()} {t('currency')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('status.label')}</p>
                  <Badge variant={safe.isActive ? 'success' : 'destructive'}>
                    {safe.isActive ? t('status.active') : t('status.inactive')}
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

          {/* Balance Today Card */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('finance.safes.currentBalance')}</p>
                <p className="text-3xl font-bold">{safe.balance.toLocaleString()} {t('currency')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('finance.safes.incomeToday')}</p>
                  <p className="text-xl font-semibold text-green-600">
                    +{todayStats.income.toLocaleString()} {t('currency')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('finance.safes.expenseToday')}</p>
                  <p className="text-xl font-semibold text-red-600">
                    -{todayStats.expense.toLocaleString()} {t('currency')}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Monitoring Card */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">{t('finance.safes.monitoring')}</h2>
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
                  <p className="text-sm text-muted-foreground">{t('finance.safes.balanceAtStart')}</p>
                  <p className="text-xl font-semibold">
                    {periodStats.balanceAtStart.toLocaleString()} {t('currency')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('finance.safes.balanceAtEnd')}</p>
                  <p className="text-xl font-semibold">
                    {periodStats.balanceAtEnd.toLocaleString()} {t('currency')}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">{t('finance.safes.incomeForPeriod')}</p>
                  <p className="text-xl font-semibold text-green-600">
                    +{periodStats.income.toLocaleString()} {t('currency')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('finance.safes.expenseForPeriod')}</p>
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
                  { value: 'transactions', label: t('finance.safes.transactionsTab') },
                  { value: 'accruals', label: t('finance.safes.accrualsTab') },
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
            <DialogTitle>{t('finance.safes.editSafe')}</DialogTitle>
            <DialogDescription>{t('finance.safes.editSafeDescription')}</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('finance.safes.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('finance.safes.namePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('finance.safes.safeType')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">{t('finance.safes.cash')}</SelectItem>
                        <SelectItem value="bank_account">{t('finance.safes.bankAccount')}</SelectItem>
                        <SelectItem value="card_account">{t('finance.safes.cardAccount')}</SelectItem>
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
                    <FormLabel>{t('finance.safes.balance')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(editForm.watch('type') === 'bank_account' || editForm.watch('type') === 'card_account') && (
                <FormField
                  control={editForm.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('finance.safes.accountNumber')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('finance.safes.accountNumberPlaceholder')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
            <DialogTitle>{t('finance.safes.delete')}</DialogTitle>
            <DialogDescription>{t('finance.safes.deleteSafeConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t('actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t('finance.safes.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
