'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Input,
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
import { z } from 'zod';
import { toast } from '@/lib/toast';
import { ColorPickerPopover } from '@/components/color-picker-popover';

// Types and validation schema
type SafeType = 'cash' | 'bank_account' | 'card_account';

interface Safe {
  id: string;
  name: string;
  type: SafeType;
  accountNumber?: string;
  balance: number;
  isActive: boolean;
}

interface PaymentType {
  id: string;
  safeId: string;
  name: string;
  icon?: string;
  color?: string;
}

// Validation schema (shared with backend)
// Note: Error messages are hardcoded here but will be overridden by form-level validation
const createPaymentTypeSchema = z.object({
  safeId: z.string().uuid('Invalid safe ID'),
  name: z.string().min(2, 'Minimum 2 characters').max(100, 'Maximum 100 characters'),
  icon: z.string().optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6})$/, 'Color must be in #RRGGBB format').optional(),
});

type CreatePaymentTypeInput = z.infer<typeof createPaymentTypeSchema>;

// Mock data для сейфов
const mockSafes: Safe[] = [
  {
    id: '1',
    name: 'Касса наличные',
    type: 'cash',
    balance: 5000000,
    isActive: true,
  },
  {
    id: '2',
    name: 'Расчётный счёт',
    type: 'bank_account',
    accountNumber: '20208810200000000001',
    balance: 15000000,
    isActive: true,
  },
  {
    id: '3',
    name: 'Эквайринг Uzcard',
    type: 'card_account',
    accountNumber: '8600',
    balance: 8500000,
    isActive: true,
  },
];

// Mock data для типов оплат
const mockPaymentTypes: PaymentType[] = [
  {
    id: '1',
    safeId: '1',
    name: 'Наличные',
    icon: 'Wallet',
    color: '#10B981',
  },
  {
    id: '2',
    safeId: '3',
    name: 'Карта Uzcard',
    icon: 'CreditCard',
    color: '#3B82F6',
  },
  {
    id: '3',
    safeId: '3',
    name: 'Карта Humo',
    icon: 'CreditCard',
    color: '#EF4444',
  },
  {
    id: '4',
    safeId: '2',
    name: 'Payme',
    icon: 'Smartphone',
    color: '#06B6D4',
  },
  {
    id: '5',
    safeId: '2',
    name: 'Click',
    icon: 'Smartphone',
    color: '#8B5CF6',
  },
];

export default function PaymentTypesPage() {
  const params = useParams();
  const storeId = params.id as string;
  const { t } = useTranslation('common');

  const [data, setData] = useState<PaymentType[]>(mockPaymentTypes);
  const [search, setSearch] = useState('');
  const [safeFilter, setSafeFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentType | null>(null);

  const createForm = useForm<CreatePaymentTypeInput>({
    resolver: zodResolver(createPaymentTypeSchema),
    defaultValues: {
      name: '',
      safeId: '',
      icon: '',
      color: '#3B82F6',
    },
  });

  const editForm = useForm<CreatePaymentTypeInput>({
    resolver: zodResolver(createPaymentTypeSchema),
    defaultValues: {
      name: '',
      safeId: '',
      icon: '',
      color: '#3B82F6',
    },
  });

  const filteredData = data.filter((paymentType) => {
    const matchesSearch = paymentType.name.toLowerCase().includes(search.toLowerCase());
    const matchesSafe = safeFilter === 'all' || paymentType.safeId === safeFilter;
    return matchesSearch && matchesSafe;
  });

  const handleCreate = (formData: CreatePaymentTypeInput) => {
    const newPaymentType: PaymentType = {
      id: String(data.length + 1),
      safeId: formData.safeId,
      name: formData.name,
      icon: formData.icon,
      color: formData.color,
    };
    setData([...data, newPaymentType]);
    toast.success(t('components.toast.success'), `${formData.name} ${t('messages.saved').toLowerCase()}`);
    setIsCreateDialogOpen(false);
    createForm.reset();
  };

  const handleEdit = (formData: CreatePaymentTypeInput) => {
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
            }
          : pt
      )
    );
    toast.success(t('components.toast.success'), t('finance.paymentTypes.deleteSuccess'));
    setIsEditDialogOpen(false);
    setSelectedPaymentType(null);
    editForm.reset();
  };

  const handleDelete = (paymentType: PaymentType) => {
    if (window.confirm(t('finance.paymentTypes.deleteConfirm'))) {
      setData(data.filter((pt) => pt.id !== paymentType.id));
      toast.success(t('messages.deleted'), t('finance.paymentTypes.deleteSuccess'));
    }
  };

  const openEditDialog = (paymentType: PaymentType) => {
    setSelectedPaymentType(paymentType);
    editForm.reset({
      name: paymentType.name,
      safeId: paymentType.safeId,
      icon: paymentType.icon || '',
      color: paymentType.color || '#3B82F6',
    });
    setIsEditDialogOpen(true);
  };

  const getSafeByPaymentType = (paymentType: PaymentType): Safe | undefined => {
    return mockSafes.find((s) => s.id === paymentType.safeId);
  };

  const getSafeTypeLabel = (type: SafeType): string => {
    const labels: Record<SafeType, string> = {
      cash: t('finance.safes.cash'),
      bank_account: t('finance.safes.bankAccount'),
      card_account: t('finance.safes.cardAccount'),
    };
    return labels[type];
  };

  const columns: Column<PaymentType>[] = [
    {
      key: 'name',
      label: t('finance.paymentTypes.name'),
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
      label: t('finance.paymentTypes.safe'),
      render: (paymentType) => {
        const safe = getSafeByPaymentType(paymentType);
        return safe ? (
          <div>
            <div className="text-sm font-medium">{safe.name}</div>
            <div className="text-xs text-muted-foreground">{getSafeTypeLabel(safe.type)}</div>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      key: 'actions',
      label: t('fields.actions'),
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

  const PaymentTypeFormFields = ({ form }: { form: ReturnType<typeof useForm<CreatePaymentTypeInput>> }) => (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('finance.paymentTypes.name')}</FormLabel>
            <FormControl>
              <Input {...field} placeholder={t('finance.paymentTypes.namePlaceholder')} />
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
            <FormLabel>{t('finance.paymentTypes.safe')}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t('finance.paymentTypes.safePlaceholder')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {mockSafes.filter(s => s.isActive).map((safe) => (
                  <SelectItem key={safe.id} value={safe.id}>
                    {safe.name} ({getSafeTypeLabel(safe.type)})
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
            <FormLabel>{t('finance.paymentTypes.color')}</FormLabel>
            <FormControl>
              <ColorPickerPopover
                value={field.value}
                onChange={field.onChange}
                label={t('finance.paymentTypes.colorPlaceholder')}
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{t('finance.paymentTypes.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('finance.paymentTypes.description')}
          </p>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('finance.paymentTypes.searchPlaceholder')}
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
              <SelectItem value="all">{t('finance.paymentTypes.allSafes')}</SelectItem>
              {mockSafes.map((safe) => (
                <SelectItem key={safe.id} value={safe.id}>
                  {safe.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('finance.paymentTypes.createPaymentType')}
          </Button>
        </div>
      </Card>

      <Card>
        <DataTable
          data={filteredData}
          columns={columns}
          emptyMessage={t('finance.paymentTypes.emptyMessage')}
          pagination={{ enabled: true, pageSize: 15 }}
        />
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('finance.paymentTypes.createPaymentType')}</DialogTitle>
            <DialogDescription>{t('finance.paymentTypes.createPaymentTypeDescription')}</DialogDescription>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('finance.paymentTypes.editPaymentType')}</DialogTitle>
            <DialogDescription>{t('finance.paymentTypes.editPaymentTypeDescription')}</DialogDescription>
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
