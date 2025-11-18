'use client';

import { useMemo, useState } from 'react';
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
  WarehouseTransfer,
  WarehouseTransferStatus,
  CreateWarehouseTransferInput,
} from '@/types/warehouse-transfer';
import {
  mockWarehouseTransfers,
  mockWarehouses,
  createWarehouseTransferSchema,
} from '@/types/warehouse-transfer';

// ==================== UTILITIES ====================

const formatCurrency = (amount: number): string => {
  // Use simple regex replacement to avoid hydration mismatch
  // between server (Node.js) and client (browser) Intl.NumberFormat
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' сўм';
};

// ==================== COMPONENT ====================

export default function WarehouseTransfersPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const params = useParams();

  // ==================== STATE ====================
  const [transfers, setTransfers] = useState<WarehouseTransfer[]>(
    mockWarehouseTransfers
  );
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>();
  const [sourceWarehouseFilter, setSourceWarehouseFilter] =
    useState<string>('all');
  const [destinationWarehouseFilter, setDestinationWarehouseFilter] =
    useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<
    WarehouseTransferStatus | 'all'
  >('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // ==================== FORM ====================
  const form = useForm<CreateWarehouseTransferInput>({
    resolver: zodResolver(createWarehouseTransferSchema),
    defaultValues: {
      sourceWarehouseId: '',
      destinationWarehouseId: '',
      notes: '',
    },
  });

  // ==================== HANDLERS ====================
  const handleCreateTransfer = (data: CreateWarehouseTransferInput) => {
    const sourceWarehouse = mockWarehouses.find(
      (w) => w.id === data.sourceWarehouseId
    );
    const destinationWarehouse = mockWarehouses.find(
      (w) => w.id === data.destinationWarehouseId
    );

    if (!sourceWarehouse || !destinationWarehouse) {
      return;
    }

    const newTransfer: WarehouseTransfer = {
      id: `draft-${Date.now()}`,
      documentNumber: `WT-DRAFT-${Date.now()}`,
      sourceWarehouseId: sourceWarehouse.id,
      sourceWarehouseName: sourceWarehouse.name,
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

    // Redirect to detail page for editing (future implementation)
    // router.push(`/store/demo/documents/warehouse-transfers/${newTransfer.id}`);
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

      // Destination warehouse filter
      const destinationWarehouseMatch =
        destinationWarehouseFilter === 'all' ||
        transfer.destinationWarehouseId === destinationWarehouseFilter;

      // Status filter
      const statusMatch =
        statusFilter === 'all' || transfer.status === statusFilter;

      return (
        searchMatch &&
        dateMatch &&
        sourceWarehouseMatch &&
        destinationWarehouseMatch &&
        statusMatch
      );
    });
  }, [
    transfers,
    search,
    dateRange,
    sourceWarehouseFilter,
    destinationWarehouseFilter,
    statusFilter,
  ]);

  // ==================== TABLE COLUMNS ====================
  const columns: Column<WarehouseTransfer>[] = [
    {
      key: 'documentNumber',
      label: t('documents.warehouseTransfers.columns.number'),
      sortable: true,
      render: (transfer) => (
        <div className="font-medium">{transfer.documentNumber}</div>
      ),
    },
    {
      key: 'publishedAt',
      label: t('documents.warehouseTransfers.columns.date'),
      sortable: true,
      render: (transfer) => (
        <div className="text-sm">
          {formatDate(transfer.publishedAt || transfer.createdAt)}
        </div>
      ),
    },
    {
      key: 'sourceWarehouseName',
      label: t('documents.warehouseTransfers.columns.sourceWarehouse'),
      sortable: true,
      render: (transfer) => (
        <div className="text-sm">{transfer.sourceWarehouseName}</div>
      ),
    },
    {
      key: 'destinationWarehouseName',
      label: t('documents.warehouseTransfers.columns.destinationWarehouse'),
      sortable: true,
      render: (transfer) => (
        <div className="text-sm">{transfer.destinationWarehouseName}</div>
      ),
    },
    {
      key: 'itemsCount',
      label: t('documents.warehouseTransfers.columns.itemsCount'),
      sortable: true,
      render: (transfer) => <div className="text-sm">{transfer.itemsCount}</div>,
    },
    {
      key: 'totalAmount',
      label: t('documents.warehouseTransfers.columns.total'),
      sortable: true,
      render: (transfer) => (
        <div className="text-sm font-medium">
          {formatCurrency(transfer.totalAmount)}
        </div>
      ),
    },
    {
      key: 'status',
      label: t('documents.warehouseTransfers.columns.status'),
      sortable: true,
      render: (transfer) => (
        <StatusBadge type="transaction" status={transfer.status} t={t} />
      ),
    },
  ];

  // ==================== RENDER ====================
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('documents.warehouseTransfers.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('documents.warehouseTransfers.description')}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('documents.warehouseTransfers.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            placeholder={t('documents.warehouseTransfers.filters.selectDateRange')}
            className="w-full sm:w-[240px]"
          />

          <Select
            value={sourceWarehouseFilter}
            onValueChange={setSourceWarehouseFilter}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue
                placeholder={t(
                  'documents.warehouseTransfers.filters.sourceWarehouse'
                )}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('documents.warehouseTransfers.filters.allWarehouses')}
              </SelectItem>
              {mockWarehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={destinationWarehouseFilter}
            onValueChange={setDestinationWarehouseFilter}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue
                placeholder={t(
                  'documents.warehouseTransfers.filters.destinationWarehouse'
                )}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('documents.warehouseTransfers.filters.allWarehouses')}
              </SelectItem>
              {mockWarehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue
                placeholder={t('documents.warehouseTransfers.filters.allStatuses')}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('documents.warehouseTransfers.filters.allStatuses')}
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
          emptyMessage={t('documents.warehouseTransfers.emptyMessage')}
          onRowClick={(transfer) => {
            router.push(`/store/${params.id}/documents/warehouse-transfers/${transfer.id}`);
          }}
          pagination={{ enabled: true }}
        />
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('documents.warehouseTransfers.createTransfer')}
            </DialogTitle>
            <DialogDescription>
              {t('documents.warehouseTransfers.createTransferDescription')}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreateTransfer)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="sourceWarehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('documents.warehouseTransfers.fields.sourceWarehouse')}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'documents.warehouseTransfers.fields.sourceWarehousePlaceholder'
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

              <FormField
                control={form.control}
                name="destinationWarehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t(
                        'documents.warehouseTransfers.fields.destinationWarehouse'
                      )}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'documents.warehouseTransfers.fields.destinationWarehousePlaceholder'
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

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('documents.warehouseTransfers.fields.notes')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t(
                          'documents.warehouseTransfers.fields.notesPlaceholder'
                        )}
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
