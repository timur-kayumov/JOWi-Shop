'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Search, ChevronRight, TrendingUp, DollarSign, Activity } from 'lucide-react';
import {
  Button,
  Input,
  Badge,
  StatusBadge,
  DataTable,
  Column,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  DateRangePicker,
  formatDate,
  cn,
} from '@jowi/ui';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';
import { type DateRange } from 'react-day-picker';

// ==================== TYPES ====================

type EntityType = 'safe' | 'cash_register' | 'counterparty';
type TransactionType = 'system' | 'user';
type TransactionStatus = 'draft' | 'published' | 'canceled';

interface EntityReference {
  type: EntityType;
  id: string;
  name: string;
}

interface Transaction {
  id: string;
  datetime: Date;
  purposeId: string;
  purposeName: string;
  source: EntityReference;
  recipient: EntityReference;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
}

interface Purpose {
  id: string;
  name: string;
}

interface Safe {
  id: string;
  name: string;
  type: 'cash' | 'bank_account' | 'card_account';
}

interface CashRegister {
  id: string;
  name: string;
}

interface Counterparty {
  id: string;
  name: string;
  type: 'supplier' | 'buyer';
}

// ==================== VALIDATION SCHEMAS ====================

const transactionSchema = z.object({
  datetime: z.date({ required_error: 'Select date and time' }),
  purposeId: z.string().min(1, 'Select purpose'),
  sourceType: z.enum(['safe', 'cash_register', 'counterparty']),
  sourceId: z.string().min(1, 'Select source'),
  recipientType: z.enum(['safe', 'cash_register', 'counterparty']),
  recipientId: z.string().min(1, 'Select recipient'),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  type: z.enum(['system', 'user']),
  status: z.enum(['draft', 'published', 'canceled']),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

// ==================== MOCK DATA ====================

const mockPurposes: Purpose[] = [
  { id: '1', name: 'Закупка товара' },
  { id: '2', name: 'Продажа товара' },
  { id: '3', name: 'Зарплата сотрудникам' },
  { id: '4', name: 'Оплата аренды' },
  { id: '5', name: 'Коммунальные платежи' },
];

const mockSafes: Safe[] = [
  { id: '1', name: 'Основная касса', type: 'cash' },
  { id: '2', name: 'Расчетный счет', type: 'bank_account' },
  { id: '3', name: 'Корпоративная карта', type: 'card_account' },
];

const mockCashRegisters: CashRegister[] = [
  { id: '1', name: 'Касса №1 (Зал)' },
  { id: '2', name: 'Касса №2 (Склад)' },
];

const mockCounterparties: Counterparty[] = [
  { id: '1', name: 'ООО "Поставщик 1"', type: 'supplier' },
  { id: '2', name: 'ООО "Поставщик 2"', type: 'supplier' },
  { id: '3', name: 'ИП Иванов', type: 'buyer' },
];

const mockTransactions: Transaction[] = [
  {
    id: '1',
    datetime: new Date('2025-11-10T10:30:00'),
    purposeId: '1',
    purposeName: 'Закупка товара',
    source: { type: 'safe', id: '2', name: 'Расчетный счет' },
    recipient: { type: 'counterparty', id: '1', name: 'ООО "Поставщик 1"' },
    amount: 5000000,
    type: 'user',
    status: 'published',
  },
  {
    id: '2',
    datetime: new Date('2025-11-10T09:15:00'),
    purposeId: '2',
    purposeName: 'Продажа товара',
    source: { type: 'counterparty', id: '3', name: 'ИП Иванов' },
    recipient: { type: 'cash_register', id: '1', name: 'Касса №1 (Зал)' },
    amount: 1250000,
    type: 'system',
    status: 'published',
  },
  {
    id: '3',
    datetime: new Date('2025-11-09T14:45:00'),
    purposeId: '3',
    purposeName: 'Зарплата сотрудникам',
    source: { type: 'safe', id: '2', name: 'Расчетный счет' },
    recipient: { type: 'counterparty', id: '3', name: 'ИП Иванов' },
    amount: 8000000,
    type: 'user',
    status: 'published',
  },
  {
    id: '4',
    datetime: new Date('2025-11-09T11:20:00'),
    purposeId: '4',
    purposeName: 'Оплата аренды',
    source: { type: 'safe', id: '1', name: 'Основная касса' },
    recipient: { type: 'counterparty', id: '2', name: 'ООО "Поставщик 2"' },
    amount: 3000000,
    type: 'user',
    status: 'published',
  },
  {
    id: '5',
    datetime: new Date('2025-11-08T16:00:00'),
    purposeId: '5',
    purposeName: 'Коммунальные платежи',
    source: { type: 'safe', id: '2', name: 'Расчетный счет' },
    recipient: { type: 'counterparty', id: '1', name: 'ООО "Поставщик 1"' },
    amount: 750000,
    type: 'user',
    status: 'draft',
  },
  {
    id: '6',
    datetime: new Date('2025-11-08T13:30:00'),
    purposeId: '2',
    purposeName: 'Продажа товара',
    source: { type: 'counterparty', id: '3', name: 'ИП Иванов' },
    recipient: { type: 'cash_register', id: '2', name: 'Касса №2 (Склад)' },
    amount: 2100000,
    type: 'system',
    status: 'published',
  },
  {
    id: '7',
    datetime: new Date('2025-11-07T10:00:00'),
    purposeId: '1',
    purposeName: 'Закупка товара',
    source: { type: 'safe', id: '1', name: 'Основная касса' },
    recipient: { type: 'counterparty', id: '2', name: 'ООО "Поставщик 2"' },
    amount: 4500000,
    type: 'user',
    status: 'canceled',
  },
  {
    id: '8',
    datetime: new Date('2025-11-07T15:45:00'),
    purposeId: '2',
    purposeName: 'Продажа товара',
    source: { type: 'counterparty', id: '3', name: 'ИП Иванов' },
    recipient: { type: 'safe', id: '1', name: 'Основная касса' },
    amount: 980000,
    type: 'system',
    status: 'published',
  },
  {
    id: '9',
    datetime: new Date('2025-11-06T12:30:00'),
    purposeId: '3',
    purposeName: 'Зарплата сотрудникам',
    source: { type: 'safe', id: '2', name: 'Расчетный счет' },
    recipient: { type: 'counterparty', id: '1', name: 'ООО "Поставщик 1"' },
    amount: 6500000,
    type: 'user',
    status: 'draft',
  },
  {
    id: '10',
    datetime: new Date('2025-11-06T09:00:00'),
    purposeId: '1',
    purposeName: 'Закупка товара',
    source: { type: 'safe', id: '3', name: 'Корпоративная карта' },
    recipient: { type: 'counterparty', id: '2', name: 'ООО "Поставщик 2"' },
    amount: 3200000,
    type: 'user',
    status: 'published',
  },
  {
    id: '11',
    datetime: new Date('2025-11-05T14:15:00'),
    purposeId: '4',
    purposeName: 'Оплата аренды',
    source: { type: 'safe', id: '1', name: 'Основная касса' },
    recipient: { type: 'counterparty', id: '1', name: 'ООО "Поставщик 1"' },
    amount: 3000000,
    type: 'user',
    status: 'published',
  },
  {
    id: '12',
    datetime: new Date('2025-11-05T11:00:00'),
    purposeId: '2',
    purposeName: 'Продажа товара',
    source: { type: 'counterparty', id: '3', name: 'ИП Иванов' },
    recipient: { type: 'cash_register', id: '1', name: 'Касса №1 (Зал)' },
    amount: 1750000,
    type: 'system',
    status: 'published',
  },
  {
    id: '13',
    datetime: new Date('2025-11-04T16:30:00'),
    purposeId: '5',
    purposeName: 'Коммунальные платежи',
    source: { type: 'safe', id: '2', name: 'Расчетный счет' },
    recipient: { type: 'counterparty', id: '2', name: 'ООО "Поставщик 2"' },
    amount: 850000,
    type: 'user',
    status: 'published',
  },
  {
    id: '14',
    datetime: new Date('2025-11-04T10:45:00'),
    purposeId: '1',
    purposeName: 'Закупка товара',
    source: { type: 'safe', id: '1', name: 'Основная касса' },
    recipient: { type: 'counterparty', id: '1', name: 'ООО "Поставщик 1"' },
    amount: 5500000,
    type: 'user',
    status: 'canceled',
  },
  {
    id: '15',
    datetime: new Date('2025-11-03T13:20:00'),
    purposeId: '2',
    purposeName: 'Продажа товара',
    source: { type: 'counterparty', id: '3', name: 'ИП Иванов' },
    recipient: { type: 'safe', id: '3', name: 'Корпоративная карта' },
    amount: 2400000,
    type: 'system',
    status: 'published',
  },
];

// ==================== UTILITY FUNCTIONS ====================

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' сум';
};

// Using formatDate from @jowi/ui instead of date-fns format

const getEntityTypeLabel = (type: EntityType, t: any): string => {
  switch (type) {
    case 'safe':
      return t('finance.transactions.safe');
    case 'cash_register':
      return t('finance.transactions.cashRegister');
    case 'counterparty':
      return t('finance.transactions.counterparty');
  }
};

// Status handling is now done by StatusBadge component with i18n

const getTypeLabel = (type: TransactionType, t: any): string => {
  switch (type) {
    case 'system':
      return t('finance.transactions.system');
    case 'user':
      return t('finance.transactions.user');
  }
};

// ==================== MAIN COMPONENT ====================

export default function TransactionsPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;
  const { t } = useTranslation('common');

  // State
  const [data, setData] = useState<Transaction[]>(mockTransactions);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [purposeFilter, setPurposeFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Forms
  const createForm = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      datetime: new Date(),
      purposeId: '',
      sourceType: 'safe',
      sourceId: '',
      recipientType: 'safe',
      recipientId: '',
      amount: 0,
      type: 'user',
      status: 'draft',
    },
  });

  const editForm = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
  });

  // Filtered data
  const filteredData = useMemo(() => {
    const filtered = data.filter((transaction) => {
      // Search filter
      const matchesSearch =
        search === '' ||
        transaction.purposeName.toLowerCase().includes(search.toLowerCase()) ||
        transaction.source.name.toLowerCase().includes(search.toLowerCase()) ||
        transaction.recipient.name.toLowerCase().includes(search.toLowerCase());

      // Date range filter
      const matchesDateRange =
        !dateRange?.from ||
        !dateRange?.to ||
        (transaction.datetime >= dateRange.from && transaction.datetime <= dateRange.to);

      // Status filter
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;

      // Purpose filter
      const matchesPurpose = purposeFilter === 'all' || transaction.purposeId === purposeFilter;

      return matchesSearch && matchesDateRange && matchesStatus && matchesPurpose;
    });

    // Sort by datetime descending (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.datetime).getTime();
      const dateB = new Date(b.datetime).getTime();
      return dateB - dateA;
    });
  }, [data, search, dateRange, statusFilter, purposeFilter]);

  // Statistics
  const statistics = useMemo(() => {
    const totalCount = filteredData.length;
    const totalSum = filteredData.reduce((sum, transaction) => sum + transaction.amount, 0);
    const averageSum = totalCount > 0 ? totalSum / totalCount : 0;

    return { totalCount, totalSum, averageSum };
  }, [filteredData]);

  // Get entities by type
  const getEntitiesByType = (type: EntityType) => {
    switch (type) {
      case 'safe':
        return mockSafes.map((s) => ({ id: s.id, name: s.name }));
      case 'cash_register':
        return mockCashRegisters.map((cr) => ({ id: cr.id, name: cr.name }));
      case 'counterparty':
        return mockCounterparties.map((c) => ({ id: c.id, name: c.name }));
    }
  };

  // CRUD handlers
  const handleCreate = (formData: TransactionFormData) => {
    const sourceEntities = getEntitiesByType(formData.sourceType);
    const recipientEntities = getEntitiesByType(formData.recipientType);

    const source = sourceEntities.find((e) => e.id === formData.sourceId);
    const recipient = recipientEntities.find((e) => e.id === formData.recipientId);
    const purpose = mockPurposes.find((p) => p.id === formData.purposeId);

    if (!source || !recipient || !purpose) {
      toast.error(t('messages.error'), t('finance.transactions.entityNotFound'));
      return;
    }

    const newTransaction: Transaction = {
      id: String(data.length + 1),
      datetime: formData.datetime,
      purposeId: formData.purposeId,
      purposeName: purpose.name,
      source: {
        type: formData.sourceType,
        id: formData.sourceId,
        name: source.name,
      },
      recipient: {
        type: formData.recipientType,
        id: formData.recipientId,
        name: recipient.name,
      },
      amount: formData.amount,
      type: formData.type,
      status: formData.status,
    };

    setData([newTransaction, ...data]);
    toast.success(t('messages.success'), t('finance.transactions.created'));
    setIsCreateDialogOpen(false);
    createForm.reset();
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    editForm.reset({
      datetime: transaction.datetime,
      purposeId: transaction.purposeId,
      sourceType: transaction.source.type,
      sourceId: transaction.source.id,
      recipientType: transaction.recipient.type,
      recipientId: transaction.recipient.id,
      amount: transaction.amount,
      type: transaction.type,
      status: transaction.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (formData: TransactionFormData) => {
    if (!selectedTransaction) return;

    const sourceEntities = getEntitiesByType(formData.sourceType);
    const recipientEntities = getEntitiesByType(formData.recipientType);

    const source = sourceEntities.find((e) => e.id === formData.sourceId);
    const recipient = recipientEntities.find((e) => e.id === formData.recipientId);
    const purpose = mockPurposes.find((p) => p.id === formData.purposeId);

    if (!source || !recipient || !purpose) {
      toast.error(t('messages.error'), t('finance.transactions.entityNotFound'));
      return;
    }

    const updatedTransaction: Transaction = {
      ...selectedTransaction,
      datetime: formData.datetime,
      purposeId: formData.purposeId,
      purposeName: purpose.name,
      source: {
        type: formData.sourceType,
        id: formData.sourceId,
        name: source.name,
      },
      recipient: {
        type: formData.recipientType,
        id: formData.recipientId,
        name: recipient.name,
      },
      amount: formData.amount,
      type: formData.type,
      status: formData.status,
    };

    setData(data.map((t) => (t.id === selectedTransaction.id ? updatedTransaction : t)));
    toast.success(t('messages.success'), t('finance.transactions.updated'));
    setIsEditDialogOpen(false);
    setSelectedTransaction(null);
  };

  const handleDelete = (transaction: Transaction) => {
    if (confirm(t('finance.transactions.deleteConfirm', { name: transaction.purposeName }))) {
      setData(data.filter((t) => t.id !== transaction.id));
      toast.success(t('messages.success'), t('finance.transactions.deleteSuccess'));
    }
  };

  // Navigation handler
  const handleRowClick = (transaction: Transaction) => {
    router.push(`/store/${storeId}/finance/transactions/${transaction.id}`);
  };

  // Table columns
  const columns: Column<Transaction>[] = [
    {
      key: 'datetime',
      label: t('fields.date') + ' ' + t('fields.time'),
      sortable: true,
      render: (transaction) => (
        <div>
          <div className="font-medium">{formatDate(transaction.datetime)}</div>
          <div className="text-sm text-muted-foreground">
            {getTypeLabel(transaction.type, t)}
          </div>
        </div>
      ),
    },
    {
      key: 'purposeName',
      label: t('finance.transactions.purpose'),
      sortable: true,
      render: (transaction) => <span className="font-medium">{transaction.purposeName}</span>,
    },
    {
      key: 'source',
      label: t('finance.transactions.source'),
      render: (transaction) => (
        <div>
          <div className="font-medium text-sm">{transaction.source.name}</div>
          <div className="text-xs text-muted-foreground">
            {getEntityTypeLabel(transaction.source.type, t)}
          </div>
        </div>
      ),
    },
    {
      key: 'recipient',
      label: t('finance.transactions.recipient'),
      render: (transaction) => (
        <div>
          <div className="font-medium text-sm">{transaction.recipient.name}</div>
          <div className="text-xs text-muted-foreground">
            {getEntityTypeLabel(transaction.recipient.type, t)}
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      label: t('fields.amount'),
      sortable: true,
      render: (transaction) => (
        <span className="font-medium">{formatCurrency(transaction.amount)}</span>
      ),
    },
    {
      key: 'status',
      label: t('fields.status'),
      render: (transaction) => (
        <StatusBadge type="transaction" status={transaction.status} t={t} />
      ),
    },
  ];

  // Render entity selection fields
  const renderEntityFields = (
    form: typeof createForm | typeof editForm,
    prefix: 'source' | 'recipient'
  ) => {
    const typeField = `${prefix}Type` as const;
    const idField = `${prefix}Id` as const;
    const selectedType = form.watch(typeField);
    const entities = getEntitiesByType(selectedType);

    return (
      <>
        <FormField
          control={form.control}
          name={typeField}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {prefix === 'source' ? t('finance.transactions.sourceType') : t('finance.transactions.recipientType')}
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="safe">{t('finance.transactions.safe')}</SelectItem>
                  <SelectItem value="cash_register">{t('finance.transactions.cashRegister')}</SelectItem>
                  <SelectItem value="counterparty">{t('finance.transactions.counterparty')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={idField}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{prefix === 'source' ? t('finance.transactions.source') : t('finance.transactions.recipient')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('finance.transactions.selectOption')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {entities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{t('finance.transactions.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('finance.transactions.description')}
          </p>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('finance.transactions.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            placeholder={t('finance.transactions.selectPeriod')}
            className="w-[280px]"
          />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
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

          <Select value={purposeFilter} onValueChange={setPurposeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('finance.transactions.allPurposes')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('finance.transactions.allPurposes')}</SelectItem>
              {mockPurposes.map((purpose) => (
                <SelectItem key={purpose.id} value={purpose.id}>
                  {purpose.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('finance.transactions.createTransaction')}
          </Button>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('finance.transactions.statistics.totalCount')}
              </p>
              <p className="text-2xl font-bold">{statistics.totalCount}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Activity className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('finance.transactions.statistics.totalAmount')}</p>
              <p className="text-2xl font-bold">
                {formatCurrency(statistics.totalSum)}
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
              <p className="text-sm text-muted-foreground">{t('finance.transactions.statistics.averageAmount')}</p>
              <p className="text-2xl font-bold">
                {formatCurrency(statistics.averageSum)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Table Card */}
      {filteredData.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            {t('finance.transactions.emptyMessage')}
          </div>
        </Card>
      ) : (
        <Card>
          <DataTable
            data={filteredData}
            columns={columns}
            pagination={{ enabled: true, pageSize: 15 }}
            onRowClick={handleRowClick}
            rowClassName="cursor-pointer hover:bg-muted/50 transition-colors"
          />
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('finance.transactions.createTransaction')}</DialogTitle>
            <DialogDescription>
              {t('finance.transactions.createTransactionDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="purposeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('finance.transactions.purpose')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('finance.transactions.purposePlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockPurposes.map((purpose) => (
                          <SelectItem key={purpose.id} value={purpose.id}>
                            {purpose.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                {renderEntityFields(createForm, 'source')}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {renderEntityFields(createForm, 'recipient')}
              </div>

              <FormField
                control={createForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('finance.transactions.amount')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={t('finance.transactions.amountPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('finance.transactions.transactionType')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="system">{t('finance.transactions.system')}</SelectItem>
                          <SelectItem value="user">{t('finance.transactions.user')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('finance.transactions.status')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">{t('status.draft')}</SelectItem>
                          <SelectItem value="published">{t('status.published')}</SelectItem>
                          <SelectItem value="canceled">{t('status.canceled')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    createForm.reset();
                  }}
                >
                  {t('actions.cancel')}
                </Button>
                <Button type="submit">{t('actions.create')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('finance.transactions.editTransaction')}</DialogTitle>
            <DialogDescription>
              {t('finance.transactions.editTransactionDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="purposeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('finance.transactions.purpose')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('finance.transactions.purposePlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockPurposes.map((purpose) => (
                          <SelectItem key={purpose.id} value={purpose.id}>
                            {purpose.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                {renderEntityFields(editForm, 'source')}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {renderEntityFields(editForm, 'recipient')}
              </div>

              <FormField
                control={editForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('finance.transactions.amount')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={t('finance.transactions.amountPlaceholder')} {...field} />
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
                      <FormLabel>{t('finance.transactions.transactionType')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="system">{t('finance.transactions.system')}</SelectItem>
                          <SelectItem value="user">{t('finance.transactions.user')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('finance.transactions.status')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">{t('status.draft')}</SelectItem>
                          <SelectItem value="published">{t('status.published')}</SelectItem>
                          <SelectItem value="canceled">{t('status.canceled')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedTransaction(null);
                  }}
                >
                  {t('actions.cancel')}
                </Button>
                <Button type="submit">{t('actions.save')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
