'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
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
  DatePicker,
  Switch,
} from '@jowi/ui';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/toast';

// Types
type CounterpartyType = 'system' | 'custom';
type AutoChargeStatus = 'enabled' | 'disabled';
type PeriodUnit = 'days' | 'months';

interface Counterparty {
  id: string;
  name: string;
  balance: number;
  type: CounterpartyType;
  autoChargeStatus: AutoChargeStatus;
  autoChargePeriod?: number;
  autoChargePeriodUnit?: PeriodUnit;
  autoChargeAmount?: number;
  autoChargeStartDate?: Date;
  autoChargeStartTime?: string; // HH:MM format
  createdAt: Date;
}

// Validation schema
const createCounterpartySchema = z
  .object({
    name: z
      .string()
      .min(2, 'finance.counterparties.validation.nameMin')
      .max(100, 'finance.counterparties.validation.nameMax'),
    type: z.enum(['system', 'custom']),
    balance: z.number().default(0),
    autoChargeStatus: z.enum(['enabled', 'disabled']).default('disabled'),
    autoChargePeriod: z.number().min(1).max(365).optional(),
    autoChargePeriodUnit: z.enum(['days', 'months']).optional(),
    autoChargeAmount: z.number().positive().optional(),
    autoChargeStartDate: z.date().optional(),
    autoChargeStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  })
  .refine(
    (data) => {
      if (data.autoChargeStatus === 'enabled') {
        return (
          data.autoChargePeriod !== undefined &&
          data.autoChargePeriodUnit !== undefined &&
          data.autoChargeAmount !== undefined &&
          data.autoChargeAmount > 0
        );
      }
      return true;
    },
    {
      message: 'Период и сумма обязательны при включенном автоначислении',
      path: ['autoChargeAmount'],
    }
  );

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
    autoChargePeriodUnit: 'days',
    autoChargeAmount: 1000000,
    autoChargeStartDate: new Date('2025-11-15'),
    autoChargeStartTime: '09:00',
    createdAt: new Date('2024-01-10'),
  },
  {
    id: '2',
    name: 'ИП Иванов А.А.',
    balance: 2500000,
    type: 'custom',
    autoChargeStatus: 'disabled',
    createdAt: new Date('2024-02-15'),
  },
  {
    id: '3',
    name: 'Системный контрагент (Касса)',
    balance: 0,
    type: 'system',
    autoChargeStatus: 'disabled',
    createdAt: new Date('2024-03-20'),
  },
  {
    id: '4',
    name: 'ООО "Аренда помещений"',
    balance: -15000000,
    type: 'custom',
    autoChargeStatus: 'enabled',
    autoChargePeriod: 1,
    autoChargePeriodUnit: 'months',
    autoChargeAmount: 5000000,
    autoChargeStartDate: new Date('2025-11-20'),
    autoChargeStartTime: '10:00',
    createdAt: new Date('2024-04-25'),
  },
  {
    id: '5',
    name: 'ИП Петров В.В.',
    balance: 8500000,
    type: 'custom',
    autoChargeStatus: 'enabled',
    autoChargePeriod: 7,
    autoChargePeriodUnit: 'days',
    autoChargeAmount: 500000,
    autoChargeStartDate: new Date('2025-11-13'),
    autoChargeStartTime: '08:00',
    createdAt: new Date('2024-05-30'),
  },
  {
    id: '6',
    name: 'Системный контрагент (Банк)',
    balance: 0,
    type: 'system',
    autoChargeStatus: 'disabled',
    createdAt: new Date('2024-06-15'),
  },
  {
    id: '7',
    name: 'ООО "Коммунальные услуги"',
    balance: -3000000,
    type: 'custom',
    autoChargeStatus: 'enabled',
    autoChargePeriod: 1,
    autoChargePeriodUnit: 'months',
    autoChargeAmount: 1500000,
    autoChargeStartDate: new Date('2025-12-01'),
    autoChargeStartTime: '00:00',
    createdAt: new Date('2024-07-20'),
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
      autoChargePeriod: 1,
      autoChargePeriodUnit: 'days',
      autoChargeAmount: 0,
      autoChargeStartDate: undefined,
      autoChargeStartTime: '',
    },
  });

  const filteredData = useMemo(() => {
    const filtered = data.filter((counterparty) => {
      const matchesSearch = counterparty.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || counterparty.type === typeFilter;
      const matchesStatus =
        statusFilter === 'all' || counterparty.autoChargeStatus === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort by createdAt descending (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [data, search, typeFilter, statusFilter]);

  const handleCreate = (formData: CreateCounterpartyInput) => {
    const newCounterparty: Counterparty = {
      id: String(data.length + 1),
      name: formData.name,
      balance: formData.balance,
      type: formData.type,
      autoChargeStatus: formData.autoChargeStatus,
      autoChargePeriod: formData.autoChargePeriod,
      autoChargePeriodUnit: formData.autoChargePeriodUnit,
      autoChargeAmount: formData.autoChargeAmount,
      autoChargeStartDate: formData.autoChargeStartDate,
      autoChargeStartTime: formData.autoChargeStartTime,
      createdAt: new Date(),
    };
    setData([...data, newCounterparty]);
    toast.success(t('components.toast.success'), `${formData.name} ${t('finance.counterparties.createSuccess')}`);
    setIsCreateDialogOpen(false);
    createForm.reset();
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
      render: (counterparty) => {
        if (!counterparty.autoChargePeriod) return <span className="text-sm text-muted-foreground">-</span>;
        const unitKey = counterparty.autoChargePeriodUnit === 'months' ? 'periodMonths' : 'periodDays';
        return (
          <span className="text-sm text-muted-foreground">
            {counterparty.autoChargePeriod} {t(`finance.counterparties.${unitKey}`)}
          </span>
        );
      },
    },
    {
      key: 'autoChargeAmount',
      label: t('finance.counterparties.autoChargeAmount'),
      render: (counterparty) => (
        <span className="text-sm">
          {counterparty.autoChargeAmount ? formatCurrency(counterparty.autoChargeAmount) : '-'}
        </span>
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
                control={createForm.control}
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
              {createForm.watch('autoChargeStatus') === 'enabled' && (
                <div className="space-y-4 rounded-lg border p-4">
                  {/* Period fields */}
                  <FormField
                    control={createForm.control}
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
                            control={createForm.control}
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
                    control={createForm.control}
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
                      control={createForm.control}
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
                      control={createForm.control}
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
