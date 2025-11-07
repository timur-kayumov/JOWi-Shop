'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
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
const createPaymentTypeSchema = z.object({
  safeId: z.string().uuid('Некорректный ID сейфа'),
  name: z.string().min(2, 'Минимум 2 символа').max(100, 'Максимум 100 символов'),
  icon: z.string().optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6})$/, 'Цвет должен быть в формате #RRGGBB').optional(),
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
    toast.success('Сохранено', `${formData.name} успешно создан`);
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
    toast.success('Сохранено', 'Тип оплаты успешно обновлён');
    setIsEditDialogOpen(false);
    setSelectedPaymentType(null);
    editForm.reset();
  };

  const handleDelete = (paymentType: PaymentType) => {
    if (window.confirm('Вы уверены, что хотите удалить этот тип оплаты?')) {
      setData(data.filter((pt) => pt.id !== paymentType.id));
      toast.success('Удалено', 'Тип оплаты успешно удалён');
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

  const safeTypeLabels: Record<SafeType, string> = {
    cash: 'Наличные',
    bank_account: 'Банковский счёт',
    card_account: 'Карточный счёт',
  };

  const columns: Column<PaymentType>[] = [
    {
      key: 'name',
      label: 'Название',
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
      label: 'Сейф',
      render: (paymentType) => {
        const safe = getSafeByPaymentType(paymentType);
        return safe ? (
          <div>
            <div className="text-sm font-medium">{safe.name}</div>
            <div className="text-xs text-muted-foreground">{safeTypeLabels[safe.type]}</div>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Действия',
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
            <FormLabel>Название</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Например: Карта Uzcard" />
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
            <FormLabel>Сейф</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите сейф" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {mockSafes.filter(s => s.isActive).map((safe) => (
                  <SelectItem key={safe.id} value={safe.id}>
                    {safe.name} ({safeTypeLabels[safe.type]})
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
            <FormLabel>Цвет</FormLabel>
            <FormControl>
              <ColorPickerPopover
                value={field.value}
                onChange={field.onChange}
                label="Выбрать цвет"
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
            <h1 className="text-3xl font-bold tracking-tight">Типы оплат</h1>
            <p className="text-muted-foreground mt-2">
              Управление типами оплат и привязка к сейфам
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Создать тип оплаты
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию..."
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
              <SelectItem value="all">Все сейфы</SelectItem>
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
          emptyMessage="Нет типов оплат для отображения"
          pagination={{ enabled: true, pageSize: 15 }}
        />
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Создать тип оплаты</DialogTitle>
            <DialogDescription>Добавьте новый тип оплаты и привяжите его к сейфу</DialogDescription>
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
                  Отмена
                </Button>
                <Button type="submit">Создать</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать тип оплаты</DialogTitle>
            <DialogDescription>Измените данные типа оплаты</DialogDescription>
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
                  Отмена
                </Button>
                <Button type="submit">Сохранить</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
