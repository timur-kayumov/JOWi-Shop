'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Pencil, Trash2, Settings } from 'lucide-react';
import {
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Badge,
  DataTable,
  Column,
} from '@jowi/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createStoreSchema, type CreateStoreSchema } from '@jowi/validators';

// Mock data
const mockStores = [
  {
    id: '1',
    name: 'Магазин Центральный',
    address: 'ул. Амира Темура, 10',
    phone: '+998901234567',
    country: 'Uzbekistan',
    city: 'Ташкент',
    shiftTransitionTime: '00:00',
    isActive: true,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Магазин Чиланзар',
    address: 'Чиланзар, 12-квартал',
    phone: '+998907654321',
    country: 'Uzbekistan',
    city: 'Ташкент',
    shiftTransitionTime: '00:00',
    isActive: true,
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    name: 'Магазин Юнусабад',
    address: 'Юнусабад, 5-квартал',
    phone: '+998905555555',
    country: 'Uzbekistan',
    city: 'Ташкент',
    shiftTransitionTime: '00:00',
    isActive: false,
    createdAt: new Date('2024-03-10'),
  },
];

export default function StoresPage() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [stores, setStores] = useState(mockStores);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<typeof mockStores[0] | null>(null);

  const form = useForm<CreateStoreSchema>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      country: 'Uzbekistan',
      city: '',
      shiftTransitionTime: '00:00',
      isActive: true,
    },
  });

  const filteredStores = stores.filter((store) =>
    store.name.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = (data: CreateStoreSchema) => {
    if (editingStore) {
      // Update existing store
      setStores(stores.map((s) => (s.id === editingStore.id ? { ...s, ...data } : s)));
    } else {
      // Create new store
      const newStore = {
        id: String(stores.length + 1),
        ...data,
        createdAt: new Date(),
      };
      setStores([...stores, newStore]);
    }
    setOpen(false);
    form.reset();
    setEditingStore(null);
  };

  const handleEdit = (store: typeof mockStores[0]) => {
    setEditingStore(store);
    form.reset(store);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('pages.stores.deleteConfirm'))) {
      setStores(stores.filter((s) => s.id !== id));
    }
  };

  const handleDialogClose = () => {
    setOpen(false);
    form.reset();
    setEditingStore(null);
  };

  const getCountryLabel = (country: string) => {
    const labels: Record<string, string> = {
      Uzbekistan: t('pages.stores.countries.uzbekistan'),
      Kazakhstan: t('pages.stores.countries.kazakhstan'),
      Kyrgyzstan: t('pages.stores.countries.kyrgyzstan'),
    };
    return labels[country] || country;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('pages.stores.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('pages.stores.subtitle')}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('pages.stores.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingStore(null)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('pages.stores.addStore')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingStore ? t('pages.stores.editStore') : t('pages.stores.newStore')}
              </DialogTitle>
              <DialogDescription>
                {editingStore
                  ? t('pages.stores.editDescription')
                  : t('pages.stores.newDescription')}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pages.stores.fields.name')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('pages.stores.placeholders.name')} {...field} />
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
                          <Input placeholder={t('pages.stores.placeholders.city')} {...field} />
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
                          <Input placeholder={t('pages.stores.placeholders.phone')} {...field} />
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
                          <Input placeholder={t('pages.stores.placeholders.shiftTransitionTime')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    {t('actions.cancel')}
                  </Button>
                  <Button type="submit">
                    {editingStore ? t('actions.save') : t('pages.stores.addStore')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={[
          {
            key: 'name',
            label: t('pages.stores.fields.name'),
            sortable: true,
            render: (store) => <span className="font-medium">{store.name}</span>,
          },
          {
            key: 'address',
            label: t('pages.stores.fields.address'),
            sortable: true,
            className: 'text-muted-foreground',
          },
          {
            key: 'city',
            label: t('pages.stores.fields.city'),
            sortable: true,
          },
          {
            key: 'phone',
            label: t('pages.stores.fields.phone'),
          },
          {
            key: 'isActive',
            label: t('fields.status'),
            sortable: true,
            render: (store) => (
              <Badge variant={store.isActive ? 'success' : 'outline'}>
                {store.isActive ? t('status.active') : t('status.inactive')}
              </Badge>
            ),
          },
          {
            key: 'actions',
            label: '',
            render: (store) => (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/intranet/stores/${store.id}`);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/store/${store.id}`);
                  }}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]}
        data={filteredStores}
        onRowClick={(store) => router.push(`/store/${store.id}`)}
        emptyMessage={search ? t('pages.stores.notFound') : t('pages.stores.noStores')}
      />

      {filteredStores.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {t('pages.stores.showing', { count: filteredStores.length, total: stores.length })}
        </div>
      )}
    </div>
  );
}
