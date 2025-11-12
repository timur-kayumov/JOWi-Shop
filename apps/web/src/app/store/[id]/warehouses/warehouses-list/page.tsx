'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Search, Warehouse as WarehouseIcon } from 'lucide-react';
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
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/toast';
import { pluralizeProducts } from '@jowi/i18n';

// Types
interface Warehouse {
  id: string;
  name: string;
  managerName?: string;
  managerId?: string;
  productsCount: number;
  totalValue: number; // По себестоимости (FIFO)
  createdAt: Date;
}

interface Employee {
  id: string;
  name: string;
}

// Validation schema
const createWarehouseSchema = z.object({
  name: z
    .string()
    .min(2, 'warehouses.validation.nameMin')
    .max(200, 'warehouses.validation.nameMax'),
  managerId: z.string().optional(),
});

type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;

// Mock data - employees for manager selection
const mockEmployees: Employee[] = [
  { id: '1', name: 'Иванов Иван Иванович' },
  { id: '2', name: 'Петров Петр Петрович' },
  { id: '3', name: 'Сидоров Сидор Сидорович' },
];

// Mock data - warehouses
const mockWarehouses: Warehouse[] = [
  {
    id: '1',
    name: 'Основной склад',
    managerName: 'Иванов Иван Иванович',
    managerId: '1',
    productsCount: 156,
    totalValue: 45800000,
    createdAt: new Date('2024-01-10'),
  },
  {
    id: '2',
    name: 'Склад возвратов',
    managerName: 'Петров Петр Петрович',
    managerId: '2',
    productsCount: 23,
    totalValue: 1250000,
    createdAt: new Date('2024-02-15'),
  },
  {
    id: '3',
    name: 'Транзитный склад',
    managerName: undefined,
    managerId: undefined,
    productsCount: 87,
    totalValue: 18900000,
    createdAt: new Date('2024-03-20'),
  },
];

export default function WarehousesListPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;
  const { t, i18n } = useTranslation('common');

  const [data, setData] = useState<Warehouse[]>(mockWarehouses);
  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const createForm = useForm<CreateWarehouseInput>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: {
      name: '',
      managerId: undefined,
    },
  });

  const filteredData = useMemo(() => {
    const filtered = data.filter((warehouse) => {
      const matchesSearch = warehouse.name.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });

    // Sort by createdAt descending (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [data, search]);

  const handleCreate = (formData: CreateWarehouseInput) => {
    const manager = formData.managerId
      ? mockEmployees.find(e => e.id === formData.managerId)
      : undefined;

    const newWarehouse: Warehouse = {
      id: String(data.length + 1),
      name: formData.name,
      managerName: manager?.name,
      managerId: formData.managerId,
      productsCount: 0,
      totalValue: 0,
      createdAt: new Date(),
    };

    setData([...data, newWarehouse]);
    toast.success(
      t('components.toast.success'),
      t('warehouses.createSuccess')
    );
    setIsCreateDialogOpen(false);
    createForm.reset();
  };

  const formatCurrency = (amount: number) => {
    return (
      new Intl.NumberFormat('ru-RU', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount) +
      ' ' +
      t('currency')
    );
  };

  const columns: Column<Warehouse>[] = [
    {
      key: 'name',
      label: t('warehouses.name'),
      sortable: true,
      render: (warehouse) => (
        <div className="flex items-center gap-2">
          <WarehouseIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{warehouse.name}</span>
        </div>
      ),
    },
    {
      key: 'managerName',
      label: t('warehouses.manager'),
      render: (warehouse) => (
        <span className="text-sm text-muted-foreground">
          {warehouse.managerName || t('warehouses.noManager')}
        </span>
      ),
    },
    {
      key: 'productsCount',
      label: t('warehouses.productsCount'),
      sortable: true,
      render: (warehouse) => {
        const locale = i18n.language as 'ru' | 'uz';
        return (
          <span className="text-sm">
            {pluralizeProducts(warehouse.productsCount, locale)}
          </span>
        );
      },
    },
    {
      key: 'totalValue',
      label: t('warehouses.totalValue'),
      sortable: true,
      render: (warehouse) => (
        <span className="font-medium">{formatCurrency(warehouse.totalValue)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('warehouses.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('warehouses.description')}
          </p>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('warehouses.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('warehouses.createWarehouse')}
          </Button>
        </div>
      </Card>

      <Card>
        <DataTable
          data={filteredData}
          columns={columns}
          onRowClick={(warehouse) =>
            router.push(`/store/${storeId}/warehouses/${warehouse.id}`)
          }
          emptyMessage={t('warehouses.emptyMessage')}
          pagination={{ enabled: true, pageSize: 15 }}
        />
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('warehouses.createWarehouse')}</DialogTitle>
            <DialogDescription>
              {t('warehouses.createWarehouseDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('warehouses.name')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('warehouses.namePlaceholder')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('warehouses.manager')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('warehouses.managerPlaceholder')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockEmployees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name}
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
