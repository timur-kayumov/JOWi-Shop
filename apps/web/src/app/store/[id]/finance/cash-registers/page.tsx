'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
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
  Checkbox,
} from '@jowi/ui';
import { useTranslation } from 'react-i18next';
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
  name: z.string().min(2, 'Minimum 2 characters').max(100, 'Maximum 100 characters'),
  deviceId: z.string().min(1, 'Enter device ID'),
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
  const { t } = useTranslation('common');

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
      toast.error(t('components.toast.error'), t('finance.cashRegisters.selectAtLeastOne'));
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
    toast.success(t('messages.saved'), `${formData.name} ${t('messages.success')}`);
    setIsCreateDialogOpen(false);
    setSelectedPaymentTypes([]);
    createForm.reset();
  };

  const handleEdit = (formData: CreateTerminalInput) => {
    if (!selectedTerminal) return;

    if (selectedPaymentTypes.length === 0) {
      toast.error(t('components.toast.error'), t('finance.cashRegisters.selectAtLeastOne'));
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
    toast.success(t('messages.saved'), t('messages.success'));
    setIsEditDialogOpen(false);
    setSelectedTerminal(null);
    setSelectedPaymentTypes([]);
    editForm.reset();
  };

  const handleDelete = (terminal: Terminal) => {
    if (window.confirm(t('finance.cashRegisters.deleteConfirm'))) {
      setData(data.filter((t) => t.id !== terminal.id));
      toast.success(t('messages.deleted'), t('finance.cashRegisters.deleteSuccess'));
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
      label: t('finance.cashRegisters.name'),
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
      label: t('finance.cashRegisters.fiscalProvider'),
      render: (terminal) => (
        <span className="text-sm text-muted-foreground">
          {terminal.fiscalProviderId || '-'}
        </span>
      ),
    },
    {
      key: 'paymentTypes',
      label: t('finance.cashRegisters.paymentTypes'),
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
            {t('finance.cashRegisters.noPaymentTypes')}
          </span>
        );
      },
    },
    {
      key: 'isActive',
      label: t('fields.status'),
      render: (terminal) => (
        <StatusBadge
          type="boolean"
          status={terminal.isActive ? 'active' : 'inactive'}
          t={t}
        />
      ),
    },
    {
      key: 'actions',
      label: t('fields.actions'),
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
            <FormLabel>{t('finance.cashRegisters.name')}</FormLabel>
            <FormControl>
              <Input {...field} placeholder={t('finance.cashRegisters.namePlaceholder')} />
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
              <FormLabel>{t('finance.cashRegisters.deviceId')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('finance.cashRegisters.deviceIdPlaceholder')} />
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
              <FormLabel>{t('finance.cashRegisters.fiscalProviderId')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('finance.cashRegisters.fiscalProviderIdPlaceholder')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-2">
        <FormLabel>{t('finance.cashRegisters.paymentTypes')}</FormLabel>
        <p className="text-sm text-muted-foreground">
          {t('finance.cashRegisters.paymentTypesDescription')}
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
            {t('finance.cashRegisters.selectAtLeastOne')}
          </p>
        )}
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{t('finance.cashRegisters.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('finance.cashRegisters.description')}
          </p>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('finance.cashRegisters.searchPlaceholder')}
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
              <SelectItem value="all">{t('finance.cashRegisters.allStatuses')}</SelectItem>
              <SelectItem value="active">{t('finance.cashRegisters.active')}</SelectItem>
              <SelectItem value="inactive">{t('finance.cashRegisters.inactive')}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('finance.cashRegisters.createRegister')}
          </Button>
        </div>
      </Card>

      <Card>
        <DataTable
          data={filteredData}
          columns={columns}
          onRowClick={(terminal) =>
            router.push(`/store/${storeId}/finance/cash-registers/${terminal.id}`)
          }
          emptyMessage={t('finance.cashRegisters.emptyMessage')}
          pagination={{ enabled: true, pageSize: 15 }}
        />
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('finance.cashRegisters.createRegister')}</DialogTitle>
            <DialogDescription>
              {t('finance.cashRegisters.createRegisterDescription')}
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
                  {t('actions.cancel')}
                </Button>
                <Button type="submit" disabled={selectedPaymentTypes.length === 0}>
                  {t('actions.create')}
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
            <DialogTitle>{t('finance.cashRegisters.editRegister')}</DialogTitle>
            <DialogDescription>
              {t('finance.cashRegisters.editRegisterDescription')}
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
                  {t('actions.cancel')}
                </Button>
                <Button type="submit" disabled={selectedPaymentTypes.length === 0}>
                  {t('actions.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
