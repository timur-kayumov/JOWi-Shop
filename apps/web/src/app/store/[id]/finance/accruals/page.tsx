'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Search, TrendingUp, DollarSign, Activity } from 'lucide-react';
import {
  Button,
  Input,
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
} from '@jowi/ui';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/toast';
import { type DateRange } from 'react-day-picker';

// ==================== TYPES ====================

type EntityType = 'safe' | 'cash_register' | 'counterparty';
type AccrualType = 'system' | 'user';
type AccrualStatus = 'draft' | 'published' | 'canceled';

interface EntityReference {
  type: EntityType;
  id: string;
  name: string;
}

interface Accrual {
  id: string;
  datetime: Date;
  purposeId: string;
  purposeName: string;
  source: EntityReference;
  recipient: EntityReference;
  amount: number;
  type: AccrualType;
  status: AccrualStatus;
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

const accrualSchema = z.object({
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

type AccrualFormData = z.infer<typeof accrualSchema>;

// ==================== MOCK DATA ====================

const mockPurposes: Purpose[] = [
  { id: 'p1', name: 'Начисление зарплаты' },
  { id: 'p2', name: 'Начисление бонусов' },
  { id: 'p3', name: 'Начисление процентов по вкладу' },
  { id: 'p4', name: 'Начисление кешбэка' },
  { id: 'p5', name: 'Начисление комиссии' },
];

const mockSafes: Safe[] = [
  { id: 's1', name: 'Касса наличные', type: 'cash' },
  { id: 's2', name: 'Расчетный счет', type: 'bank_account' },
  { id: 's3', name: 'Резервный фонд', type: 'card_account' },
];

const mockCashRegisters: CashRegister[] = [
  { id: 'cr1', name: 'Касса №1 (Основная)' },
  { id: 'cr2', name: 'Касса №2 (Дополнительная)' },
];

const mockCounterparties: Counterparty[] = [
  { id: 'c1', name: 'Партнер А', type: 'supplier' },
  { id: 'c2', name: 'ИП Иванов А.А.', type: 'buyer' },
  { id: 'c3', name: 'Системный контрагент', type: 'buyer' },
];

const mockAccruals: Accrual[] = [
  {
    id: '1',
    datetime: new Date('2025-11-10T10:30:00'),
    purposeId: 'p1',
    purposeName: 'Начисление зарплаты',
    source: { type: 'safe', id: 's2', name: 'Расчетный счет' },
    recipient: { type: 'counterparty', id: 'c2', name: 'ИП Иванов А.А.' },
    amount: 8000000,
    type: 'system',
    status: 'published',
  },
  {
    id: '2',
    datetime: new Date('2025-11-09T14:30:00'),
    purposeId: 'p2',
    purposeName: 'Начисление бонусов',
    source: { type: 'safe', id: 's1', name: 'Касса наличные' },
    recipient: { type: 'counterparty', id: 'c3', name: 'Системный контрагент' },
    amount: 500000,
    type: 'user',
    status: 'published',
  },
  {
    id: '3',
    datetime: new Date('2025-11-09T09:15:00'),
    purposeId: 'p3',
    purposeName: 'Начисление процентов по вкладу',
    source: { type: 'safe', id: 's2', name: 'Расчетный счет' },
    recipient: { type: 'safe', id: 's3', name: 'Резервный фонд' },
    amount: 1250000,
    type: 'system',
    status: 'published',
  },
  {
    id: '4',
    datetime: new Date('2025-11-08T16:00:00'),
    purposeId: 'p4',
    purposeName: 'Начисление кешбэка',
    source: { type: 'safe', id: 's1', name: 'Касса наличные' },
    recipient: { type: 'counterparty', id: 'c1', name: 'Партнер А' },
    amount: 320000,
    type: 'user',
    status: 'draft',
  },
  {
    id: '5',
    datetime: new Date('2025-11-08T11:45:00'),
    purposeId: 'p5',
    purposeName: 'Начисление комиссии',
    source: { type: 'cash_register', id: 'cr1', name: 'Касса №1 (Основная)' },
    recipient: { type: 'safe', id: 's2', name: 'Расчетный счет' },
    amount: 150000,
    type: 'system',
    status: 'published',
  },
  {
    id: '6',
    datetime: new Date('2025-11-07T13:20:00'),
    purposeId: 'p1',
    purposeName: 'Начисление зарплаты',
    source: { type: 'safe', id: 's2', name: 'Расчетный счет' },
    recipient: { type: 'counterparty', id: 'c2', name: 'ИП Иванов А.А.' },
    amount: 7500000,
    type: 'system',
    status: 'published',
  },
  {
    id: '7',
    datetime: new Date('2025-11-07T10:00:00'),
    purposeId: 'p2',
    purposeName: 'Начисление бонусов',
    source: { type: 'safe', id: 's1', name: 'Касса наличные' },
    recipient: { type: 'counterparty', id: 'c3', name: 'Системный контрагент' },
    amount: 750000,
    type: 'user',
    status: 'canceled',
  },
  {
    id: '8',
    datetime: new Date('2025-11-06T15:30:00'),
    purposeId: 'p3',
    purposeName: 'Начисление процентов по вкладу',
    source: { type: 'safe', id: 's2', name: 'Расчетный счет' },
    recipient: { type: 'safe', id: 's3', name: 'Резервный фонд' },
    amount: 1100000,
    type: 'system',
    status: 'published',
  },
  {
    id: '9',
    datetime: new Date('2025-11-06T12:00:00'),
    purposeId: 'p4',
    purposeName: 'Начисление кешбэка',
    source: { type: 'safe', id: 's1', name: 'Касса наличные' },
    recipient: { type: 'counterparty', id: 'c1', name: 'Партнер А' },
    amount: 280000,
    type: 'user',
    status: 'draft',
  },
  {
    id: '10',
    datetime: new Date('2025-11-05T14:45:00'),
    purposeId: 'p5',
    purposeName: 'Начисление комиссии',
    source: { type: 'cash_register', id: 'cr2', name: 'Касса №2 (Дополнительная)' },
    recipient: { type: 'safe', id: 's2', name: 'Расчетный счет' },
    amount: 175000,
    type: 'system',
    status: 'published',
  },
  {
    id: '11',
    datetime: new Date('2025-11-05T09:30:00'),
    purposeId: 'p1',
    purposeName: 'Начисление зарплаты',
    source: { type: 'safe', id: 's2', name: 'Расчетный счет' },
    recipient: { type: 'counterparty', id: 'c2', name: 'ИП Иванов А.А.' },
    amount: 8200000,
    type: 'system',
    status: 'published',
  },
  {
    id: '12',
    datetime: new Date('2025-11-04T16:15:00'),
    purposeId: 'p2',
    purposeName: 'Начисление бонусов',
    source: { type: 'safe', id: 's1', name: 'Касса наличные' },
    recipient: { type: 'counterparty', id: 'c3', name: 'Системный контрагент' },
    amount: 650000,
    type: 'user',
    status: 'published',
  },
  {
    id: '13',
    datetime: new Date('2025-11-04T11:00:00'),
    purposeId: 'p3',
    purposeName: 'Начисление процентов по вкладу',
    source: { type: 'safe', id: 's2', name: 'Расчетный счет' },
    recipient: { type: 'safe', id: 's3', name: 'Резервный фонд' },
    amount: 1350000,
    type: 'system',
    status: 'canceled',
  },
  {
    id: '14',
    datetime: new Date('2025-11-03T13:45:00'),
    purposeId: 'p4',
    purposeName: 'Начисление кешбэка',
    source: { type: 'safe', id: 's1', name: 'Касса наличные' },
    recipient: { type: 'counterparty', id: 'c1', name: 'Партнер А' },
    amount: 390000,
    type: 'user',
    status: 'published',
  },
  {
    id: '15',
    datetime: new Date('2025-11-03T10:20:00'),
    purposeId: 'p5',
    purposeName: 'Начисление комиссии',
    source: { type: 'cash_register', id: 'cr1', name: 'Касса №1 (Основная)' },
    recipient: { type: 'safe', id: 's2', name: 'Расчетный счет' },
    amount: 125000,
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

const getEntityTypeLabel = (type: EntityType, t: any): string => {
  switch (type) {
    case 'safe':
      return t('finance.accruals.safe');
    case 'cash_register':
      return t('finance.accruals.cashRegister');
    case 'counterparty':
      return t('finance.accruals.counterparty');
  }
};

const getTypeLabel = (type: AccrualType, t: any): string => {
  switch (type) {
    case 'system':
      return t('finance.accruals.system');
    case 'user':
      return t('finance.accruals.user');
  }
};

// ==================== MAIN COMPONENT ====================

export default function AccrualsPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;
  const { t, i18n } = useTranslation('common');

  // Get locale, defaulting to 'ru' if not 'uz'
  const locale = i18n.language.startsWith('uz') ? 'uz' : 'ru';

  // State
  const [data, setData] = useState<Accrual[]>(mockAccruals);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [purposeFilter, setPurposeFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAccrual, setSelectedAccrual] = useState<Accrual | null>(null);

  // Forms
  const createForm = useForm<AccrualFormData>({
    resolver: zodResolver(accrualSchema),
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

  const editForm = useForm<AccrualFormData>({
    resolver: zodResolver(accrualSchema),
  });

  // Filtered data
  const filteredData = useMemo(() => {
    const filtered = data.filter((accrual) => {
      // Search filter
      const matchesSearch =
        search === '' ||
        accrual.purposeName.toLowerCase().includes(search.toLowerCase()) ||
        accrual.source.name.toLowerCase().includes(search.toLowerCase()) ||
        accrual.recipient.name.toLowerCase().includes(search.toLowerCase());

      // Date range filter
      const matchesDateRange =
        !dateRange?.from ||
        !dateRange?.to ||
        (accrual.datetime >= dateRange.from && accrual.datetime <= dateRange.to);

      // Status filter
      const matchesStatus = statusFilter === 'all' || accrual.status === statusFilter;

      // Type filter
      const matchesType = typeFilter === 'all' || accrual.type === typeFilter;

      // Purpose filter
      const matchesPurpose = purposeFilter === 'all' || accrual.purposeId === purposeFilter;

      return matchesSearch && matchesDateRange && matchesStatus && matchesType && matchesPurpose;
    });

    // Sort by datetime descending (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.datetime).getTime();
      const dateB = new Date(b.datetime).getTime();
      return dateB - dateA;
    });
  }, [data, search, dateRange, statusFilter, typeFilter, purposeFilter]);

  // Statistics
  const statistics = useMemo(() => {
    const totalCount = filteredData.length;
    const totalSum = filteredData.reduce((sum, accrual) => sum + accrual.amount, 0);
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
  const handleCreate = (formData: AccrualFormData) => {
    const sourceEntities = getEntitiesByType(formData.sourceType);
    const recipientEntities = getEntitiesByType(formData.recipientType);

    const source = sourceEntities.find((e) => e.id === formData.sourceId);
    const recipient = recipientEntities.find((e) => e.id === formData.recipientId);
    const purpose = mockPurposes.find((p) => p.id === formData.purposeId);

    if (!source || !recipient || !purpose) {
      toast.error(t('messages.error'), t('finance.accruals.entityNotFound'));
      return;
    }

    const newAccrual: Accrual = {
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

    setData([newAccrual, ...data]);
    toast.success(t('messages.success'), t('finance.accruals.created'));
    setIsCreateDialogOpen(false);
    createForm.reset();
  };

  const handleEdit = (accrual: Accrual) => {
    setSelectedAccrual(accrual);
    editForm.reset({
      datetime: accrual.datetime,
      purposeId: accrual.purposeId,
      sourceType: accrual.source.type,
      sourceId: accrual.source.id,
      recipientType: accrual.recipient.type,
      recipientId: accrual.recipient.id,
      amount: accrual.amount,
      type: accrual.type,
      status: accrual.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (formData: AccrualFormData) => {
    if (!selectedAccrual) return;

    const sourceEntities = getEntitiesByType(formData.sourceType);
    const recipientEntities = getEntitiesByType(formData.recipientType);

    const source = sourceEntities.find((e) => e.id === formData.sourceId);
    const recipient = recipientEntities.find((e) => e.id === formData.recipientId);
    const purpose = mockPurposes.find((p) => p.id === formData.purposeId);

    if (!source || !recipient || !purpose) {
      toast.error(t('messages.error'), t('finance.accruals.entityNotFound'));
      return;
    }

    const updatedAccrual: Accrual = {
      ...selectedAccrual,
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

    setData(data.map((a) => (a.id === selectedAccrual.id ? updatedAccrual : a)));
    toast.success(t('messages.success'), t('finance.accruals.updated'));
    setIsEditDialogOpen(false);
    setSelectedAccrual(null);
  };

  const handleDelete = (accrual: Accrual) => {
    if (confirm(t('finance.accruals.deleteConfirm', { name: accrual.purposeName }))) {
      setData(data.filter((a) => a.id !== accrual.id));
      toast.success(t('messages.success'), t('finance.accruals.deleteSuccess'));
    }
  };

  // Navigation handler
  const handleRowClick = (accrual: Accrual) => {
    router.push(`/store/${storeId}/finance/accruals/${accrual.id}`);
  };

  // Table columns
  const columns: Column<Accrual>[] = [
    {
      key: 'datetime',
      label: t('finance.accruals.datetime'),
      sortable: true,
      render: (accrual) => (
        <div>
          <div className="font-medium">{formatDate(accrual.datetime, locale)}</div>
          <div className="text-sm text-muted-foreground">
            {getTypeLabel(accrual.type, t)}
          </div>
        </div>
      ),
    },
    {
      key: 'purposeName',
      label: t('finance.accruals.purposeName'),
      sortable: true,
      render: (accrual) => <span className="font-medium">{accrual.purposeName}</span>,
    },
    {
      key: 'source',
      label: t('finance.accruals.source'),
      render: (accrual) => (
        <div>
          <div className="font-medium text-sm">{accrual.source.name}</div>
          <div className="text-xs text-muted-foreground">
            {getEntityTypeLabel(accrual.source.type, t)}
          </div>
        </div>
      ),
    },
    {
      key: 'recipient',
      label: t('finance.accruals.recipient'),
      render: (accrual) => (
        <div>
          <div className="font-medium text-sm">{accrual.recipient.name}</div>
          <div className="text-xs text-muted-foreground">
            {getEntityTypeLabel(accrual.recipient.type, t)}
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      label: t('finance.accruals.amount'),
      sortable: true,
      render: (accrual) => (
        <span className="font-medium">{formatCurrency(accrual.amount)}</span>
      ),
    },
    {
      key: 'status',
      label: t('finance.accruals.status'),
      render: (accrual) => (
        <StatusBadge type="transaction" status={accrual.status} t={t} />
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
                  <SelectItem value="safe">{t('finance.accruals.safe')}</SelectItem>
                  <SelectItem value="cash_register">{t('finance.accruals.cashRegister')}</SelectItem>
                  <SelectItem value="counterparty">{t('finance.accruals.counterparty')}</SelectItem>
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
              <FormLabel>{prefix === 'source' ? t('finance.accruals.source') : t('finance.accruals.recipient')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('finance.accruals.selectOption')} />
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
          <h1 className="text-3xl font-bold tracking-tight">{t('finance.accruals.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('finance.accruals.description')}
          </p>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('finance.accruals.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            placeholder={t('finance.accruals.selectPeriod')}
            className="w-[200px]"
          />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
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

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('finance.accruals.allTypes')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('finance.accruals.allTypes')}</SelectItem>
              <SelectItem value="system">{t('finance.accruals.system')}</SelectItem>
              <SelectItem value="user">{t('finance.accruals.user')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={purposeFilter} onValueChange={setPurposeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('finance.accruals.allPurposes')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('finance.accruals.allPurposes')}</SelectItem>
              {mockPurposes.map((purpose) => (
                <SelectItem key={purpose.id} value={purpose.id}>
                  {purpose.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('actions.create')}
          </Button>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('finance.accruals.statistics.totalCount')}
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
              <p className="text-sm text-muted-foreground">{t('finance.accruals.statistics.totalAmount')}</p>
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
              <p className="text-sm text-muted-foreground">{t('finance.accruals.statistics.averageAmount')}</p>
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
            {t('finance.accruals.emptyMessage')}
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
            <DialogTitle>{t('finance.accruals.createAccrual')}</DialogTitle>
            <DialogDescription>
              {t('finance.accruals.createAccrualDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="purposeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('finance.accruals.purposeName')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('finance.accruals.purposePlaceholder')} />
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
                    <FormLabel>{t('finance.accruals.amount')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={t('finance.accruals.amountPlaceholder')} {...field} />
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
                      <FormLabel>{t('finance.accruals.type')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="system">{t('finance.accruals.system')}</SelectItem>
                          <SelectItem value="user">{t('finance.accruals.user')}</SelectItem>
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
                      <FormLabel>{t('finance.accruals.status')}</FormLabel>
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
                <Button type="submit">{t('finance.accruals.createAccrual')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('finance.accruals.editAccrual')}</DialogTitle>
            <DialogDescription>
              {t('finance.accruals.editAccrualDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="purposeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('finance.accruals.purposeName')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('finance.accruals.purposePlaceholder')} />
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
                    <FormLabel>{t('finance.accruals.amount')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={t('finance.accruals.amountPlaceholder')} {...field} />
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
                      <FormLabel>{t('finance.accruals.type')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="system">{t('finance.accruals.system')}</SelectItem>
                          <SelectItem value="user">{t('finance.accruals.user')}</SelectItem>
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
                      <FormLabel>{t('finance.accruals.status')}</FormLabel>
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
                    setSelectedAccrual(null);
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
