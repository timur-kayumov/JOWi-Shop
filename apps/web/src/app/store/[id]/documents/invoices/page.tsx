'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  type Column,
  formatDate,
} from '@jowi/ui';

import type {
  Invoice,
  InvoiceDirection,
  InvoiceStatus,
  CreateInvoiceInput,
} from '@/types/invoice';
import { mockInvoices, createInvoiceSchema } from '@/types/invoice';
import { mockSuppliers } from '@/types/supplier';

// ==================== UTILITIES ====================

const formatCurrency = (amount: number): string => {
  // Use simple regex replacement to avoid hydration mismatch
  // between server (Node.js) and client (browser) Intl.NumberFormat
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' сўм';
};

// ==================== MOCK DATA ====================

const mockWarehouses = [
  { id: 'wh1', name: 'Центральный склад' },
  { id: 'wh2', name: 'Склад №2 (Чиланзар)' },
  { id: 'wh3', name: 'Склад №3 (Юнусабад)' },
];

// ==================== COMPONENT ====================

export default function InvoicesPage() {
  const { t } = useTranslation('common');
  const router = useRouter();

  // ==================== STATE ====================
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState<InvoiceDirection>('outgoing');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>();
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // ==================== FORM ====================
  const form = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      supplierId: '',
      warehouseId: '',
      notes: '',
    },
  });

  // ==================== HANDLERS ====================
  const handleCreateInvoice = (data: CreateInvoiceInput) => {
    const supplier = mockSuppliers.find((s) => s.id === data.supplierId);
    const warehouse = mockWarehouses.find((w) => w.id === data.warehouseId);

    if (!supplier || !warehouse) {
      return;
    }

    const newInvoice: Invoice = {
      id: `draft-${Date.now()}`,
      documentNumber: `INV-DRAFT-${Date.now()}`,
      direction: 'outgoing',
      supplierId: supplier.id,
      supplierName: supplier.name,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      status: 'draft',
      notes: data.notes,
      itemsCount: 0,
      totalAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setInvoices([newInvoice, ...invoices]);
    setIsCreateDialogOpen(false);
    form.reset();

    // Redirect to detail page for editing
    router.push(`/store/demo/documents/invoices/${newInvoice.id}`);
  };

  // ==================== FILTERING ====================
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // Search filter
      const searchMatch = invoice.documentNumber
        .toLowerCase()
        .includes(search.toLowerCase());

      // Direction filter
      const directionMatch = invoice.direction === direction;

      // Date range filter
      let dateMatch = true;
      if (dateRange?.from || dateRange?.to) {
        const invoiceDate = invoice.publishedAt || invoice.createdAt;
        if (dateRange.from && invoiceDate < dateRange.from) {
          dateMatch = false;
        }
        if (dateRange.to && invoiceDate > dateRange.to) {
          dateMatch = false;
        }
      }

      // Warehouse filter
      const warehouseMatch =
        warehouseFilter === 'all' || invoice.warehouseId === warehouseFilter;

      // Status filter
      const statusMatch =
        statusFilter === 'all' || invoice.status === statusFilter;

      return (
        searchMatch && directionMatch && dateMatch && warehouseMatch && statusMatch
      );
    });
  }, [invoices, search, direction, dateRange, warehouseFilter, statusFilter]);

  // ==================== TABLE COLUMNS ====================
  const columns: Column<Invoice>[] = [
    {
      key: 'documentNumber',
      label: t('documents.invoices.columns.number'),
      sortable: true,
      render: (invoice) => (
        <div className="font-medium">{invoice.documentNumber}</div>
      ),
    },
    {
      key: 'publishedAt',
      label: t('documents.invoices.columns.date'),
      sortable: true,
      render: (invoice) => (
        <div className="text-sm">
          {formatDate(invoice.publishedAt || invoice.createdAt)}
        </div>
      ),
    },
    {
      key: 'supplierName',
      label: t('documents.invoices.columns.supplier'),
      sortable: true,
      render: (invoice) => (
        <div className="text-sm">{invoice.supplierName}</div>
      ),
    },
    {
      key: 'warehouseName',
      label: t('documents.invoices.columns.warehouse'),
      sortable: true,
      render: (invoice) => (
        <div className="text-sm">{invoice.warehouseName}</div>
      ),
    },
    {
      key: 'itemsCount',
      label: t('documents.invoices.columns.itemsCount'),
      sortable: true,
      render: (invoice) => <div className="text-sm">{invoice.itemsCount}</div>,
    },
    {
      key: 'totalAmount',
      label: t('documents.invoices.columns.total'),
      sortable: true,
      render: (invoice) => (
        <div className="text-sm font-medium">
          {formatCurrency(invoice.totalAmount)}
        </div>
      ),
    },
    {
      key: 'status',
      label: t('documents.invoices.columns.status'),
      sortable: true,
      render: (invoice) => (
        <StatusBadge type="transaction" status={invoice.status} t={t} />
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
            {t('documents.invoices.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('documents.invoices.description')}
          </p>
        </div>

        {/* Direction Tabs */}
        <div className="mb-6">
          <Tabs
            value={direction}
            onValueChange={(value) => setDirection(value as InvoiceDirection)}
          >
            <TabsList>
              <TabsTrigger value="outgoing">
                {t('documents.invoices.direction.outgoing')}
              </TabsTrigger>
              <TabsTrigger value="incoming">
                {t('documents.invoices.direction.incoming')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('documents.invoices.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            placeholder={t('documents.invoices.filters.selectDateRange')}
            className="w-full sm:w-[240px]"
          />

          <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue
                placeholder={t('documents.invoices.filters.allWarehouses')}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('documents.invoices.filters.allWarehouses')}
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
                placeholder={t('documents.invoices.filters.allStatuses')}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('documents.invoices.filters.allStatuses')}
              </SelectItem>
              <SelectItem value="draft">
                {t('status.draft')}
              </SelectItem>
              <SelectItem value="published">
                {t('status.published')}
              </SelectItem>
              <SelectItem value="canceled">
                {t('status.canceled')}
              </SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('documents.invoices.createInvoice')}
          </Button>
        </div>
      </Card>

      {/* Table Card */}
      <Card>
        <DataTable
          columns={columns}
          data={filteredInvoices}
          emptyMessage={t('documents.invoices.emptyMessage')}
          onRowClick={(invoice) =>
            router.push(`/store/demo/documents/invoices/${invoice.id}`)
          }
          pagination={{ enabled: true }}
        />
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('documents.invoices.createInvoice')}</DialogTitle>
            <DialogDescription>
              {t('documents.invoices.createInvoiceDescription')}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreateInvoice)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('documents.invoices.fields.supplier')}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'documents.invoices.fields.supplierPlaceholder'
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockSuppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
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
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('documents.invoices.fields.warehouse')}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'documents.invoices.fields.warehousePlaceholder'
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
                    <FormLabel>{t('documents.invoices.fields.notes')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t(
                          'documents.invoices.fields.notesPlaceholder'
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
