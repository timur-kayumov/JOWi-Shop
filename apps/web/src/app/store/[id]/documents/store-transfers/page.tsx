'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Plus, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Button,
  Card,
  Input,
  StatusBadge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DataTable,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DateRangePicker,
  type Column,
  formatDate,
} from '@jowi/ui';

import type {
  StoreTransfer,
  StoreTransferStatus,
  CreateStoreTransferInput,
} from '@/types/store-transfer';
import {
  mockStoreTransfers,
  mockStores,
  mockWarehousesForStores,
  createStoreTransferSchema,
} from '@/types/store-transfer';

// ==================== UTILITIES ====================

const formatCurrency = (amount: number): string => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' сум';
};

// ==================== COMPONENT ====================

export default function StoreTransfersPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const params = useParams();
  const currentStoreId = params.id as string;

  // ==================== STATE ====================
  const [transfers, setTransfers] = useState<StoreTransfer[]>(mockStoreTransfers);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>();
  const [sourceWarehouseFilter, setSourceWarehouseFilter] = useState<string>('all');
  const [destinationStoreFilter, setDestinationStoreFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StoreTransferStatus | 'all'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // ==================== FORM ====================
  const form = useForm<CreateStoreTransferInput>({
    resolver: zodResolver(createStoreTransferSchema),
    defaultValues: {
      sourceWarehouseId: '',
      destinationStoreId: '',
      destinationWarehouseId: '',
      notes: '',
    },
  });

  // Watch destinationStoreId for cascading select
  const destinationStoreId = form.watch('destinationStoreId');

  // Filter warehouses by selected destination store
  const availableDestinationWarehouses = useMemo(() => {
    if (!destinationStoreId) return [];
    return mockWarehousesForStores.filter((w) => w.storeId === destinationStoreId);
  }, [destinationStoreId]);

  // Reset destinationWarehouseId when store changes
  useEffect(() => {
    if (destinationStoreId) {
      form.setValue('destinationWarehouseId', '');
    }
  }, [destinationStoreId, form]);

  // Get warehouses for current store only (source)
  const currentStoreWarehouses = useMemo(() => {
    return mockWarehousesForStores.filter((w) => w.storeId === currentStoreId);
  }, [currentStoreId]);

  // Filter stores excluding current store
  const availableDestinationStores = useMemo(() => {
    return mockStores.filter((store) => store.id !== currentStoreId);
  }, [currentStoreId]);

  // ==================== HANDLERS ====================
  const handleCreateTransfer = (data: CreateStoreTransferInput) => {
    // Validation: cannot transfer to same store
    if (data.destinationStoreId === currentStoreId) {
      form.setError('destinationStoreId', {
        message: t('documents.storeTransfers.validation.sameStore'),
      });
      return;
    }

    const sourceWarehouse = mockWarehousesForStores.find(
      (w) => w.id === data.sourceWarehouseId
    );
    const destinationStore = mockStores.find((s) => s.id === data.destinationStoreId);
    const destinationWarehouse = mockWarehousesForStores.find(
      (w) => w.id === data.destinationWarehouseId
    );

    if (!sourceWarehouse || !destinationStore || !destinationWarehouse) {
      return;
    }

    // Validation: warehouse must belong to selected store
    if (destinationWarehouse.storeId !== destinationStore.id) {
      form.setError('destinationWarehouseId', {
        message: t('documents.storeTransfers.validation.warehouseNotBelongsToStore'),
      });
      return;
    }

    const newTransfer: StoreTransfer = {
      id: `draft-${Date.now()}`,
      documentNumber: `ST-DRAFT-${Date.now()}`,
      sourceWarehouseId: sourceWarehouse.id,
      sourceWarehouseName: sourceWarehouse.name,
      destinationStoreId: destinationStore.id,
      destinationStoreName: destinationStore.name,
      destinationWarehouseId: destinationWarehouse.id,
      destinationWarehouseName: destinationWarehouse.name,
      status: 'draft',
      notes: data.notes,
      itemsCount: 0,
      totalAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTransfers([newTransfer, ...transfers]);
    setIsCreateDialogOpen(false);
    form.reset();

    // Redirect to detail page for editing
    router.push(`/store/${params.id}/documents/store-transfers/${newTransfer.id}`);
  };

  // ==================== FILTERING ====================
  const filteredTransfers = useMemo(() => {
    return transfers.filter((transfer) => {
      // Search filter
      const searchMatch = transfer.documentNumber
        .toLowerCase()
        .includes(search.toLowerCase());

      // Date range filter
      let dateMatch = true;
      if (dateRange?.from || dateRange?.to) {
        const transferDate = transfer.publishedAt || transfer.createdAt;
        if (dateRange.from && transferDate < dateRange.from) {
          dateMatch = false;
        }
        if (dateRange.to && transferDate > dateRange.to) {
          dateMatch = false;
        }
      }

      // Source warehouse filter
      const sourceWarehouseMatch =
        sourceWarehouseFilter === 'all' ||
        transfer.sourceWarehouseId === sourceWarehouseFilter;

      // Destination store filter
      const destinationStoreMatch =
        destinationStoreFilter === 'all' ||
        transfer.destinationStoreId === destinationStoreFilter;

      // Status filter
      const statusMatch = statusFilter === 'all' || transfer.status === statusFilter;

      return (
        searchMatch &&
        dateMatch &&
        sourceWarehouseMatch &&
        destinationStoreMatch &&
        statusMatch
      );
    });
  }, [transfers, search, dateRange, sourceWarehouseFilter, destinationStoreFilter, statusFilter]);

  // ==================== TABLE COLUMNS ====================
  const columns: Column<StoreTransfer>[] = [
    {
      key: 'documentNumber',
      label: t('documents.storeTransfers.columns.number'),
      sortable: true,
      render: (transfer) => <div className="font-medium">{transfer.documentNumber}</div>,
    },
    {
      key: 'publishedAt',
      label: t('documents.storeTransfers.columns.date'),
      sortable: true,
      render: (transfer) => (
        <div className="text-sm">{formatDate(transfer.publishedAt || transfer.createdAt)}</div>
      ),
    },
    {
      key: 'sourceWarehouseName',
      label: t('documents.storeTransfers.columns.sender'),
      sortable: true,
      render: (transfer) => <div className="text-sm">{transfer.sourceWarehouseName}</div>,
    },
    {
      key: 'recipient',
      label: t('documents.storeTransfers.columns.recipient'),
      sortable: true,
      render: (transfer) => (
        <div className="text-sm">
          <div>{transfer.destinationStoreName}</div>
          <div className="text-xs text-muted-foreground">{transfer.destinationWarehouseName}</div>
        </div>
      ),
    },
    {
      key: 'itemsCount',
      label: t('documents.storeTransfers.columns.itemsCount'),
      sortable: true,
      render: (transfer) => <div className="text-sm">{transfer.itemsCount}</div>,
    },
    {
      key: 'totalAmount',
      label: t('documents.storeTransfers.columns.total'),
      sortable: true,
      render: (transfer) => (
        <div className="text-sm font-medium">{formatCurrency(transfer.totalAmount)}</div>
      ),
    },
    {
      key: 'status',
      label: t('documents.storeTransfers.columns.status'),
      sortable: true,
      render: (transfer) => <StatusBadge type="transaction" status={transfer.status} t={t} />,
    },
  ];

  // ==================== RENDER ====================
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('documents.storeTransfers.title')}
          </h1>
          <p className="text-muted-foreground mt-2">{t('documents.storeTransfers.description')}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('documents.storeTransfers.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            placeholder={t('documents.storeTransfers.filters.selectDateRange')}
            className="w-full sm:w-[240px]"
          />

          <Select value={sourceWarehouseFilter} onValueChange={setSourceWarehouseFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue
                placeholder={t('documents.storeTransfers.filters.sourceWarehouse')}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('documents.storeTransfers.filters.allWarehouses')}
              </SelectItem>
              {currentStoreWarehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={destinationStoreFilter} onValueChange={setDestinationStoreFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={t('documents.storeTransfers.filters.destinationStore')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('documents.storeTransfers.filters.allStores')}
              </SelectItem>
              {availableDestinationStores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={t('documents.storeTransfers.filters.allStatuses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('documents.storeTransfers.filters.allStatuses')}
              </SelectItem>
              <SelectItem value="draft">{t('status.draft')}</SelectItem>
              <SelectItem value="published">{t('status.published')}</SelectItem>
              <SelectItem value="canceled">{t('status.canceled')}</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('actions.create')}
          </Button>
        </div>
      </Card>

      {/* Table Card */}
      <Card>
        <DataTable
          columns={columns}
          data={filteredTransfers}
          emptyMessage={t('documents.storeTransfers.emptyMessage')}
          onRowClick={(transfer) => {
            router.push(`/store/${params.id}/documents/store-transfers/${transfer.id}`);
          }}
          pagination={{ enabled: true }}
        />
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('documents.storeTransfers.createTransfer')}</DialogTitle>
            <DialogDescription>
              {t('documents.storeTransfers.createTransferDescription')}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateTransfer)} className="space-y-4">
              <FormField
                control={form.control}
                name="sourceWarehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('documents.storeTransfers.fields.sourceWarehouse')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'documents.storeTransfers.fields.sourceWarehousePlaceholder'
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currentStoreWarehouses.map((warehouse) => (
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

              <FormField
                control={form.control}
                name="destinationStoreId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('documents.storeTransfers.fields.destinationStore')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'documents.storeTransfers.fields.destinationStorePlaceholder'
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableDestinationStores.map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.name}
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
                name="destinationWarehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('documents.storeTransfers.fields.destinationWarehouse')}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!destinationStoreId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !destinationStoreId
                                ? t('documents.storeTransfers.fields.destinationStorePlaceholder')
                                : t(
                                    'documents.storeTransfers.fields.destinationWarehousePlaceholder'
                                  )
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableDestinationWarehouses.map((warehouse) => (
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

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('documents.storeTransfers.fields.notes')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('documents.storeTransfers.fields.notesPlaceholder')}
                      />
                    </FormControl>
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
