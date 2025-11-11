'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Search, Pencil, Trash2, Check, X, Tablet, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  Checkbox,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from '@jowi/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/toast';

// ==================== TYPES ====================

type ActivityType =
  | 'purchase' // Закупка
  | 'sale' // Продажа
  | 'salary' // Зарплата
  | 'rent' // Аренда
  | 'utilities' // Коммунальные
  | 'taxes' // Налоги
  | 'advertising' // Реклама
  | 'equipment' // Оборудование
  | 'loans' // Кредиты
  | 'investments' // Инвестиции
  | 'other'; // Прочее

type EntityType = 'safe' | 'counterparty';
type AssignmentType = 'system' | 'custom';

interface EntityReference {
  type: EntityType;
  id: string;
  name: string;
}

interface TransactionTemplate {
  id: string;
  name: string;
  activityType: ActivityType;
  source: EntityReference;
  recipient: EntityReference;
  type: AssignmentType;
  posAccess: boolean;
  hasAdditionalRestriction: boolean;
  additionalSource?: EntityReference;
  additionalRecipient?: EntityReference;
}

interface Accrual {
  id: string;
  name: string;
  source: EntityReference;
  recipient: EntityReference;
  type: AssignmentType;
  hasAdditionalCondition: boolean;
  additionalSource?: EntityReference;
  additionalRecipient?: EntityReference;
}

interface Safe {
  id: string;
  name: string;
  type: 'cash' | 'bank_account' | 'card_account';
}

interface Counterparty {
  id: string;
  name: string;
  type: 'system' | 'custom';
}

// ==================== MOCK DATA ====================

const mockSafes: Safe[] = [
  { id: 's1', name: 'Касса наличные', type: 'cash' },
  { id: 's2', name: 'Расчётный счёт', type: 'bank_account' },
  { id: 's3', name: 'Эквайринг Uzcard', type: 'card_account' },
  { id: 's4', name: 'Резервный фонд', type: 'cash' },
];

const mockCounterparties: Counterparty[] = [
  { id: 'c1', name: 'ООО "Поставщик продуктов"', type: 'custom' },
  { id: 'c2', name: 'ИП Иванов А.А.', type: 'custom' },
  { id: 'c3', name: 'Системный контрагент (Касса)', type: 'system' },
  { id: 'c4', name: 'ООО "Аренда помещений"', type: 'custom' },
  { id: 'c5', name: 'ИП Петров В.В.', type: 'custom' },
  { id: 'c6', name: 'ООО "Коммунальные услуги"', type: 'custom' },
];

// Activity type labels will be retrieved via translation function

const activityTypeColors: Record<ActivityType, string> = {
  purchase: 'blue',
  sale: 'green',
  salary: 'purple',
  rent: 'orange',
  utilities: 'cyan',
  taxes: 'red',
  advertising: 'pink',
  equipment: 'gray',
  loans: 'yellow',
  investments: 'indigo',
  other: 'slate',
};

const mockTransactionTemplates: TransactionTemplate[] = [
  {
    id: 't1',
    name: 'Закупка товаров у поставщика',
    activityType: 'purchase',
    source: { type: 'safe', id: 's2', name: 'Расчётный счёт' },
    recipient: { type: 'counterparty', id: 'c1', name: 'ООО "Поставщик продуктов"' },
    type: 'system',
    posAccess: false,
    hasAdditionalRestriction: true,
    additionalSource: { type: 'safe', id: 's1', name: 'Касса наличные' },
  },
  {
    id: 't2',
    name: 'Оплата аренды',
    activityType: 'rent',
    source: { type: 'safe', id: 's2', name: 'Расчётный счёт' },
    recipient: { type: 'counterparty', id: 'c4', name: 'ООО "Аренда помещений"' },
    type: 'custom',
    posAccess: false,
    hasAdditionalRestriction: false,
  },
  {
    id: 't3',
    name: 'Выплата зарплаты сотрудникам',
    activityType: 'salary',
    source: { type: 'safe', id: 's2', name: 'Расчётный счёт' },
    recipient: { type: 'counterparty', id: 'c2', name: 'ИП Иванов А.А.' },
    type: 'system',
    posAccess: false,
    hasAdditionalRestriction: false,
  },
  {
    id: 't4',
    name: 'Продажа через кассу',
    activityType: 'sale',
    source: { type: 'counterparty', id: 'c3', name: 'Системный контрагент (Касса)' },
    recipient: { type: 'safe', id: 's1', name: 'Касса наличные' },
    type: 'system',
    posAccess: true,
    hasAdditionalRestriction: false,
  },
  {
    id: 't5',
    name: 'Оплата коммунальных услуг',
    activityType: 'utilities',
    source: { type: 'safe', id: 's2', name: 'Расчётный счёт' },
    recipient: { type: 'counterparty', id: 'c6', name: 'ООО "Коммунальные услуги"' },
    type: 'custom',
    posAccess: false,
    hasAdditionalRestriction: false,
  },
  {
    id: 't6',
    name: 'Оплата налогов',
    activityType: 'taxes',
    source: { type: 'safe', id: 's2', name: 'Расчётный счёт' },
    recipient: { type: 'counterparty', id: 'c3', name: 'Системный контрагент (Касса)' },
    type: 'system',
    posAccess: false,
    hasAdditionalRestriction: false,
  },
  {
    id: 't7',
    name: 'Расходы на рекламу',
    activityType: 'advertising',
    source: { type: 'safe', id: 's1', name: 'Касса наличные' },
    recipient: { type: 'counterparty', id: 'c5', name: 'ИП Петров В.В.' },
    type: 'custom',
    posAccess: false,
    hasAdditionalRestriction: false,
  },
  {
    id: 't8',
    name: 'Покупка оборудования',
    activityType: 'equipment',
    source: { type: 'safe', id: 's2', name: 'Расчётный счёт' },
    recipient: { type: 'counterparty', id: 'c1', name: 'ООО "Поставщик продуктов"' },
    type: 'custom',
    posAccess: false,
    hasAdditionalRestriction: true,
    additionalRecipient: { type: 'counterparty', id: 'c2', name: 'ИП Иванов А.А.' },
  },
  {
    id: 't9',
    name: 'Оплата по кредиту',
    activityType: 'loans',
    source: { type: 'safe', id: 's2', name: 'Расчётный счёт' },
    recipient: { type: 'counterparty', id: 'c4', name: 'ООО "Аренда помещений"' },
    type: 'system',
    posAccess: false,
    hasAdditionalRestriction: false,
  },
  {
    id: 't10',
    name: 'Инвестиции в развитие',
    activityType: 'investments',
    source: { type: 'safe', id: 's4', name: 'Резервный фонд' },
    recipient: { type: 'counterparty', id: 'c5', name: 'ИП Петров В.В.' },
    type: 'custom',
    posAccess: false,
    hasAdditionalRestriction: false,
  },
];

const mockAccruals: Accrual[] = [
  {
    id: 'a1',
    name: 'Начисление зарплаты',
    source: { type: 'safe', id: 's2', name: 'Расчётный счёт' },
    recipient: { type: 'counterparty', id: 'c2', name: 'ИП Иванов А.А.' },
    type: 'system',
    hasAdditionalCondition: false,
  },
  {
    id: 'a2',
    name: 'Начисление бонусов',
    source: { type: 'safe', id: 's1', name: 'Касса наличные' },
    recipient: { type: 'counterparty', id: 'c2', name: 'ИП Иванов А.А.' },
    type: 'custom',
    hasAdditionalCondition: true,
    additionalSource: { type: 'safe', id: 's4', name: 'Резервный фонд' },
  },
  {
    id: 'a3',
    name: 'Начисление процентов по вкладу',
    source: { type: 'safe', id: 's2', name: 'Расчётный счёт' },
    recipient: { type: 'safe', id: 's4', name: 'Резервный фонд' },
    type: 'system',
    hasAdditionalCondition: false,
  },
  {
    id: 'a4',
    name: 'Начисление кешбэка',
    source: { type: 'safe', id: 's3', name: 'Эквайринг Uzcard' },
    recipient: { type: 'counterparty', id: 'c3', name: 'Системный контрагент (Касса)' },
    type: 'custom',
    hasAdditionalCondition: false,
  },
  {
    id: 'a5',
    name: 'Начисление комиссии',
    source: { type: 'counterparty', id: 'c1', name: 'ООО "Поставщик продуктов"' },
    recipient: { type: 'safe', id: 's1', name: 'Касса наличные' },
    type: 'custom',
    hasAdditionalCondition: true,
    additionalRecipient: { type: 'safe', id: 's2', name: 'Расчётный счёт' },
  },
];

// ==================== VALIDATION SCHEMAS ====================

const entityReferenceSchema = z.object({
  type: z.enum(['safe', 'counterparty']),
  id: z.string().min(1, 'Select item'),
  name: z.string(),
});

const transactionTemplateSchema = z.object({
  name: z.string().min(2, 'Min 2 characters').max(100, 'Max 100 characters'),
  activityType: z.enum([
    'purchase',
    'sale',
    'salary',
    'rent',
    'utilities',
    'taxes',
    'advertising',
    'equipment',
    'loans',
    'investments',
    'other',
  ]),
  source: entityReferenceSchema,
  recipient: entityReferenceSchema,
  type: z.enum(['system', 'custom']),
  posAccess: z.boolean().default(false),
  hasAdditionalRestriction: z.boolean().default(false),
  additionalSource: entityReferenceSchema.optional(),
  additionalRecipient: entityReferenceSchema.optional(),
});

const accrualSchema = z.object({
  name: z.string().min(2, 'Min 2 characters').max(100, 'Max 100 characters'),
  source: entityReferenceSchema,
  recipient: entityReferenceSchema,
  type: z.enum(['system', 'custom']),
  hasAdditionalCondition: z.boolean().default(false),
  additionalSource: entityReferenceSchema.optional(),
  additionalRecipient: entityReferenceSchema.optional(),
});

type TransactionTemplateInput = z.infer<typeof transactionTemplateSchema>;
type AccrualInput = z.infer<typeof accrualSchema>;

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

export default function AssignmentsPage() {
  const { t } = useTranslation('common');
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;

  // Get activity type labels from translation
  const activityTypeLabels: Record<ActivityType, string> = {
    purchase: t('finance.purposes.activities.purchase'),
    sale: t('finance.purposes.activities.sale'),
    salary: t('finance.purposes.activities.salary'),
    rent: t('finance.purposes.activities.rent'),
    utilities: t('finance.purposes.activities.utilities'),
    taxes: t('finance.purposes.activities.taxes'),
    advertising: t('finance.purposes.activities.advertising'),
    equipment: t('finance.purposes.activities.equipment'),
    loans: t('finance.purposes.activities.loans'),
    investments: t('finance.purposes.activities.investments'),
    other: t('finance.purposes.activities.other'),
  };

  // State
  const [activeTab, setActiveTab] = useState<'transactions' | 'accruals'>('transactions');
  const [transactionTemplates, setTransactionTemplates] = useState<TransactionTemplate[]>(
    mockTransactionTemplates
  );
  const [accruals, setAccruals] = useState<Accrual[]>(mockAccruals);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [recipientFilter, setRecipientFilter] = useState<string>('all');
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all');

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionTemplate | null>(null);
  const [selectedAccrual, setSelectedAccrual] = useState<Accrual | null>(null);

  // Forms
  const transactionForm = useForm<TransactionTemplateInput>({
    resolver: zodResolver(transactionTemplateSchema),
    defaultValues: {
      name: '',
      activityType: 'other',
      source: { type: 'safe', id: '', name: '' },
      recipient: { type: 'safe', id: '', name: '' },
      type: 'custom',
      posAccess: false,
      hasAdditionalRestriction: false,
    },
  });

  const accrualForm = useForm<AccrualInput>({
    resolver: zodResolver(accrualSchema),
    defaultValues: {
      name: '',
      source: { type: 'safe', id: '', name: '' },
      recipient: { type: 'safe', id: '', name: '' },
      type: 'custom',
      hasAdditionalCondition: false,
    },
  });

  // Helper functions
  const getEntityName = (ref: EntityReference): string => {
    if (ref.type === 'safe') {
      return mockSafes.find((s) => s.id === ref.id)?.name || ref.name;
    }
    return mockCounterparties.find((c) => c.id === ref.id)?.name || ref.name;
  };

  const getAllEntities = (): Array<{ type: EntityType; id: string; name: string }> => {
    return [
      ...mockSafes.map((s) => ({ type: 'safe' as EntityType, id: s.id, name: s.name })),
      ...mockCounterparties.map((c) => ({ type: 'counterparty' as EntityType, id: c.id, name: c.name })),
    ];
  };

  // Filtering
  const filteredTransactions = transactionTemplates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesSource =
      sourceFilter === 'all' ||
      (t.source.type === 'safe' && sourceFilter.startsWith('s-') && t.source.id === sourceFilter.slice(2)) ||
      (t.source.type === 'counterparty' &&
        sourceFilter.startsWith('c-') &&
        t.source.id === sourceFilter.slice(2));
    const matchesRecipient =
      recipientFilter === 'all' ||
      (t.recipient.type === 'safe' &&
        recipientFilter.startsWith('s-') &&
        t.recipient.id === recipientFilter.slice(2)) ||
      (t.recipient.type === 'counterparty' &&
        recipientFilter.startsWith('c-') &&
        t.recipient.id === recipientFilter.slice(2));
    const matchesActivityType = activityTypeFilter === 'all' || t.activityType === activityTypeFilter;
    return matchesSearch && matchesType && matchesSource && matchesRecipient && matchesActivityType;
  });

  const filteredAccruals = accruals.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || a.type === typeFilter;
    const matchesSource =
      sourceFilter === 'all' ||
      (a.source.type === 'safe' && sourceFilter.startsWith('s-') && a.source.id === sourceFilter.slice(2)) ||
      (a.source.type === 'counterparty' &&
        sourceFilter.startsWith('c-') &&
        a.source.id === sourceFilter.slice(2));
    const matchesRecipient =
      recipientFilter === 'all' ||
      (a.recipient.type === 'safe' &&
        recipientFilter.startsWith('s-') &&
        a.recipient.id === recipientFilter.slice(2)) ||
      (a.recipient.type === 'counterparty' &&
        recipientFilter.startsWith('c-') &&
        a.recipient.id === recipientFilter.slice(2));
    return matchesSearch && matchesType && matchesSource && matchesRecipient;
  });

  // CRUD handlers for Transaction Templates
  const handleCreateTransaction = (formData: TransactionTemplateInput) => {
    const newTransaction: TransactionTemplate = {
      id: `t${transactionTemplates.length + 1}`,
      ...formData,
    };
    setTransactionTemplates([...transactionTemplates, newTransaction]);
    toast.success(t('messages.saved'), `${t('finance.purposes.createTemplateDescription')} "${formData.name}"`);
    setIsCreateDialogOpen(false);
    transactionForm.reset();
  };

  const handleEditTransaction = (formData: TransactionTemplateInput) => {
    if (!selectedTransaction) return;
    setTransactionTemplates(
      transactionTemplates.map((t) =>
        t.id === selectedTransaction.id ? { ...t, ...formData } : t
      )
    );
    toast.success(t('messages.saved'), t('finance.purposes.editTemplateDescription'));
    setIsEditDialogOpen(false);
    setSelectedTransaction(null);
    transactionForm.reset();
  };

  const handleDeleteTransaction = (transaction: TransactionTemplate) => {
    if (transaction.type === 'system') {
      toast.error(t('messages.error'), t('finance.purposes.cannotDeleteSystem'));
      return;
    }
    if (window.confirm(t('finance.purposes.deleteTemplateConfirm'))) {
      setTransactionTemplates(transactionTemplates.filter((t) => t.id !== transaction.id));
      toast.success(t('messages.deleted'), t('finance.purposes.deleteSuccess'));
    }
  };

  const openEditTransactionDialog = (transaction: TransactionTemplate) => {
    setSelectedTransaction(transaction);
    transactionForm.reset({
      name: transaction.name,
      activityType: transaction.activityType,
      source: transaction.source,
      recipient: transaction.recipient,
      type: transaction.type,
      posAccess: transaction.posAccess,
      hasAdditionalRestriction: transaction.hasAdditionalRestriction,
      additionalSource: transaction.additionalSource,
      additionalRecipient: transaction.additionalRecipient,
    });
    setIsEditDialogOpen(true);
  };

  // CRUD handlers for Accruals
  const handleCreateAccrual = (formData: AccrualInput) => {
    const newAccrual: Accrual = {
      id: `a${accruals.length + 1}`,
      ...formData,
    };
    setAccruals([...accruals, newAccrual]);
    toast.success(t('messages.saved'), `${t('finance.purposes.createAccrualDescription')} "${formData.name}"`);
    setIsCreateDialogOpen(false);
    accrualForm.reset();
  };

  const handleEditAccrual = (formData: AccrualInput) => {
    if (!selectedAccrual) return;
    setAccruals(accruals.map((a) => (a.id === selectedAccrual.id ? { ...a, ...formData } : a)));
    toast.success(t('messages.saved'), t('finance.purposes.editAccrualDescription'));
    setIsEditDialogOpen(false);
    setSelectedAccrual(null);
    accrualForm.reset();
  };

  const handleDeleteAccrual = (accrual: Accrual) => {
    if (accrual.type === 'system') {
      toast.error(t('messages.error'), t('finance.purposes.cannotDeleteSystem'));
      return;
    }
    if (window.confirm(t('finance.purposes.deleteAccrualConfirm'))) {
      setAccruals(accruals.filter((a) => a.id !== accrual.id));
      toast.success(t('messages.deleted'), t('finance.purposes.deleteSuccess'));
    }
  };

  const openEditAccrualDialog = (accrual: Accrual) => {
    setSelectedAccrual(accrual);
    accrualForm.reset({
      name: accrual.name,
      source: accrual.source,
      recipient: accrual.recipient,
      type: accrual.type,
      hasAdditionalCondition: accrual.hasAdditionalCondition,
      additionalSource: accrual.additionalSource,
      additionalRecipient: accrual.additionalRecipient,
    });
    setIsEditDialogOpen(true);
  };

  // Table columns for Transaction Templates
  const transactionColumns: Column<TransactionTemplate>[] = [
    {
      key: 'name',
      label: t('fields.name'),
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-medium">{item.name}</div>
          <div className="text-sm text-muted-foreground">
            {item.type === 'system' ? t('finance.counterparties.system') : t('finance.counterparties.custom')}
          </div>
        </div>
      ),
    },
    {
      key: 'activityType',
      label: t('finance.purposes.activityType'),
      render: (item) => (
        <Badge variant="secondary" className={cn('border-l-2', `border-${activityTypeColors[item.activityType]}-500`)}>
          {activityTypeLabels[item.activityType]}
        </Badge>
      ),
    },
    {
      key: 'source',
      label: t('finance.purposes.source'),
      render: (item) => (
        <div>
          <div className="font-medium text-sm">{getEntityName(item.source)}</div>
          <div className="text-xs text-muted-foreground">
            {item.source.type === 'safe' ? t('finance.purposes.safe') : t('finance.purposes.counterparty')}
          </div>
        </div>
      ),
    },
    {
      key: 'recipient',
      label: t('finance.purposes.recipient'),
      render: (item) => (
        <div>
          <div className="font-medium text-sm">{getEntityName(item.recipient)}</div>
          <div className="text-xs text-muted-foreground">
            {item.recipient.type === 'safe' ? t('finance.purposes.safe') : t('finance.purposes.counterparty')}
          </div>
        </div>
      ),
    },
    {
      key: 'posAccess',
      label: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-center">
                <Tablet className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('finance.purposes.posAccessTooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      render: (item) => (
        <div className="flex justify-center">
          {item.posAccess ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      key: 'hasAdditionalRestriction',
      label: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-center">
                <Lock className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('finance.purposes.additionalRestrictionsTooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      render: (item) => (
        <div className="flex justify-center">
          {item.hasAdditionalRestriction ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: t('fields.actions'),
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openEditTransactionDialog(item);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteTransaction(item);
            }}
            disabled={item.type === 'system'}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Table columns for Accruals
  const accrualColumns: Column<Accrual>[] = [
    {
      key: 'name',
      label: t('fields.name'),
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-medium">{item.name}</div>
          <div className="text-sm text-muted-foreground">
            {item.type === 'system' ? t('finance.counterparties.system') : t('finance.counterparties.custom')}
          </div>
        </div>
      ),
    },
    {
      key: 'source',
      label: t('finance.purposes.source'),
      render: (item) => (
        <div>
          <div className="font-medium text-sm">{getEntityName(item.source)}</div>
          <div className="text-xs text-muted-foreground">
            {item.source.type === 'safe' ? t('finance.purposes.safe') : t('finance.purposes.counterparty')}
          </div>
        </div>
      ),
    },
    {
      key: 'recipient',
      label: t('finance.purposes.recipient'),
      render: (item) => (
        <div>
          <div className="font-medium text-sm">{getEntityName(item.recipient)}</div>
          <div className="text-xs text-muted-foreground">
            {item.recipient.type === 'safe' ? t('finance.purposes.safe') : t('finance.purposes.counterparty')}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: t('finance.purposes.type'),
      render: (item) => (
        <Badge variant={item.type === 'system' ? 'default' : 'secondary'}>
          {item.type === 'system' ? t('finance.counterparties.system') : t('finance.counterparties.custom')}
        </Badge>
      ),
    },
    {
      key: 'hasAdditionalCondition',
      label: t('finance.purposes.hasAdditionalCondition'),
      render: (item) => (
        <Badge variant={item.hasAdditionalCondition ? 'default' : 'outline'}>
          {item.hasAdditionalCondition ? t('status.enabled') : t('status.disabled')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: t('fields.actions'),
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openEditAccrualDialog(item);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteAccrual(item);
            }}
            disabled={item.type === 'system'}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Entity selector component (for source/recipient selection)
  const EntitySelector = ({
    value,
    onChange,
    label,
  }: {
    value: EntityReference;
    onChange: (value: EntityReference) => void;
    label: string;
  }) => {
    const [selectedType, setSelectedType] = useState<EntityType>(value.type || 'safe');
    const [selectedId, setSelectedId] = useState<string>(value.id || '');

    const availableEntities =
      selectedType === 'safe'
        ? mockSafes.map((s) => ({ id: s.id, name: s.name }))
        : mockCounterparties.map((c) => ({ id: c.id, name: c.name }));

    const handleTypeChange = (type: EntityType) => {
      setSelectedType(type);
      setSelectedId('');
      onChange({ type, id: '', name: '' });
    };

    const handleIdChange = (id: string) => {
      setSelectedId(id);
      const entity = availableEntities.find((e) => e.id === id);
      if (entity) {
        onChange({ type: selectedType, id, name: entity.name });
      }
    };

    return (
      <div className="space-y-2">
        <FormLabel>{label}</FormLabel>
        <div className="grid grid-cols-2 gap-2">
          <Select value={selectedType} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="safe">{t('finance.purposes.safe')}</SelectItem>
              <SelectItem value="counterparty">{t('finance.purposes.counterparty')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedId} onValueChange={handleIdChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('finance.purposes.selectEntity')} />
            </SelectTrigger>
            <SelectContent>
              {availableEntities.map((entity) => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  // Transaction Template form fields
  const TransactionFormFields = () => {
    const hasAdditionalRestriction = transactionForm.watch('hasAdditionalRestriction');

    return (
      <>
        <FormField
          control={transactionForm.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('finance.purposes.name')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('finance.purposes.namePlaceholder')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={transactionForm.control}
            name="activityType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('finance.purposes.activityType')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(activityTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={transactionForm.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('finance.purposes.type')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="system">{t('finance.transactions.system')}</SelectItem>
                    <SelectItem value="custom">{t('finance.transactions.user')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={transactionForm.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <EntitySelector
                value={field.value}
                onChange={field.onChange}
                label={t('finance.purposes.source')}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={transactionForm.control}
          name="recipient"
          render={({ field }) => (
            <FormItem>
              <EntitySelector
                value={field.value}
                onChange={field.onChange}
                label={t('finance.purposes.recipient')}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={transactionForm.control}
          name="posAccess"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">{t('finance.purposes.posAccess')}</FormLabel>
            </FormItem>
          )}
        />

        <FormField
          control={transactionForm.control}
          name="hasAdditionalRestriction"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">{t('finance.purposes.hasAdditionalRestriction')}</FormLabel>
            </FormItem>
          )}
        />

        {hasAdditionalRestriction && (
          <div className="space-y-4 border-l-2 border-muted pl-4">
            <p className="text-sm text-muted-foreground">{t('finance.purposes.additionalSourceRecipient')}</p>
            <FormField
              control={transactionForm.control}
              name="additionalSource"
              render={({ field }) => (
                <FormItem>
                  <EntitySelector
                    value={field.value || { type: 'safe', id: '', name: '' }}
                    onChange={field.onChange}
                    label={t('finance.purposes.additionalSource')}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={transactionForm.control}
              name="additionalRecipient"
              render={({ field }) => (
                <FormItem>
                  <EntitySelector
                    value={field.value || { type: 'safe', id: '', name: '' }}
                    onChange={field.onChange}
                    label={t('finance.purposes.additionalRecipient')}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </>
    );
  };

  // Accrual form fields
  const AccrualFormFields = () => {
    const hasAdditionalCondition = accrualForm.watch('hasAdditionalCondition');

    return (
      <>
        <FormField
          control={accrualForm.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('finance.purposes.name')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('finance.purposes.namePlaceholder')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={accrualForm.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('finance.purposes.type')}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="system">{t('finance.transactions.system')}</SelectItem>
                  <SelectItem value="custom">{t('finance.transactions.user')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={accrualForm.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <EntitySelector
                value={field.value}
                onChange={field.onChange}
                label={t('finance.purposes.source')}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={accrualForm.control}
          name="recipient"
          render={({ field }) => (
            <FormItem>
              <EntitySelector
                value={field.value}
                onChange={field.onChange}
                label={t('finance.purposes.recipient')}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={accrualForm.control}
          name="hasAdditionalCondition"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">{t('finance.purposes.hasAdditionalCondition')}</FormLabel>
            </FormItem>
          )}
        />

        {hasAdditionalCondition && (
          <div className="space-y-4 border-l-2 border-muted pl-4">
            <p className="text-sm text-muted-foreground">{t('finance.purposes.additionalSourceRecipient')}</p>
            <FormField
              control={accrualForm.control}
              name="additionalSource"
              render={({ field }) => (
                <FormItem>
                  <EntitySelector
                    value={field.value || { type: 'safe', id: '', name: '' }}
                    onChange={field.onChange}
                    label={t('finance.purposes.additionalSource')}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={accrualForm.control}
              name="additionalRecipient"
              render={({ field }) => (
                <FormItem>
                  <EntitySelector
                    value={field.value || { type: 'safe', id: '', name: '' }}
                    onChange={field.onChange}
                    label={t('finance.purposes.additionalRecipient')}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        {/* Header with title and description */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{t('finance.purposes.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('finance.purposes.description')}
          </p>
        </div>

        {/* Controls: Toggle Group | Search | Filters | Create Button */}
        <div className="flex items-center gap-4">
          {/* Toggle Group */}
          <ToggleGroup
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'transactions' | 'accruals')}
            options={[
              { value: 'transactions', label: t('finance.purposes.transactions') },
              { value: 'accruals', label: t('finance.purposes.accruals') },
            ]}
          />

          {/* Search - fills available space */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('finance.purposes.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('finance.purposes.source')}</SelectItem>
              <SelectItem disabled>--- {t('finance.purposes.safe')} ---</SelectItem>
              {mockSafes.map((s) => (
                <SelectItem key={s.id} value={`s-${s.id}`}>
                  {s.name}
                </SelectItem>
              ))}
              <SelectItem disabled>--- {t('finance.purposes.counterparty')} ---</SelectItem>
              {mockCounterparties.map((c) => (
                <SelectItem key={c.id} value={`c-${c.id}`}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={recipientFilter} onValueChange={setRecipientFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('finance.purposes.recipient')}</SelectItem>
              <SelectItem disabled>--- {t('finance.purposes.safe')} ---</SelectItem>
              {mockSafes.map((s) => (
                <SelectItem key={s.id} value={`s-${s.id}`}>
                  {s.name}
                </SelectItem>
              ))}
              <SelectItem disabled>--- {t('finance.purposes.counterparty')} ---</SelectItem>
              {mockCounterparties.map((c) => (
                <SelectItem key={c.id} value={`c-${c.id}`}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeTab === 'transactions' && (
            <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('finance.purposes.allActivityTypes')}</SelectItem>
                {Object.entries(activityTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Reset Filters Button - shown when any filter is active */}
          {(sourceFilter !== 'all' ||
            recipientFilter !== 'all' ||
            (activeTab === 'transactions' && activityTypeFilter !== 'all')) && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSourceFilter('all');
                setRecipientFilter('all');
                setActivityTypeFilter('all');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* Create Button */}
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('actions.create')}
          </Button>
        </div>
      </Card>

      <Card>
        <DataTable
          data={activeTab === 'transactions' ? filteredTransactions : filteredAccruals}
          columns={activeTab === 'transactions' ? transactionColumns : accrualColumns}
          emptyMessage={
            activeTab === 'transactions'
              ? t('finance.purposes.emptyTemplates')
              : t('finance.purposes.emptyAccruals')
          }
          pagination={{ enabled: true, pageSize: 15 }}
        />
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activeTab === 'transactions' ? t('finance.purposes.createTemplate') : t('finance.purposes.createAccrual')}
            </DialogTitle>
            <DialogDescription>
              {activeTab === 'transactions'
                ? t('finance.purposes.createTemplateDescription')
                : t('finance.purposes.createAccrualDescription')}
            </DialogDescription>
          </DialogHeader>
          {activeTab === 'transactions' ? (
            <Form {...transactionForm}>
              <form
                onSubmit={transactionForm.handleSubmit(handleCreateTransaction)}
                className="space-y-4"
              >
                <TransactionFormFields />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    {t('actions.cancel')}
                  </Button>
                  <Button type="submit">{t('actions.create')}</Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <Form {...accrualForm}>
              <form onSubmit={accrualForm.handleSubmit(handleCreateAccrual)} className="space-y-4">
                <AccrualFormFields />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    {t('actions.cancel')}
                  </Button>
                  <Button type="submit">{t('actions.create')}</Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activeTab === 'transactions' ? t('finance.purposes.editTemplate') : t('finance.purposes.editAccrual')}
            </DialogTitle>
            <DialogDescription>
              {activeTab === 'transactions'
                ? t('finance.purposes.editTemplateDescription')
                : t('finance.purposes.editAccrualDescription')}
            </DialogDescription>
          </DialogHeader>
          {activeTab === 'transactions' ? (
            <Form {...transactionForm}>
              <form
                onSubmit={transactionForm.handleSubmit(handleEditTransaction)}
                className="space-y-4"
              >
                <TransactionFormFields />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    {t('actions.cancel')}
                  </Button>
                  <Button type="submit">{t('actions.save')}</Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <Form {...accrualForm}>
              <form onSubmit={accrualForm.handleSubmit(handleEditAccrual)} className="space-y-4">
                <AccrualFormFields />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    {t('actions.cancel')}
                  </Button>
                  <Button type="submit">{t('actions.save')}</Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
