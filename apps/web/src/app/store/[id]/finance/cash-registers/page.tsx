'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { z } from 'zod';
import { toast } from '@/lib/toast';

// Local types for mock data
interface PaymentType {
  id: string;
  safeId: string;
  name: string;
  icon?: string;
  color?: string;
}

interface Terminal {
  id: string;
  name: string;
  deviceId: string;
  fiscalProviderId?: string;
  isActive: boolean;
  paymentTypeIds: string[];
}

// Validation schema (matches backend Terminal model)
const createTerminalSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа').max(100, 'Максимум 100 символов'),
  deviceId: z.string().min(1, 'Введите ID устройства'),
  fiscalProviderId: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CreateTerminalInput = z.infer<typeof createTerminalSchema>;

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

// Mock data для касс
const mockTerminals: Terminal[] = [
  {
    id: '1',
    name: 'Касса 1',
    deviceId: 'DEVICE-001',
    fiscalProviderId: 'FISCAL-001',
    isActive: true,
    paymentTypeIds: ['1', '2', '3'],
  },
  {
    id: '2',
    name: 'Касса 2',
    deviceId: 'DEVICE-002',
    fiscalProviderId: 'FISCAL-002',
    isActive: true,
    paymentTypeIds: ['1', '4', '5'],
  },
  {
    id: '3',
    name: 'Касса 3 (резервная)',
    deviceId: 'DEVICE-003',
    isActive: false,
    paymentTypeIds: ['1'],
  },
];

export default function CashRegistersPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;

  const [data, setData] = useState<Terminal[]>(mockTerminals);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null);
  const [selectedPaymentTypes, setSelectedPaymentTypes] = useState<string[]>([]);

  const createForm = useForm<CreateTerminalInput>({
    resolver: zodResolver(createTerminalSchema),
    defaultValues: {
      name: '',
      deviceId: '',
      fiscalProviderId: '',
      isActive: true,
    },
  });

  const editForm = useForm<CreateTerminalInput>({
    resolver: zodResolver(createTerminalSchema),
    defaultValues: {
      name: '',
      deviceId: '',
      fiscalProviderId: '',
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
    if (selectedPaymentTypes.length === 0) {
      toast.error('Ошибка', 'Выберите хотя бы один тип оплаты');
      return;
    }

    const newTerminal: Terminal = {
      id: String(data.length + 1),
      name: formData.name,
      deviceId: formData.deviceId,
      fiscalProviderId: formData.fiscalProviderId,
      isActive: formData.isActive,
      paymentTypeIds: selectedPaymentTypes,
    };
    setData([...data, newTerminal]);
    toast.success('Сохранено', `${formData.name} успешно создана`);
    setIsCreateDialogOpen(false);
    setSelectedPaymentTypes([]);
    createForm.reset();
  };

  const handleEdit = (formData: CreateTerminalInput) => {
    if (!selectedTerminal) return;

    if (selectedPaymentTypes.length === 0) {
      toast.error('Ошибка', 'Выберите хотя бы один тип оплаты');
      return;
    }

    setData(
      data.map((terminal) =>
        terminal.id === selectedTerminal.id
          ? {
              ...terminal,
              name: formData.name,
              deviceId: formData.deviceId,
              fiscalProviderId: formData.fiscalProviderId,
              isActive: formData.isActive,
              paymentTypeIds: selectedPaymentTypes,
            }
          : terminal
      )
    );
    toast.success('Сохранено', 'Касса успешно обновлена');
    setIsEditDialogOpen(false);
    setSelectedTerminal(null);
    setSelectedPaymentTypes([]);
    editForm.reset();
  };

  const handleDelete = (terminal: Terminal) => {
    if (window.confirm('Вы уверены, что хотите удалить эту кассу?')) {
      setData(data.filter((t) => t.id !== terminal.id));
      toast.success('Удалено', 'Касса успешно удалена');
    }
  };

  const openEditDialog = (terminal: Terminal) => {
    setSelectedTerminal(terminal);
    setSelectedPaymentTypes(terminal.paymentTypeIds || []);
    editForm.reset({
      name: terminal.name,
      deviceId: terminal.deviceId,
      fiscalProviderId: terminal.fiscalProviderId || '',
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

  const columns: Column<Terminal>[] = [
    {
      key: 'name',
      label: 'Название',
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
      label: 'Фискальный регистратор',
      render: (terminal) => (
        <span className="text-sm text-muted-foreground">
          {terminal.fiscalProviderId || '-'}
        </span>
      ),
    },
    {
      key: 'paymentTypes',
      label: 'Типы оплат',
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
            Нет типов оплат
          </span>
        );
      },
    },
    {
      key: 'isActive',
      label: 'Статус',
      render: (terminal) => (
        <Badge variant={terminal.isActive ? 'default' : 'secondary'}>
          {terminal.isActive ? 'Активна' : 'Неактивна'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Действия',
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
            <FormLabel>Название</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Например: Касса 1" />
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
              <FormLabel>ID устройства</FormLabel>
              <FormControl>
                <Input {...field} placeholder="DEVICE-001" />
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
              <FormLabel>ID фискального регистратора</FormLabel>
              <FormControl>
                <Input {...field} placeholder="FISCAL-001" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-2">
        <FormLabel>Типы оплат</FormLabel>
        <p className="text-sm text-muted-foreground">
          Выберите типы оплат, которые будут доступны на этой кассе
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
            Выберите хотя бы один тип оплаты
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
            <h1 className="text-3xl font-bold tracking-tight">Кассы</h1>
            <p className="text-muted-foreground mt-2">
              Управление кассами и POS-терминалами магазина
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Создать кассу
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию или ID..."
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
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="active">Активные</SelectItem>
              <SelectItem value="inactive">Неактивные</SelectItem>
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
          emptyMessage="Нет касс для отображения"
          pagination={{ enabled: true, pageSize: 15 }}
        />
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Создать кассу</DialogTitle>
            <DialogDescription>
              Добавьте новую кассу и настройте доступные типы оплат
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
                  Отмена
                </Button>
                <Button type="submit" disabled={selectedPaymentTypes.length === 0}>
                  Создать
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
            <DialogTitle>Редактировать кассу</DialogTitle>
            <DialogDescription>
              Измените настройки кассы и типы оплат
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
                  Отмена
                </Button>
                <Button type="submit" disabled={selectedPaymentTypes.length === 0}>
                  Сохранить
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
