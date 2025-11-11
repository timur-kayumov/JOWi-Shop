'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Search, Trash2 } from 'lucide-react';
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
} from '@jowi/ui';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/toast';

// Types
type CounterpartyType = 'system' | 'custom';
type AutoChargeStatus = 'enabled' | 'disabled';

interface Counterparty {
  id: string;
  name: string;
  balance: number;
  type: CounterpartyType;
  autoChargeStatus: AutoChargeStatus;
  autoChargePeriod?: number; // в днях
  autoChargeAmount?: number;
}

// Validation schema
const createCounterpartySchema = z.object({
  name: z.string().min(2, 'finance.counterparties.validation.nameMin').max(100, 'finance.counterparties.validation.nameMax'),
  type: z.enum(['system', 'custom']),
  balance: z.number().default(0),
  autoChargeStatus: z.enum(['enabled', 'disabled']).default('disabled'),
  autoChargePeriod: z.number().optional(),
  autoChargeAmount: z.number().optional(),
});

type CreateCounterpartyInput = z.infer<typeof createCounterpartySchema>;

// Mock data
const mockCounterparties: Counterparty[] = [
  {
    id: '1',
    name: 'ООО "Поставщик продуктов"',
    balance: -5000000,
    type: 'custom',
    autoChargeStatus: 'enabled',
    autoChargePeriod: 30,
    autoChargeAmount: 1000000,
  },
  {
    id: '2',
    name: 'ИП Иванов А.А.',
    balance: 2500000,
    type: 'custom',
    autoChargeStatus: 'disabled',
  },
  {
    id: '3',
    name: 'Системный контрагент (Касса)',
    balance: 0,
    type: 'system',
    autoChargeStatus: 'disabled',
  },
  {
    id: '4',
    name: 'ООО "Аренда помещений"',
    balance: -15000000,
    type: 'custom',
    autoChargeStatus: 'enabled',
    autoChargePeriod: 30,
    autoChargeAmount: 5000000,
  },
  {
    id: '5',
    name: 'ИП Петров В.В.',
    balance: 8500000,
    type: 'custom',
    autoChargeStatus: 'enabled',
    autoChargePeriod: 7,
    autoChargeAmount: 500000,
  },
  {
    id: '6',
    name: 'Системный контрагент (Банк)',
    balance: 0,
    type: 'system',
    autoChargeStatus: 'disabled',
  },
  {
    id: '7',
    name: 'ООО "Коммунальные услуги"',
    balance: -3000000,
    type: 'custom',
    autoChargeStatus: 'enabled',
    autoChargePeriod: 30,
    autoChargeAmount: 1500000,
  },
];

export default function CounterpartiesPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;
  const { t } = useTranslation('common');

  const [data, setData] = useState<Counterparty[]>(mockCounterparties);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const createForm = useForm<CreateCounterpartyInput>({
    resolver: zodResolver(createCounterpartySchema),
    defaultValues: {
      name: '',
      type: 'custom',
      balance: 0,
      autoChargeStatus: 'disabled',
      autoChargePeriod: undefined,
      autoChargeAmount: undefined,
    },
  });

  const filteredData = data.filter((counterparty) => {
    const matchesSearch = counterparty.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || counterparty.type === typeFilter;
    const matchesStatus =
      statusFilter === 'all' || counterparty.autoChargeStatus === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCreate = (formData: CreateCounterpartyInput) => {
    const newCounterparty: Counterparty = {
      id: String(data.length + 1),
      name: formData.name,
      balance: formData.balance,
      type: formData.type,
      autoChargeStatus: formData.autoChargeStatus,
      autoChargePeriod: formData.autoChargePeriod,
      autoChargeAmount: formData.autoChargeAmount,
    };
    setData([...data, newCounterparty]);
    toast.success(t('components.toast.success'), `${formData.name} ${t('finance.counterparties.createSuccess')}`);
    setIsCreateDialogOpen(false);
    createForm.reset();
  };

  const handleDelete = (counterparty: Counterparty) => {
    if (window.confirm(t('finance.counterparties.deleteConfirm'))) {
      setData(data.filter((c) => c.id !== counterparty.id));
      toast.success(t('actions.delete'), t('finance.counterparties.deleteSuccess'));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' ' + t('currency');
  };

  const counterpartyTypeLabels: Record<CounterpartyType, string> = {
    system: t('finance.counterparties.system'),
    custom: t('finance.counterparties.custom'),
  };

  const columns: Column<Counterparty>[] = [
    {
      key: 'name',
      label: t('finance.counterparties.name'),
      sortable: true,
      render: (counterparty) => <span className="font-medium">{counterparty.name}</span>,
    },
    {
      key: 'balance',
      label: t('finance.counterparties.balance'),
      sortable: true,
      render: (counterparty) => (
        <span
          className={`font-medium ${counterparty.balance > 0 ? 'text-green-600' : counterparty.balance < 0 ? 'text-red-600' : 'text-muted-foreground'}`}
        >
          {formatCurrency(counterparty.balance)}
        </span>
      ),
    },
    {
      key: 'type',
      label: t('finance.counterparties.type'),
      render: (counterparty) => (
        <Badge variant={counterparty.type === 'system' ? 'secondary' : 'default'}>
          {counterpartyTypeLabels[counterparty.type]}
        </Badge>
      ),
    },
    {
      key: 'autoChargeStatus',
      label: t('finance.counterparties.autoCharge'),
      render: (counterparty) => (
        <StatusBadge
          type="boolean"
          status={counterparty.autoChargeStatus}
          t={t}
        />
      ),
    },
    {
      key: 'autoChargePeriod',
      label: t('finance.counterparties.period'),
      render: (counterparty) => (
        <span className="text-sm text-muted-foreground">
          {counterparty.autoChargePeriod ? `${counterparty.autoChargePeriod} ${t('finance.counterparties.periodDays')}` : '-'}
        </span>
      ),
    },
    {
      key: 'autoChargeAmount',
      label: t('finance.counterparties.amount'),
      render: (counterparty) => (
        <span className="text-sm">
          {counterparty.autoChargeAmount ? formatCurrency(counterparty.autoChargeAmount) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: t('fields.actions'),
      render: (counterparty) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(counterparty);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{t('finance.counterparties.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('finance.counterparties.description')}
          </p>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('finance.counterparties.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('finance.counterparties.allTypes')}</SelectItem>
              <SelectItem value="system">{t('finance.counterparties.system')}</SelectItem>
              <SelectItem value="custom">{t('finance.counterparties.custom')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('finance.counterparties.allStatuses')}</SelectItem>
              <SelectItem value="enabled">{t('status.enabled')}</SelectItem>
              <SelectItem value="disabled">{t('status.disabled')}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('finance.counterparties.createCounterparty')}
          </Button>
        </div>
      </Card>

      <Card>
        <DataTable
          data={filteredData}
          columns={columns}
          onRowClick={(counterparty) =>
            router.push(`/store/${storeId}/finance/counterparties/${counterparty.id}`)
          }
          emptyMessage={t('finance.counterparties.emptyMessage')}
          pagination={{ enabled: true, pageSize: 15 }}
        />
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('finance.counterparties.createCounterparty')}</DialogTitle>
            <DialogDescription>
              {t('finance.counterparties.createCounterpartyDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <FormField
                control={createForm.control}
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
                  control={createForm.control}
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
                  control={createForm.control}
                  name="balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('finance.counterparties.initialBalance')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="0"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  {t('actions.cancel')}
                </Button>
                <Button type="submit">{t('actions.create')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
