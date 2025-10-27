'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react';
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
    if (confirm('Вы уверены, что хотите удалить этот магазин?')) {
      setStores(stores.filter((s) => s.id !== id));
    }
  };

  const handleDialogClose = () => {
    setOpen(false);
    form.reset();
    setEditingStore(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Магазины</h1>
        <p className="text-muted-foreground mt-2">
          Управление магазинами вашего бизнеса
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingStore(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить магазин
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingStore ? 'Редактировать магазин' : 'Новый магазин'}
              </DialogTitle>
              <DialogDescription>
                {editingStore
                  ? 'Внесите изменения в информацию о магазине'
                  : 'Заполните информацию о новом магазине'}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название магазина</FormLabel>
                      <FormControl>
                        <Input placeholder="Магазин Центральный" {...field} />
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
                        <FormLabel>Страна</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите страну" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Uzbekistan">Узбекистан</SelectItem>
                            <SelectItem value="Kazakhstan">Казахстан</SelectItem>
                            <SelectItem value="Kyrgyzstan">Кыргызстан</SelectItem>
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
                        <FormLabel>Город</FormLabel>
                        <FormControl>
                          <Input placeholder="Ташкент" {...field} />
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
                      <FormLabel>Адрес</FormLabel>
                      <FormControl>
                        <Input placeholder="ул. Амира Темура, 10" {...field} />
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
                        <FormLabel>Телефон</FormLabel>
                        <FormControl>
                          <Input placeholder="+998901234567" {...field} />
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
                        <FormLabel>Время перехода кассы</FormLabel>
                        <FormControl>
                          <Input placeholder="00:00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Отмена
                  </Button>
                  <Button type="submit">
                    {editingStore ? 'Сохранить изменения' : 'Создать магазин'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Название</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Адрес</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Город</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Телефон</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Статус</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredStores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {search ? 'Ничего не найдено' : 'Нет магазинов'}
                  </td>
                </tr>
              ) : (
                filteredStores.map((store) => (
                  <tr key={store.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-medium">{store.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{store.address}</td>
                    <td className="px-4 py-3 text-sm">{store.city}</td>
                    <td className="px-4 py-3 text-sm">{store.phone}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={store.isActive ? 'success' : 'outline'}>
                        {store.isActive ? 'Активен' : 'Неактивен'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/intranet/stores/${store.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(store)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(store.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredStores.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Показано {filteredStores.length} из {stores.length} магазинов
        </div>
      )}
    </div>
  );
}
