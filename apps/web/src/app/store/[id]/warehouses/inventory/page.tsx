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

// Type definitions
type InventoryType = 'full' | 'partial';
type InventoryStatus = 'draft' | 'published' | 'canceled';

interface Inventory {
  id: string;
  number: string;
  date: string;
  responsibleId: string;
  responsibleName: string;
  warehouseId: string;
  warehouseName: string;
  discrepancy: number;
  type: InventoryType;
  status: InventoryStatus;
}

interface Warehouse {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
}

// Mock data
const mockWarehouses: Warehouse[] = [
  { id: '1', name: 'Основной склад' },
  { id: '2', name: 'Склад магазина №1' },
  { id: '3', name: 'Склад магазина №2' },
  { id: '4', name: 'Транзитный склад' },
];

const mockEmployees: Employee[] = [
  { id: '1', name: 'Алишер Каримов' },
  { id: '2', name: 'Нигора Усманова' },
  { id: '3', name: 'Тимур Хасанов' },
  { id: '4', name: 'Дилноза Рахимова' },
];

const mockInventories: Inventory[] = [
  {
    id: '1',
    number: 'INV-001',
    date: '2025-11-10',
    responsibleId: '1',
    responsibleName: 'Алишер Каримов',
    warehouseId: '1',
    warehouseName: 'Основной склад',
    discrepancy: 0,
    type: 'full',
    status: 'published',
  },
  {
    id: '2',
    number: 'INV-002',
    date: '2025-11-09',
    responsibleId: '2',
    responsibleName: 'Нигора Усманова',
    warehouseId: '2',
    warehouseName: 'Склад магазина №1',
    discrepancy: 125000,
    type: 'partial',
    status: 'published',
  },
  {
    id: '3',
    number: 'INV-003',
    date: '2025-11-08',
    responsibleId: '3',
    responsibleName: 'Тимур Хасанов',
    warehouseId: '1',
    warehouseName: 'Основной склад',
    discrepancy: -45000,
    type: 'full',
    status: 'published',
  },
  {
    id: '4',
    number: 'INV-004',
    date: '2025-11-07',
    responsibleId: '1',
    responsibleName: 'Алишер Каримов',
    warehouseId: '3',
    warehouseName: 'Склад магазина №2',
    discrepancy: 0,
    type: 'partial',
    status: 'draft',
  },
  {
    id: '5',
    number: 'INV-005',
    date: '2025-11-06',
    responsibleId: '4',
    responsibleName: 'Дилноза Рахимова',
    warehouseId: '4',
    warehouseName: 'Транзитный склад',
    discrepancy: 78000,
    type: 'full',
    status: 'published',
  },
  {
    id: '6',
    number: 'INV-006',
    date: '2025-11-05',
    responsibleId: '2',
    responsibleName: 'Нигора Усманова',
    warehouseId: '2',
    warehouseName: 'Склад магазина №1',
    discrepancy: -120000,
    type: 'partial',
    status: 'canceled',
  },
  {
    id: '7',
    number: 'INV-007',
    date: '2025-11-04',
    responsibleId: '3',
    responsibleName: 'Тимур Хасанов',
    warehouseId: '1',
    warehouseName: 'Основной склад',
    discrepancy: 0,
    type: 'full',
    status: 'published',
  },
  {
    id: '8',
    number: 'INV-008',
    date: '2025-11-03',
    responsibleId: '1',
    responsibleName: 'Алишер Каримов',
    warehouseId: '3',
    warehouseName: 'Склад магазина №2',
    discrepancy: 34500,
    type: 'partial',
    status: 'draft',
  },
];

// Validation schema
const createInventorySchema = z.object({
  type: z.enum(['full', 'partial'], {
    required_error: 'warehouses.inventory.validation.typeRequired',
  }),
  warehouseId: z.string().min(1, {
    message: 'warehouses.inventory.validation.warehouseRequired',
  }),
});

type CreateInventoryInput = z.infer<typeof createInventorySchema>;

export default function InventoryPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;

  // State
  const [inventories, setInventories] = useState<Inventory[]>(mockInventories);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedResponsible, setSelectedResponsible] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Form
  const form = useForm<CreateInventoryInput>({
    resolver: zodResolver(createInventorySchema),
    defaultValues: {
      type: undefined,
      warehouseId: '',
    },
  });

  // Filtered data
  const filteredInventories = useMemo(() => {
    return inventories.filter((inventory) => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch =
        inventory.number.toLowerCase().includes(searchLower) ||
        inventory.warehouseName.toLowerCase().includes(searchLower);

      // Responsible filter
      const matchesResponsible =
        selectedResponsible === 'all' ||
        inventory.responsibleId === selectedResponsible;

      // Type filter
      const matchesType =
        selectedType === 'all' || inventory.type === selectedType;

      // Warehouses filter
      const matchesWarehouse =
        selectedWarehouses.length === 0 ||
        selectedWarehouses.includes(inventory.warehouseId);

      // Date range filter
      const inventoryDate = new Date(inventory.date);
      const matchesDateRange =
        !dateRange?.from ||
        (inventoryDate >= dateRange.from &&
          (!dateRange.to || inventoryDate <= dateRange.to));

      return (
        matchesSearch &&
        matchesResponsible &&
        matchesType &&
        matchesWarehouse &&
        matchesDateRange
      );
    });
  }, [
    inventories,
    search,
    selectedResponsible,
    selectedType,
    selectedWarehouses,
    dateRange,
  ]);

  // Table columns
  const columns: Column<Inventory>[] = [
    {
      key: 'date',
      label: t('warehouses.inventory.columns.date'),
      sortable: true,
      render: (item) => {
        const date = new Date(item.date);
        return date.toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      },
    },
    {
      key: 'number',
      label: t('warehouses.inventory.columns.number'),
      sortable: true,
      render: (item) => (
        <span className="font-medium text-foreground">{item.number}</span>
      ),
    },
    {
      key: 'responsibleName',
      label: t('warehouses.inventory.columns.responsible'),
      sortable: true,
    },
    {
      key: 'warehouseName',
      label: t('warehouses.inventory.columns.warehouse'),
      sortable: true,
    },
    {
      key: 'discrepancy',
      label: t('warehouses.inventory.columns.discrepancy'),
      sortable: true,
      render: (item) => {
        if (item.discrepancy === 0) {
          return (
            <span className="text-muted-foreground">
              {t('warehouses.inventory.discrepancy.none')}
            </span>
          );
        }

        const amount = new Intl.NumberFormat('ru-RU').format(
          Math.abs(item.discrepancy)
        );
        const sign = item.discrepancy > 0 ? '+' : '−';

        return (
          <span className="font-medium text-destructive">
            {sign}
            {amount} {t('currency')}
          </span>
        );
      },
    },
    {
      key: 'type',
      label: t('warehouses.inventory.columns.type'),
      sortable: true,
      render: (item) => (
        <Badge variant="outline">
          {t(`warehouses.inventory.types.${item.type}`)}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: t('warehouses.inventory.columns.status'),
      sortable: true,
      render: (item) => (
        <StatusBadge type="transaction" status={item.status} t={t} />
      ),
    },
  ];

  // Handle create
  const handleCreate = (data: CreateInventoryInput) => {
    const newInventory: Inventory = {
      id: `${inventories.length + 1}`,
      number: `INV-${String(inventories.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      responsibleId: '1', // Current user (mock)
      responsibleName: 'Алишер Каримов', // Current user (mock)
      warehouseId: data.warehouseId,
      warehouseName:
        mockWarehouses.find((w) => w.id === data.warehouseId)?.name ||
        'Unknown',
      discrepancy: 0,
      type: data.type,
      status: 'draft',
    };

    setInventories([newInventory, ...inventories]);
    setIsCreateDialogOpen(false);
    form.reset();

    toast.success(
      t('components.toast.success'),
      t('warehouses.inventory.createSuccess')
    );

    // Navigate to the new inventory detail page
    router.push(`/store/${storeId}/warehouses/inventory/${newInventory.id}`);
  };

  // Handle row click
  const handleRowClick = (inventory: Inventory) => {
    router.push(`/store/${storeId}/warehouses/inventory/${inventory.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('warehouses.inventory.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('warehouses.inventory.description')}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('warehouses.inventory.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Select value={selectedResponsible} onValueChange={setSelectedResponsible}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('warehouses.inventory.filters.allResponsible')}
              </SelectItem>
              {mockEmployees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('warehouses.inventory.filters.allTypes')}
              </SelectItem>
              <SelectItem value="full">
                {t('warehouses.inventory.types.full')}
              </SelectItem>
              <SelectItem value="partial">
                {t('warehouses.inventory.types.partial')}
              </SelectItem>
            </SelectContent>
          </Select>

          <MultiSelect
            value={selectedWarehouses}
            onValueChange={setSelectedWarehouses}
            options={mockWarehouses.map((warehouse) => ({
              value: warehouse.id,
              label: warehouse.name,
            }))}
            placeholder={t('warehouses.inventory.filters.allWarehouses')}
            emptyText={t('warehouses.monitoring.filters.allWarehouses')}
            selectAllText={t('warehouses.inventory.filters.selectAll')}
            clearAllText={t('warehouses.inventory.filters.clearAll')}
            className="w-[200px]"
          />

          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            placeholder="Выберите диапазон"
            className="w-[200px]"
          />

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('actions.create')}
          </Button>
        </div>
      </Card>

      {/* Table Card */}
      <Card>
        <DataTable
          data={filteredInventories}
          columns={columns}
          onRowClick={handleRowClick}
          emptyMessage={t('warehouses.inventory.noInventories')}
          pagination={{ enabled: true, pageSize: 15 }}
        />
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('warehouses.inventory.createInventory')}
            </DialogTitle>
            <DialogDescription>
              {t('warehouses.inventory.createInventoryDescription')}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreate)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('warehouses.inventory.fields.type')}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'warehouses.inventory.fields.typePlaceholder'
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full">
                          {t('warehouses.inventory.types.full')}
                        </SelectItem>
                        <SelectItem value="partial">
                          {t('warehouses.inventory.types.partial')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('warehouses.inventory.fields.warehouse')}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'warehouses.inventory.fields.warehousePlaceholder'
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
