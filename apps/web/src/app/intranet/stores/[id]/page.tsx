'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MapPin, Phone, Clock, Globe, Building, Pencil, Trash2 } from 'lucide-react';
import {
  Button,
  Badge,
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
  Input,
  TimeInput,
  ImageUpload,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jowi/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createStoreSchema, type CreateStoreSchema } from '@jowi/validators';
import '../../../../lib/i18n'; // Ensure i18n is initialized

// Mock data for stores with additional details
const mockStoreData = {
  '1': {
    id: '1',
    name: 'Магазин Центральный',
    address: 'ул. Амира Темура, 10',
    phone: '+998901234567',
    country: 'Uzbekistan',
    city: 'Ташкент',
    shiftTransitionTime: '00:00',
    logoUrl: null,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    stats: {
      employeeCount: 8,
      terminalCount: 3,
      todaySales: 12500000,
      monthSales: 245000000,
    },
  },
  '2': {
    id: '2',
    name: 'Магазин Чиланзар',
    address: 'Чиланзар, 12-квартал',
    phone: '+998907654321',
    country: 'Uzbekistan',
    city: 'Ташкент',
    shiftTransitionTime: '00:00',
    logoUrl: null,
    isActive: true,
    createdAt: new Date('2024-02-20'),
    stats: {
      employeeCount: 6,
      terminalCount: 2,
      todaySales: 8700000,
      monthSales: 178000000,
    },
  },
  '3': {
    id: '3',
    name: 'Магазин Юнусабад',
    address: 'Юнусабад, 5-квартал',
    phone: '+998905555555',
    country: 'Uzbekistan',
    city: 'Ташкент',
    shiftTransitionTime: '00:00',
    logoUrl: null,
    isActive: false,
    createdAt: new Date('2024-03-10'),
    stats: {
      employeeCount: 4,
      terminalCount: 1,
      todaySales: 0,
      monthSales: 45000000,
    },
  },
};

export default function StoreShowPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation('common');
  const storeId = params.id as string;

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const store = mockStoreData[storeId as keyof typeof mockStoreData];

  const form = useForm<CreateStoreSchema>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: store ? {
      name: store.name,
      address: store.address,
      phone: store.phone,
      country: store.country,
      city: store.city,
      logoUrl: store.logoUrl || undefined,
      shiftTransitionTime: store.shiftTransitionTime,
      isActive: store.isActive,
    } : {},
  });

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const onSubmit = (data: CreateStoreSchema) => {
    // TODO: Implement actual store update
    console.log('Updating store:', data);
    setEditDialogOpen(false);
  };

  const confirmDelete = () => {
    // TODO: Implement actual store deletion
    console.log('Deleting store:', storeId);
    setDeleteDialogOpen(false);
    router.push('/intranet/stores');
  };

  const getCountryLabel = (country: string) => {
    const labels: Record<string, string> = {
      Uzbekistan: t('pages.stores.countries.uzbekistan'),
      Kazakhstan: t('pages.stores.countries.kazakhstan'),
      Kyrgyzstan: t('pages.stores.countries.kyrgyzstan'),
    };
    return labels[country] || country;
  };

  if (!store) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => router.push('/intranet/stores')}
          className="bg-white hover:bg-neutral-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('pages.storeDetail.backToList')}
        </Button>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-lg text-muted-foreground">{t('pages.storeDetail.notFound')}</p>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU').format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header with back button only */}
      <div className="flex items-center">
        <Button
          variant="outline"
          onClick={() => router.push('/intranet/stores')}
          className="bg-white hover:bg-neutral-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('actions.backToList')}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Store Info Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-2xl border bg-card p-6 space-y-6">
            <div className="flex flex-col items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
                <Building className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-center">{store.name}</h2>
              <Badge variant={store.isActive ? 'success' : 'outline'} className="mt-2">
                {store.isActive ? t('status.active') : t('status.inactive')}
              </Badge>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">{store.address}</div>
                  <div className="text-muted-foreground">
                    {store.city}, {store.country}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{store.phone}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{t('pages.storeDetail.shiftTransition')}</div>
                  <div className="text-muted-foreground">{store.shiftTransitionTime}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>{store.country}</span>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('pages.storeDetail.created')}</span>
                <span className="text-sm font-medium">{formatDate(store.createdAt)}</span>
              </div>
            </div>

            {/* Edit button at the bottom of info card */}
            <div className="border-t pt-4">
              <Button onClick={handleEdit} className="w-full">
                <Pencil className="mr-2 h-4 w-4" />
                {t('actions.edit')}
              </Button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-2xl border bg-card p-6">
            <Button
              variant="ghost"
              onClick={handleDelete}
              className="w-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('actions.delete')}
            </Button>
          </div>
        </div>

        {/* Stats and Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('pages.storeDetail.employeesCount')}</p>
                  <p className="text-2xl font-bold">{store.stats.employeeCount}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('pages.storeDetail.terminalsCount')}</p>
                  <p className="text-2xl font-bold">{store.stats.terminalCount}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <Building className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('pages.storeDetail.salesToday')}</p>
                  <p className="text-2xl font-bold">{formatCurrency(store.stats.todaySales)} {t('currency')}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Building className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('pages.storeDetail.salesThisMonth')}</p>
                  <p className="text-2xl font-bold">{formatCurrency(store.stats.monthSales)} {t('currency')}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                  <Building className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('pages.stores.editStore')}</DialogTitle>
            <DialogDescription>{t('pages.stores.editDescription')}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.stores.fields.logo')}</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value}
                        onChange={field.onChange}
                        maxSize={5}
                        accept="image/png,image/jpeg"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.stores.fields.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pages.stores.fields.country')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('pages.stores.placeholders.country')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Uzbekistan">{t('pages.stores.countries.uzbekistan')}</SelectItem>
                          <SelectItem value="Kazakhstan">{t('pages.stores.countries.kazakhstan')}</SelectItem>
                          <SelectItem value="Kyrgyzstan">{t('pages.stores.countries.kyrgyzstan')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pages.stores.fields.city')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.stores.fields.address')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('pages.stores.placeholders.address')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pages.stores.fields.phone')}</FormLabel>
                      <FormControl>
                        <Input placeholder="+998" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shiftTransitionTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pages.stores.fields.shiftTransitionTime')}</FormLabel>
                      <FormControl>
                        <TimeInput placeholder="00:00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  {t('actions.cancel')}
                </Button>
                <Button type="submit">{t('actions.save')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('confirmations.deleteStore.title')}</DialogTitle>
            <DialogDescription>
              {t('confirmations.deleteStore.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('confirmations.deleteStore.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              {t('confirmations.deleteStore.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
