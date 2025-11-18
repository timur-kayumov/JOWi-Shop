'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  MultiSelect,
  DataTable,
  Badge,
  StatusBadge,
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
  type Column,
} from '@jowi/ui';
import { type DateRange } from 'react-day-picker';
import { Plus, Search } from 'lucide-react';
import { toast } from '@/lib/toast';

// Types
type WriteoffReason = 'expired' | 'damaged' | 'lost' | 'shortage' | 'other';
type WriteoffStatus = 'draft' | 'published' | 'canceled';

interface Writeoff {
  id: string;
  number: string;
  createdAt: string;
  publishedAt?: string;
  warehouseId: string;
  warehouseName: string;
  reason: WriteoffReason;
  totalAmount: number;
  itemsCount: number;
  responsibleId: string;
  responsibleName: string;
  status: WriteoffStatus;
  notes?: string;
}

interface Warehouse {
  id: string;
  name: string;
}

// Mock data - warehouses
const mockWarehouses: Warehouse[] = [
  { id: '1', name: 'Основной склад' },
  { id: '2', name: 'Склад готовой продукции' },
  { id: '3', name: 'Дополнительный склад' },
];

// Mock data - writeoffs
const mockWriteoffs: Writeoff[] = [
  {
    id: '1',
    number: 'WO-2025-001',
    createdAt: '2025-11-10T10:30:00',
    publishedAt: '2025-11-10T11:00:00',
    warehouseId: '1',
    warehouseName: 'Основной склад',
    reason: 'expired',
    totalAmount: 125000,
    itemsCount: 15,
    responsibleId: '1',
    responsibleName: 'Алишер Каримов',
    status: 'published',
    notes: 'Истёк срок годности молочной продукции',
  },
  {
    id: '2',
    number: 'WO-2025-002',
    createdAt: '2025-11-08T14:20:00',
    publishedAt: '2025-11-08T15:00:00',
    warehouseId: '2',
    warehouseName: 'Склад готовой продукции',
    reason: 'damaged',
    totalAmount: 87500,
    itemsCount: 8,
    responsibleId: '2',
    responsibleName: 'Нигора Усманова',
    status: 'published',
    notes: 'Повреждение упаковки при транспортировке',
  },
  {
    id: '3',
    number: 'WO-2025-003',
    createdAt: '2025-11-05T09:15:00',
    warehouseId: '1',
    warehouseName: 'Основной склад',
    reason: 'lost',
    totalAmount: 0,
    itemsCount: 0,
    responsibleId: '1',
    responsibleName: 'Алишер Каримов',
    status: 'draft',
    notes: 'Черновик документа списания',
  },
  {
    id: '4',
    number: 'WO-2025-004',
    createdAt: '2025-11-03T16:45:00',
    publishedAt: '2025-11-03T17:00:00',
    warehouseId: '3',
    warehouseName: 'Дополнительный склад',
    reason: 'shortage',
    totalAmount: 52000,
    itemsCount: 12,
    responsibleId: '3',
    responsibleName: 'Дилшод Рахимов',
    status: 'published',
    notes: 'Недостача по результатам инвентаризации',
  },
  {
    id: '5',
    number: 'WO-2025-005',
    createdAt: '2025-11-01T11:30:00',
    publishedAt: '2025-11-01T12:00:00',
    warehouseId: '2',
    warehouseName: 'Склад готовой продукции',
    reason: 'expired',
    totalAmount: 210000,
    itemsCount: 28,
    responsibleId: '2',
    responsibleName: 'Нигора Усманова',
    status: 'published',
    notes: 'Списание продукции с истекшим сроком годности',
  },
  {
    id: '6',
    number: 'WO-2025-006',
    createdAt: '2025-10-28T13:20:00',
    publishedAt: '2025-10-28T14:00:00',
    warehouseId: '1',
    warehouseName: 'Основной склад',
    reason: 'damaged',
    totalAmount: 142000,
    itemsCount: 18,
    responsibleId: '1',
    responsibleName: 'Алишер Каримов',
    status: 'published',
    notes: 'Бой стеклянной тары',
  },
  {
    id: '7',
    number: 'WO-2025-007',
    createdAt: '2025-10-25T10:00:00',
    publishedAt: '2025-10-25T10:30:00',
    warehouseId: '3',
    warehouseName: 'Дополнительный склад',
    reason: 'other',
    totalAmount: 35000,
    itemsCount: 5,
    responsibleId: '3',
    responsibleName: 'Дилшод Рахимов',
    status: 'published',
    notes: 'Списание образцов для дегустации',
  },
  {
    id: '8',
    number: 'WO-2025-008',
    createdAt: '2025-10-20T15:40:00',
    warehouseId: '2',
    warehouseName: 'Склад готовой продукции',
    reason: 'damaged',
    totalAmount: 0,
    itemsCount: 0,
    responsibleId: '2',
    responsibleName: 'Нигора Усманова',
    status: 'canceled',
    notes: 'Отменён - ошибочное создание',
  },
];

// Validation schema
const createWriteoffSchema = z.object({
  warehouseId: z.string().min(1, {
    message: 'warehouses.writeoffs.validation.warehouseRequired',
  }),
});

type CreateWriteoffFormData = z.infer<typeof createWriteoffSchema>;

export default function WriteoffsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;

  // State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Form
  const form = useForm<CreateWriteoffFormData>({
    resolver: zodResolver(createWriteoffSchema),
    defaultValues: {
      warehouseId: '',
    },
  });

  // Filter logic
  const filteredWriteoffs = useMemo(() => {
    return mockWriteoffs.filter((writeoff) => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch =
        writeoff.number.toLowerCase().includes(searchLower) ||
        writeoff.warehouseName.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus =
        statusFilter === 'all' || writeoff.status === statusFilter;

      // Warehouses filter
      const matchesWarehouse =
        selectedWarehouses.length === 0 ||
        selectedWarehouses.includes(writeoff.warehouseId);

      // Date range filter (use publishedAt for published, createdAt for draft/canceled)
      const writeoffDate = new Date(
        writeoff.publishedAt || writeoff.createdAt
      );
      const matchesDateRange =
        !dateRange?.from ||
        (writeoffDate >= dateRange.from &&
          (!dateRange.to || writeoffDate <= dateRange.to));

      return (
        matchesSearch &&
        matchesStatus &&
        matchesWarehouse &&
        matchesDateRange
      );
    });
  }, [search, statusFilter, selectedWarehouses, dateRange]);

  // Table columns
  const columns: Column<Writeoff>[] = [
    {
      key: 'date',
      label: t('warehouses.writeoffs.columns.date'),
      sortable: true,
      render: (item) => {
        const date = new Date(item.publishedAt || item.createdAt);
        return date
          .toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
          .replace(' г.', '')
          .replace(' в ', ', ');
      },
    },
    {
      key: 'number',
      label: t('warehouses.writeoffs.columns.number'),
      sortable: true,
      render: (item) => (
        <span className="font-medium text-foreground">{item.number}</span>
      ),
    },
    {
      key: 'warehouseName',
      label: t('warehouses.writeoffs.columns.warehouse'),
      sortable: true,
    },
    {
      key: 'totalAmount',
      label: t('warehouses.writeoffs.columns.totalAmount'),
      sortable: true,
      render: (item) => {
        const amount = new Intl.NumberFormat('ru-RU').format(item.totalAmount);
        return (
          <span className="font-medium">
            {amount} {t('currency')}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: t('warehouses.writeoffs.columns.status'),
      sortable: true,
      render: (item) => (
        <StatusBadge type="transaction" status={item.status} t={t} />
      ),
    },
  ];

  // Handlers
  const handleRowClick = (writeoff: Writeoff) => {
    router.push(`/store/${storeId}/warehouses/writeoffs/${writeoff.id}`);
  };

  const handleCreate = (data: CreateWriteoffFormData) => {
    console.log('Creating writeoff:', data);

    toast({
      title: t('warehouses.writeoffs.createSuccess'),
      variant: 'success',
    });

    setIsCreateDialogOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6">
        {/* Title Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('warehouses.writeoffs.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('warehouses.writeoffs.description')}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('warehouses.writeoffs.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Warehouses MultiSelect */}
          <MultiSelect
            value={selectedWarehouses}
            onValueChange={setSelectedWarehouses}
            options={mockWarehouses.map((wh) => ({
              value: wh.id,
              label: wh.name,
            }))}
            placeholder={t('warehouses.writeoffs.filters.allWarehouses')}
            emptyText={t('warehouses.writeoffs.filters.allWarehouses')}
            selectAllText={t('warehouses.writeoffs.filters.selectAll')}
            clearAllText={t('warehouses.writeoffs.filters.clearAll')}
            className="w-[200px]"
          />

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('warehouses.writeoffs.filters.allStatuses')}
              </SelectItem>
              <SelectItem value="draft">{t('status.draft')}</SelectItem>
              <SelectItem value="published">
                {t('status.published')}
              </SelectItem>
              <SelectItem value="canceled">{t('status.canceled')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Picker */}
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            placeholder={t('warehouses.writeoffs.filters.selectDateRange')}
            className="w-[250px]"
          />

          {/* Create Button */}
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('actions.create')}
          </Button>
        </div>
      </Card>

      {/* Table Card */}
      <Card>
        <DataTable
          data={filteredWriteoffs}
          columns={columns}
          onRowClick={handleRowClick}
          emptyMessage={t('warehouses.writeoffs.noWriteoffs')}
          pagination={{ enabled: true, pageSize: 15 }}
        />
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('warehouses.writeoffs.createWriteoff')}
            </DialogTitle>
            <DialogDescription>
              {t('warehouses.writeoffs.createWriteoffDescription')}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreate)}
              className="space-y-4"
            >
              {/* Warehouse Select */}
              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('warehouses.writeoffs.fields.warehouse')}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'warehouses.writeoffs.fields.warehousePlaceholder'
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockWarehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    form.reset();
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
    </div>
  );
}
