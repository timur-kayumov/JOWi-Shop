# Резервная копия страниц Финансов
**Дата создания:** 2025-01-07
**Назначение:** Быстрое восстановление страниц после отката на последний коммит

## Список страниц:
1. **Сейфы** - `apps/web/src/app/store/[id]/finance/safes/page.tsx`
2. **Типы оплат** - `apps/web/src/app/store/[id]/finance/payment-types/page.tsx`
3. **Кассы** - `apps/web/src/app/store/[id]/finance/cash-registers/page.tsx`

---

## 1. Сейфы (Safes)
**Путь:** `apps/web/src/app/store/[id]/finance/safes/page.tsx`

```tsx
'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Plus, Search, ArrowUpCircle, ArrowDownCircle, ChevronRight } from 'lucide-react';
import {
  Button,
  Input,
  Badge,
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSafeSchema, updateSafeSchema, type CreateSafeSchema } from '@jowi/validators';
import type { Safe, SafeType } from '@jowi/types';
import { toast } from '@/lib/toast';

// Mock data
const mockSafes: Safe[] = [
  {
    id: '1',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    name: 'Касса наличные',
    type: 'cash',
    paymentMethod: 'cash',
    balance: 5000000,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    name: 'Расчётный счёт',
    type: 'bank_account',
    paymentMethod: 'transfer',
    accountNumber: '20208810200000000001',
    balance: 15000000,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    name: 'Эквайринг Uzcard',
    type: 'card_account',
    paymentMethod: 'card',
    accountNumber: '8600',
    balance: 8500000,
    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: '4',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    name: 'Резервный фонд',
    type: 'cash',
    paymentMethod: 'cash',
    balance: 2000000,
    isActive: false,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
  },
];

// Mock data for today's transactions per safe
const mockTodayTransactions: Record<string, { income: number; expense: number }> = {
  '1': { income: 12500000, expense: 8200000 },
  '2': { income: 5300000, expense: 2100000 },
  '3': { income: 9800000, expense: 1500000 },
  '4': { income: 0, expense: 0 },
};

export default function SafesPage() {
  const { t } = useTranslation(['finance', 'common']);
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;

  const [data, setData] = useState<Safe[]>(mockSafes);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const createForm = useForm<CreateSafeSchema>({
    resolver: zodResolver(createSafeSchema),
    defaultValues: {
      name: '',
      type: 'cash',
      paymentMethod: 'cash',
      accountNumber: '',
      balance: 0,
      storeId,
      isActive: true,
    },
  });

  const filteredData = data.filter((safe) => {
    const matchesSearch = safe.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || safe.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreate = (formData: CreateSafeSchema) => {
    const newSafe: Safe = {
      id: String(data.length + 1),
      tenantId: 'tenant-1',
      storeId,
      name: formData.name,
      type: formData.type as SafeType,
      paymentMethod: formData.paymentMethod,
      accountNumber: formData.accountNumber,
      balance: formData.balance,
      isActive: formData.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setData([...data, newSafe]);
    toast.success(t('common:actions.save'), `${formData.name} ${t('finance:safes.messages.created')}`);
    setIsCreateDialogOpen(false);
    createForm.reset();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' сум';
  };

  const watchedType = createForm.watch('type');

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('finance:safes.title')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('finance:safes.description')}
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('finance:safes.createButton')}
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('finance:safes.searchPlaceholder')}
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
              <SelectItem value="all">{t('finance:safes.filters.all')}</SelectItem>
              <SelectItem value="cash">{t('finance:safes.filters.cash')}</SelectItem>
              <SelectItem value="bank_account">{t('finance:safes.filters.bankAccount')}</SelectItem>
              <SelectItem value="card_account">{t('finance:safes.filters.cardAccount')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Cards Grid */}
      {filteredData.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            {t('finance:safes.noItems')}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((safe) => (
            <Card
              key={safe.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer relative"
              onClick={() => router.push(`/store/${storeId}/finance/safes/${safe.id}`)}
            >
              {/* Chevron Icon */}
              <div className="absolute top-6 right-6">
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* Safe Name with Status Badge */}
              <div className="flex items-start gap-3 mb-4 pr-12">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{safe.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {t(`finance:safes.types.${safe.type}`)}
                  </Badge>
                </div>
              </div>

              {/* Balance */}
              <div className="mb-4">
                <div className={`text-3xl font-bold ${safe.balance >= 0 ? 'text-foreground' : 'text-red-500'}`}>
                  {formatCurrency(safe.balance)}
                </div>
              </div>

              {/* Today's Transactions */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowDownCircle className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">Доход за день</span>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(mockTodayTransactions[safe.id]?.income || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle className="h-4 w-4 text-red-500" />
                    <span className="text-muted-foreground">Расход за день</span>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(mockTodayTransactions[safe.id]?.expense || 0)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('finance:safes.createDialog.title')}</DialogTitle>
            <DialogDescription>{t('finance:safes.createDialog.description')}</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('finance:safes.fields.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('finance:safes.placeholders.name')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('finance:safes.fields.startingBalance')}</FormLabel>
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

              <FormField
                control={createForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('finance:safes.fields.paymentMethod')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">{t('finance:paymentMethods.cash')}</SelectItem>
                        <SelectItem value="card">{t('finance:paymentMethods.card')}</SelectItem>
                        <SelectItem value="transfer">{t('finance:paymentMethods.transfer')}</SelectItem>
                        <SelectItem value="installment">{t('finance:paymentMethods.installment')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('finance:safes.fields.type')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">{t('finance:safes.types.cash')}</SelectItem>
                        <SelectItem value="bank_account">{t('finance:safes.types.bankAccount')}</SelectItem>
                        <SelectItem value="card_account">{t('finance:safes.types.cardAccount')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(watchedType === 'bank_account' || watchedType === 'card_account') && (
                <FormField
                  control={createForm.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('finance:safes.fields.accountNumber')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('finance:safes.placeholders.accountNumber')} />
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
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  {t('common:actions.cancel')}
                </Button>
                <Button type="submit">{t('common:actions.create')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## 2. Типы оплат (Payment Types)
**Путь:** `apps/web/src/app/store/[id]/finance/payment-types/page.tsx`

```tsx
'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
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
} from '@jowi/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPaymentTypeSchema, type CreatePaymentTypeSchema } from '@jowi/validators';
import type { PaymentType, Safe } from '@jowi/types';
import { toast } from '@/lib/toast';
import { ColorPickerPopover } from '@/components/color-picker-popover';

// Mock data для сейфов (должны приходить из API)
const mockSafes: Safe[] = [
  {
    id: '1',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    name: 'Касса наличные',
    type: 'cash',
    paymentMethod: 'cash',
    balance: 5000000,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    name: 'Расчётный счёт',
    type: 'bank_account',
    paymentMethod: 'transfer',
    accountNumber: '20208810200000000001',
    balance: 15000000,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    name: 'Эквайринг Uzcard',
    type: 'card_account',
    paymentMethod: 'card',
    accountNumber: '8600',
    balance: 8500000,
    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
];

// Mock data для типов оплат
const mockPaymentTypes: PaymentType[] = [
  {
    id: '1',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    safeId: '1',
    name: 'Наличные',
    icon: 'Wallet',
    color: '#10B981',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    safeId: '3',
    name: 'Карта Uzcard',
    icon: 'CreditCard',
    color: '#3B82F6',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    safeId: '3',
    name: 'Карта Humo',
    icon: 'CreditCard',
    color: '#EF4444',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
  },
  {
    id: '4',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    safeId: '2',
    name: 'Payme',
    icon: 'Smartphone',
    color: '#06B6D4',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: '5',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    safeId: '2',
    name: 'Click',
    icon: 'Smartphone',
    color: '#8B5CF6',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
];

export default function PaymentTypesPage() {
  const { t } = useTranslation(['finance', 'common']);
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;

  const [data, setData] = useState<PaymentType[]>(mockPaymentTypes);
  const [search, setSearch] = useState('');
  const [safeFilter, setSafeFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentType | null>(null);

  const createForm = useForm<CreatePaymentTypeSchema>({
    resolver: zodResolver(createPaymentTypeSchema),
    defaultValues: {
      name: '',
      safeId: '',
      icon: '',
      color: '#3B82F6',
      storeId,
    },
  });

  const editForm = useForm<CreatePaymentTypeSchema>({
    resolver: zodResolver(createPaymentTypeSchema),
    defaultValues: {
      name: '',
      safeId: '',
      icon: '',
      color: '#3B82F6',
      storeId,
    },
  });

  const filteredData = data.filter((paymentType) => {
    const matchesSearch = paymentType.name.toLowerCase().includes(search.toLowerCase());
    const matchesSafe = safeFilter === 'all' || paymentType.safeId === safeFilter;
    return matchesSearch && matchesSafe;
  });

  const handleCreate = (formData: CreatePaymentTypeSchema) => {
    const newPaymentType: PaymentType = {
      id: String(data.length + 1),
      tenantId: 'tenant-1',
      storeId,
      safeId: formData.safeId,
      name: formData.name,
      icon: formData.icon,
      color: formData.color,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setData([...data, newPaymentType]);
    toast.success(t('common:actions.save'), `${formData.name} ${t('finance:paymentTypes.messages.created')}`);
    setIsCreateDialogOpen(false);
    createForm.reset();
  };

  const handleEdit = (formData: CreatePaymentTypeSchema) => {
    if (!selectedPaymentType) return;

    setData(
      data.map((pt) =>
        pt.id === selectedPaymentType.id
          ? {
              ...pt,
              name: formData.name,
              safeId: formData.safeId,
              icon: formData.icon,
              color: formData.color,
              updatedAt: new Date(),
            }
          : pt
      )
    );
    toast.success(t('common:actions.save'), t('finance:paymentTypes.messages.updated'));
    setIsEditDialogOpen(false);
    setSelectedPaymentType(null);
    editForm.reset();
  };

  const handleDelete = (paymentType: PaymentType) => {
    if (window.confirm(t('finance:paymentTypes.deleteDialog.title'))) {
      setData(data.filter((pt) => pt.id !== paymentType.id));
      toast.success(t('common:actions.delete'), t('finance:paymentTypes.messages.deleted'));
    }
  };

  const openEditDialog = (paymentType: PaymentType) => {
    setSelectedPaymentType(paymentType);
    editForm.reset({
      name: paymentType.name,
      safeId: paymentType.safeId,
      icon: paymentType.icon || '',
      color: paymentType.color || '',
      storeId,
    });
    setIsEditDialogOpen(true);
  };

  const getSafeByPaymentType = (paymentType: PaymentType): Safe | undefined => {
    return mockSafes.find((s) => s.id === paymentType.safeId);
  };

  const columns: Column<PaymentType>[] = [
    {
      key: 'name',
      label: t('finance:paymentTypes.fields.name'),
      sortable: true,
      render: (paymentType) => (
        <div className="flex items-center gap-2">
          {paymentType.color && (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: paymentType.color }}
            />
          )}
          <span className="font-medium">{paymentType.name}</span>
        </div>
      ),
    },
    {
      key: 'safe',
      label: t('finance:paymentTypes.fields.safe'),
      render: (paymentType) => {
        const safe = getSafeByPaymentType(paymentType);
        return safe ? (
          <span className="text-sm">{safe.name}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      key: 'paymentMethod',
      label: t('finance:paymentTypes.fields.paymentMethod'),
      render: (paymentType) => {
        const safe = getSafeByPaymentType(paymentType);
        return safe ? (
          <span className="text-sm">{t(`finance:paymentMethods.${safe.paymentMethod}`)}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      key: 'actions',
      label: t('common:actions.edit'),
      render: (paymentType) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(paymentType);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(paymentType);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const PaymentTypeFormFields = ({ form }: { form: ReturnType<typeof useForm<CreatePaymentTypeSchema>> }) => (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('finance:paymentTypes.fields.name')}</FormLabel>
            <FormControl>
              <Input {...field} placeholder={t('finance:paymentTypes.placeholders.name')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="safeId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('finance:paymentTypes.fields.safe')}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t('finance:paymentTypes.placeholders.safe')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {mockSafes.filter(s => s.isActive).map((safe) => (
                  <SelectItem key={safe.id} value={safe.id}>
                    {safe.name} ({t(`finance:paymentMethods.${safe.paymentMethod}`)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="color"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('finance:paymentTypes.fields.color')}</FormLabel>
            <FormControl>
              <ColorPickerPopover
                value={field.value}
                onChange={field.onChange}
                label={t('finance:paymentTypes.placeholders.color')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('finance:paymentTypes.title')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('finance:paymentTypes.description')}
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('finance:paymentTypes.createButton')}
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('finance:paymentTypes.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={safeFilter} onValueChange={setSafeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('finance:paymentTypes.filters.all')}</SelectItem>
              {mockSafes.map((safe) => (
                <SelectItem key={safe.id} value={safe.id}>
                  {safe.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <DataTable
          data={filteredData}
          columns={columns}
          emptyMessage={t('finance:paymentTypes.noItems')}
          pagination={{ enabled: true, pageSize: 15 }}
        />
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('finance:paymentTypes.createDialog.title')}</DialogTitle>
            <DialogDescription>{t('finance:paymentTypes.createDialog.description')}</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <PaymentTypeFormFields form={createForm} />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  {t('common:actions.cancel')}
                </Button>
                <Button type="submit">{t('common:actions.create')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('finance:paymentTypes.editDialog.title')}</DialogTitle>
            <DialogDescription>{t('finance:paymentTypes.editDialog.description')}</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
              <PaymentTypeFormFields form={editForm} />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  {t('common:actions.cancel')}
                </Button>
                <Button type="submit">{t('common:actions.save')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## 3. Кассы (Cash Registers)
**Путь:** `apps/web/src/app/store/[id]/finance/cash-registers/page.tsx`

```tsx
'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
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
} from '@jowi/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTerminalSchema } from '@jowi/validators';
import type { z } from 'zod';

type CreateTerminalInput = z.infer<typeof createTerminalSchema>;
import type { Terminal, PaymentType } from '@jowi/types';
import { toast } from '@/lib/toast';

// Mock data для типов оплат
const mockPaymentTypes: PaymentType[] = [
  {
    id: '1',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    safeId: '1',
    name: 'Наличные',
    icon: 'Wallet',
    color: '#10B981',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    safeId: '3',
    name: 'Карта Uzcard',
    icon: 'CreditCard',
    color: '#3B82F6',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    safeId: '3',
    name: 'Карта Humo',
    icon: 'CreditCard',
    color: '#EF4444',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
  },
  {
    id: '4',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    safeId: '2',
    name: 'Payme',
    icon: 'Smartphone',
    color: '#06B6D4',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: '5',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    safeId: '2',
    name: 'Click',
    icon: 'Smartphone',
    color: '#8B5CF6',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
];

// Расширенный тип Terminal с привязанными типами оплат
type TerminalWithPaymentTypes = Terminal & {
  paymentTypeIds: string[];
};

// Mock data для касс
const mockTerminals: TerminalWithPaymentTypes[] = [
  {
    id: '1',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    name: 'Касса 1',
    deviceId: 'DEVICE-001',
    fiscalProviderId: 'FISCAL-001',
    settings: {
      scannerEnabled: true,
      touchMode: true,
      hotkeysEnabled: true,
    },
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    paymentTypeIds: ['1', '2', '3'],
  },
  {
    id: '2',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    name: 'Касса 2',
    deviceId: 'DEVICE-002',
    fiscalProviderId: 'FISCAL-002',
    settings: {
      scannerEnabled: true,
      touchMode: false,
      hotkeysEnabled: true,
    },
    isActive: true,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    paymentTypeIds: ['1', '4', '5'],
  },
  {
    id: '3',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    name: 'Касса 3 (резервная)',
    deviceId: 'DEVICE-003',
    settings: {
      scannerEnabled: false,
      touchMode: true,
      hotkeysEnabled: false,
    },
    isActive: false,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    paymentTypeIds: ['1'],
  },
];

export default function CashRegistersPage() {
  const { t } = useTranslation(['finance', 'common']);
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;

  const [data, setData] = useState<TerminalWithPaymentTypes[]>(mockTerminals);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTerminal, setSelectedTerminal] = useState<TerminalWithPaymentTypes | null>(null);
  const [selectedPaymentTypes, setSelectedPaymentTypes] = useState<string[]>([]);

  const createForm = useForm<CreateTerminalInput>({
    resolver: zodResolver(createTerminalSchema),
    defaultValues: {
      name: '',
      deviceId: '',
      storeId,
      fiscalProviderId: '',
      settings: {},
      isActive: true,
    },
  });

  const editForm = useForm<CreateTerminalInput>({
    resolver: zodResolver(createTerminalSchema),
    defaultValues: {
      name: '',
      deviceId: '',
      storeId,
      fiscalProviderId: '',
      settings: {},
      isActive: true,
    },
  });

  const filteredData = data.filter((terminal) => {
    const matchesSearch =
      terminal.name.toLowerCase().includes(search.toLowerCase()) ||
      terminal.deviceId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && terminal.isActive) ||
      (statusFilter === 'inactive' && !terminal.isActive);
    return matchesSearch && matchesStatus;
  });

  const handleCreate = (formData: CreateTerminalInput) => {
    const newTerminal: TerminalWithPaymentTypes = {
      id: String(data.length + 1),
      tenantId: 'tenant-1',
      storeId,
      name: formData.name,
      deviceId: formData.deviceId,
      fiscalProviderId: formData.fiscalProviderId,
      settings: formData.settings || {},
      isActive: formData.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
      paymentTypeIds: selectedPaymentTypes,
    };
    setData([...data, newTerminal]);
    toast.success(t('common:actions.save'), `${formData.name} ${t('finance:cashRegisters.messages.created')}`);
    setIsCreateDialogOpen(false);
    setSelectedPaymentTypes([]);
    createForm.reset();
  };

  const handleEdit = (formData: CreateTerminalInput) => {
    if (!selectedTerminal) return;

    setData(
      data.map((terminal) =>
        terminal.id === selectedTerminal.id
          ? {
              ...terminal,
              name: formData.name,
              deviceId: formData.deviceId,
              fiscalProviderId: formData.fiscalProviderId,
              isActive: formData.isActive,
              updatedAt: new Date(),
              paymentTypeIds: selectedPaymentTypes,
            }
          : terminal
      )
    );
    toast.success(t('common:actions.save'), t('finance:cashRegisters.messages.updated'));
    setIsEditDialogOpen(false);
    setSelectedTerminal(null);
    setSelectedPaymentTypes([]);
    editForm.reset();
  };

  const handleDelete = (terminal: TerminalWithPaymentTypes) => {
    if (window.confirm(t('finance:cashRegisters.deleteDialog.title'))) {
      setData(data.filter((t) => t.id !== terminal.id));
      toast.success(t('common:actions.delete'), t('finance:cashRegisters.messages.deleted'));
    }
  };

  const openEditDialog = (terminal: TerminalWithPaymentTypes) => {
    setSelectedTerminal(terminal);
    setSelectedPaymentTypes(terminal.paymentTypeIds || []);
    editForm.reset({
      name: terminal.name,
      deviceId: terminal.deviceId,
      storeId,
      fiscalProviderId: terminal.fiscalProviderId || '',
      settings: terminal.settings,
      isActive: terminal.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const togglePaymentType = (paymentTypeId: string) => {
    setSelectedPaymentTypes((prev) =>
      prev.includes(paymentTypeId)
        ? prev.filter((id) => id !== paymentTypeId)
        : [...prev, paymentTypeId]
    );
  };

  const getPaymentTypesByIds = (ids: string[]): PaymentType[] => {
    return mockPaymentTypes.filter((pt) => ids.includes(pt.id));
  };

  const columns: Column<TerminalWithPaymentTypes>[] = [
    {
      key: 'name',
      label: t('finance:cashRegisters.fields.name'),
      sortable: true,
      render: (terminal) => (
        <div>
          <div className="font-medium">{terminal.name}</div>
          <div className="text-sm text-muted-foreground">ID: {terminal.deviceId}</div>
        </div>
      ),
    },
    {
      key: 'fiscalProviderId',
      label: t('finance:cashRegisters.fields.fiscalProviderId'),
      render: (terminal) => (
        <span className="text-sm text-muted-foreground">
          {terminal.fiscalProviderId || '-'}
        </span>
      ),
    },
    {
      key: 'paymentTypes',
      label: t('finance:cashRegisters.fields.paymentTypes'),
      render: (terminal) => {
        const paymentTypes = getPaymentTypesByIds(terminal.paymentTypeIds || []);
        return paymentTypes.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {paymentTypes.map((pt) => (
              <Badge
                key={pt.id}
                variant="secondary"
                className="text-xs"
                style={{
                  borderLeft: `3px solid ${pt.color}`,
                }}
              >
                {pt.name}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            {t('finance:cashRegisters.noPaymentTypes')}
          </span>
        );
      },
    },
    {
      key: 'isActive',
      label: t('finance:cashRegisters.fields.isActive'),
      render: (terminal) => (
        <Badge variant={terminal.isActive ? 'default' : 'secondary'}>
          {terminal.isActive ? t('common:status.active') : t('common:status.inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: t('common:actions.edit'),
      render: (terminal) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(terminal);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(terminal);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const TerminalFormFields = ({
    form,
  }: {
    form: ReturnType<typeof useForm<CreateTerminalInput>>;
  }) => (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('finance:cashRegisters.fields.name')}</FormLabel>
            <FormControl>
              <Input {...field} placeholder={t('finance:cashRegisters.placeholders.name')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="deviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('finance:cashRegisters.fields.deviceId')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('finance:cashRegisters.placeholders.deviceId')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fiscalProviderId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('finance:cashRegisters.fields.fiscalProviderId')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('finance:cashRegisters.placeholders.fiscalProviderId')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-2">
        <FormLabel>{t('finance:cashRegisters.fields.paymentTypes')}</FormLabel>
        <p className="text-sm text-muted-foreground">
          {t('finance:cashRegisters.selectPaymentTypes')}
        </p>
        <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
          {mockPaymentTypes.map((paymentType) => (
            <div
              key={paymentType.id}
              className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md cursor-pointer"
              onClick={() => togglePaymentType(paymentType.id)}
            >
              <Checkbox
                checked={selectedPaymentTypes.includes(paymentType.id)}
                onCheckedChange={() => togglePaymentType(paymentType.id)}
              />
              <div className="flex items-center gap-2 flex-1">
                {paymentType.color && (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: paymentType.color }}
                  />
                )}
                <span className="text-sm font-medium">{paymentType.name}</span>
              </div>
            </div>
          ))}
        </div>
        {selectedPaymentTypes.length === 0 && (
          <p className="text-sm text-destructive">
            {t('finance:cashRegisters.messages.selectAtLeastOne')}
          </p>
        )}
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('finance:cashRegisters.title')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('finance:cashRegisters.description')}
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('finance:cashRegisters.createButton')}
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('finance:cashRegisters.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('finance:cashRegisters.filters.all')}</SelectItem>
              <SelectItem value="active">
                {t('finance:cashRegisters.filters.active')}
              </SelectItem>
              <SelectItem value="inactive">
                {t('finance:cashRegisters.filters.inactive')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <DataTable
          data={filteredData}
          columns={columns}
          onRowClick={(terminal) =>
            router.push(`/store/${storeId}/finance/cash-registers/${terminal.id}`)
          }
          emptyMessage={t('finance:cashRegisters.noItems')}
          pagination={{ enabled: true, pageSize: 15 }}
        />
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('finance:cashRegisters.createDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('finance:cashRegisters.createDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <TerminalFormFields form={createForm} />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setSelectedPaymentTypes([]);
                  }}
                >
                  {t('common:actions.cancel')}
                </Button>
                <Button type="submit" disabled={selectedPaymentTypes.length === 0}>
                  {t('common:actions.create')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('finance:cashRegisters.editDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('finance:cashRegisters.editDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
              <TerminalFormFields form={editForm} />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedPaymentTypes([]);
                  }}
                >
                  {t('common:actions.cancel')}
                </Button>
                <Button type="submit" disabled={selectedPaymentTypes.length === 0}>
                  {t('common:actions.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## Инструкция по восстановлению

После отката на последний коммит, чтобы восстановить эти три страницы:

1. **Создать директории** (если их нет):
   ```bash
   mkdir -p apps/web/src/app/store/[id]/finance/safes
   mkdir -p apps/web/src/app/store/[id]/finance/payment-types
   mkdir -p apps/web/src/app/store/[id]/finance/cash-registers
   ```

2. **Скопировать код**:
   - Код для каждой страницы находится в соответствующих разделах выше
   - Создать файл `page.tsx` в каждой директории
   - Вставить соответствующий код

3. **Проверить импорты**:
   - Все импорты из `@jowi/ui`, `@jowi/validators`, `@jowi/types` должны работать
   - Компонент `ColorPickerPopover` используется в payment-types

4. **Особенности**:
   - Все три страницы используют mock data
   - Используют React Hook Form + Zod валидацию
   - Следуют единому стилю дизайна (INDEX_PAGES_UI_GUIDE.md)
   - Полностью функциональны с i18n поддержкой (RU/UZ)

---

**Примечание:** Этот файл создан только для резервного копирования. После успешного восстановления страниц, этот файл можно удалить.
