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
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DataTable,
  type Column,
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
} from '@jowi/ui';

import { toast } from '@/lib/toast';

import type { Supplier } from '@/types/supplier';
import {
  mockSuppliers,
  createSupplierSchema,
  type CreateSupplierInput,
} from '@/types/supplier';

export default function SuppliersPage() {
  const { t } = useTranslation('common');
  const router = useRouter();

  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const form = useForm<CreateSupplierInput>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: '',
      entityType: 'legal',
      phone: '',
      email: '',
      address: '',
      startingBalance: 0,
      legalName: '',
      bankAccount: '',
      inn: '',
      mfo: '',
      bankName: '',
    },
  });

  const entityType = form.watch('entityType');

  // Format currency with color based on balance
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

  // Filter suppliers by search query
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) =>
      supplier.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [suppliers, search]);

  // Table columns
  const columns: Column<Supplier>[] = [
    {
      key: 'name',
      label: t('documents.suppliers.name'),
      sortable: true,
      render: (supplier) => (
        <div className="font-medium">{supplier.name}</div>
      ),
    },
    {
      key: 'contacts',
      label: t('documents.suppliers.contacts'),
      render: (supplier) => (
        <div className="text-sm">
          {supplier.phone && <div>{supplier.phone}</div>}
          {supplier.email && (
            <div className="text-muted-foreground">{supplier.email}</div>
          )}
        </div>
      ),
    },
    {
      key: 'balance',
      label: t('documents.suppliers.balance'),
      sortable: true,
      render: (supplier) => (
        <span
          className={`font-medium ${
            supplier.balance > 0
              ? 'text-green-600'
              : supplier.balance < 0
                ? 'text-red-600'
                : 'text-muted-foreground'
          }`}
        >
          {formatCurrency(supplier.balance)}
        </span>
      ),
    },
  ];

  // Handle form submit
  const handleSubmit = (data: CreateSupplierInput) => {
    if (editingSupplier) {
      // Update existing supplier
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === editingSupplier.id
            ? {
                ...s,
                ...data,
                balance: s.balance, // Keep existing balance
                updatedAt: new Date(),
              }
            : s
        )
      );
      toast({
        title: t('documents.suppliers.updateSuccess'),
      });
    } else {
      // Create new supplier
      const newSupplier: Supplier = {
        id: String(suppliers.length + 1),
        ...data,
        balance: data.startingBalance,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setSuppliers((prev) => [newSupplier, ...prev]);
      toast({
        title: t('documents.suppliers.createSuccess'),
      });
    }

    setIsCreateDialogOpen(false);
    setEditingSupplier(null);
    form.reset();
  };

  // Open edit dialog
  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.reset({
      name: supplier.name,
      entityType: supplier.entityType,
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      startingBalance: supplier.balance,
      legalName: supplier.legalName || '',
      bankAccount: supplier.bankAccount || '',
      inn: supplier.inn || '',
      mfo: supplier.mfo || '',
      bankName: supplier.bankName || '',
    });
    setIsCreateDialogOpen(true);
  };

  // Navigate to supplier detail page
  const handleRowClick = (supplier: Supplier) => {
    router.push(`./suppliers/${supplier.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('documents.suppliers.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('documents.suppliers.description')}
          </p>
        </div>

        {/* Search and Create Button */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('documents.suppliers.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('documents.suppliers.createSupplier')}
          </Button>
        </div>
      </Card>

      {/* Table Card */}
      <Card>
        <DataTable
          columns={columns}
          data={filteredSuppliers}
          onRowClick={handleRowClick}
          emptyMessage={t('documents.suppliers.emptyMessage')}
          pagination={{ enabled: true, pageSize: 15 }}
        />
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingSupplier(null);
            form.reset();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier
                ? t('documents.suppliers.editSupplier')
                : t('documents.suppliers.createSupplier')}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier
                ? t('documents.suppliers.editSupplierDescription')
                : t('documents.suppliers.createSupplierDescription')}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              {/* Entity Type */}
              <FormField
                control={form.control}
                name="entityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('documents.suppliers.entityType')}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="individual">
                          {t('documents.suppliers.individual')}
                        </SelectItem>
                        <SelectItem value="legal">
                          {t('documents.suppliers.legal')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>{t('documents.suppliers.name')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t(
                            'documents.suppliers.namePlaceholder'
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('documents.suppliers.phone')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t(
                            'documents.suppliers.phonePlaceholder'
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('documents.suppliers.email')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder={t(
                            'documents.suppliers.emailPlaceholder'
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>{t('documents.suppliers.address')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t(
                            'documents.suppliers.addressPlaceholder'
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!editingSupplier && (
                  <FormField
                    control={form.control}
                    name="startingBalance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('documents.suppliers.startingBalance')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Legal Entity Fields */}
              {entityType === 'legal' && (
                <>
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">
                      {t('documents.suppliers.companyData')}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="legalName"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>
                              {t('documents.suppliers.legalName')}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t(
                                  'documents.suppliers.legalNamePlaceholder'
                                )}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="inn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('documents.suppliers.inn')}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t(
                                  'documents.suppliers.innPlaceholder'
                                )}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bankAccount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('documents.suppliers.bankAccount')}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t(
                                  'documents.suppliers.bankAccountPlaceholder'
                                )}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mfo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('documents.suppliers.mfo')}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t(
                                  'documents.suppliers.mfoPlaceholder'
                                )}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('documents.suppliers.bankName')}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t(
                                  'documents.suppliers.bankNamePlaceholder'
                                )}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingSupplier(null);
                    form.reset();
                  }}
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
