'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Pencil, Trash2, Filter, User } from 'lucide-react';
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
import { createCustomerSchema, type CreateCustomerSchema } from '@jowi/validators';

// Mock data
const mockCustomers = [
  {
    id: '1',
    firstName: 'Алишер',
    lastName: 'Усманов',
    phone: '+998901234567',
    email: 'alisher@example.com',
    gender: 'male',
    dateOfBirth: new Date('1990-05-15'),
    loyaltyCardNumber: 'LC001234',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    firstName: 'Малика',
    lastName: 'Каримова',
    phone: '+998907654321',
    email: 'malika@example.com',
    gender: 'female',
    dateOfBirth: new Date('1985-08-22'),
    loyaltyCardNumber: 'LC001235',
    createdAt: new Date('2024-02-10'),
  },
  {
    id: '3',
    firstName: 'Дмитрий',
    lastName: 'Иванов',
    phone: '+998905555555',
    email: 'dmitry@example.com',
    gender: 'male',
    dateOfBirth: new Date('1995-11-30'),
    loyaltyCardNumber: null,
    createdAt: new Date('2024-03-05'),
  },
  {
    id: '4',
    firstName: 'Наргиза',
    lastName: 'Ахмедова',
    phone: '+998903333333',
    email: 'nargiza@example.com',
    gender: 'female',
    dateOfBirth: new Date('1988-03-17'),
    loyaltyCardNumber: 'LC001236',
    createdAt: new Date('2024-02-20'),
  },
];

export default function CustomersPage() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [customers, setCustomers] = useState(mockCustomers);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [birthYearFilter, setBirthYearFilter] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<typeof mockCustomers[0] | null>(null);

  const form = useForm<CreateCustomerSchema>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      gender: undefined,
      dateOfBirth: undefined,
      loyaltyCardNumber: '',
    },
  });

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.firstName.toLowerCase().includes(search.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(search.toLowerCase()) ||
      customer.phone.includes(search);

    const matchesGender = genderFilter === 'all' || customer.gender === genderFilter;

    let matchesBirthYear = true;
    if (birthYearFilter !== 'all') {
      const birthYear = customer.dateOfBirth?.getFullYear();
      if (birthYearFilter === '2000+' && birthYear) {
        matchesBirthYear = birthYear >= 2000;
      } else if (birthYearFilter === '1990-1999' && birthYear) {
        matchesBirthYear = birthYear >= 1990 && birthYear < 2000;
      } else if (birthYearFilter === '1980-1989' && birthYear) {
        matchesBirthYear = birthYear >= 1980 && birthYear < 1990;
      } else if (birthYearFilter === '1970-1979' && birthYear) {
        matchesBirthYear = birthYear >= 1970 && birthYear < 1980;
      } else if (birthYearFilter === '<1970' && birthYear) {
        matchesBirthYear = birthYear < 1970;
      }
    }

    return matchesSearch && matchesGender && matchesBirthYear;
  });

  const onSubmit = (data: CreateCustomerSchema) => {
    if (editingCustomer) {
      // Update existing customer
      setCustomers(customers.map((c) => (c.id === editingCustomer.id ? { ...c, ...data } : c)));
    } else {
      // Create new customer
      const newCustomer = {
        id: String(customers.length + 1),
        ...data,
        email: data.email || '',
        gender: data.gender || 'other',
        dateOfBirth: data.dateOfBirth || new Date(),
        loyaltyCardNumber: data.loyaltyCardNumber || null,
        createdAt: new Date(),
      };
      setCustomers([...customers, newCustomer]);
    }
    setOpen(false);
    form.reset();
    setEditingCustomer(null);
  };

  const handleEdit = (customer: typeof mockCustomers[0]) => {
    setEditingCustomer(customer);
    form.reset({
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      email: customer.email || undefined,
      gender: customer.gender as 'male' | 'female' | 'other' | undefined,
      dateOfBirth: customer.dateOfBirth || undefined,
      loyaltyCardNumber: customer.loyaltyCardNumber || undefined,
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('pages.customers.deleteConfirm'))) {
      setCustomers(customers.filter((c) => c.id !== id));
    }
  };

  const handleDialogClose = () => {
    setOpen(false);
    form.reset();
    setEditingCustomer(null);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('ru-RU').format(date);
  };

  const getGenderBadge = (gender: string) => {
    const labels = {
      male: t('pages.customers.gender.male'),
      female: t('pages.customers.gender.female'),
      other: t('pages.customers.gender.other'),
    };
    return labels[gender as keyof typeof labels] || gender;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('pages.customers.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('pages.customers.subtitle')}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('pages.customers.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingCustomer(null)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('pages.customers.addCustomer')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingCustomer ? t('pages.customers.editCustomer') : t('pages.customers.newCustomer')}
                </DialogTitle>
                <DialogDescription>
                  {editingCustomer
                    ? t('pages.customers.editDescription')
                    : t('pages.customers.newDescription')}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('pages.customers.fields.firstName')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('pages.customers.placeholders.firstName')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('pages.customers.fields.lastName')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('pages.customers.placeholders.lastName')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('pages.customers.fields.phone')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('pages.customers.placeholders.phone')} {...field} />
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
                        <FormLabel>{t('pages.customers.fields.emailOptional')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('pages.customers.placeholders.email')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('pages.customers.fields.genderOptional')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('pages.customers.placeholders.selectGender')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">{t('pages.customers.gender.male')}</SelectItem>
                              <SelectItem value="female">{t('pages.customers.gender.female')}</SelectItem>
                              <SelectItem value="other">{t('pages.customers.gender.other')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('pages.customers.fields.dateOfBirthOptional')}</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                              onChange={(e) => {
                                const date = e.target.value ? new Date(e.target.value) : undefined;
                                field.onChange(date);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="loyaltyCardNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('pages.customers.fields.loyaltyCardNumber')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('pages.customers.placeholders.loyaltyCardNumber')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleDialogClose}>
                      {t('actions.cancel')}
                    </Button>
                    <Button type="submit">
                      {editingCustomer ? t('actions.save') : t('actions.create')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Пол" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('pages.customers.gender.all')}</SelectItem>
              <SelectItem value="male">{t('pages.customers.gender.male')}</SelectItem>
              <SelectItem value="female">{t('pages.customers.gender.female')}</SelectItem>
              <SelectItem value="other">{t('pages.customers.gender.other')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={birthYearFilter} onValueChange={setBirthYearFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Год рождения" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('pages.customers.birthYear.all')}</SelectItem>
              <SelectItem value="2000+">{t('pages.customers.birthYear.2000plus')}</SelectItem>
              <SelectItem value="1990-1999">{t('pages.customers.birthYear.1990-1999')}</SelectItem>
              <SelectItem value="1980-1989">{t('pages.customers.birthYear.1980-1989')}</SelectItem>
              <SelectItem value="1970-1979">{t('pages.customers.birthYear.1970-1979')}</SelectItem>
              <SelectItem value="<1970">{t('pages.customers.birthYear.before1970')}</SelectItem>
            </SelectContent>
          </Select>

          {(genderFilter !== 'all' || birthYearFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setGenderFilter('all');
                setBirthYearFilter('all');
              }}
            >
              {t('pages.customers.resetFilters')}
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={[
          {
            key: 'fullName',
            label: t('pages.customers.fields.client'),
            sortable: true,
            render: (customer) => (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="font-medium">
                  {customer.firstName} {customer.lastName}
                </div>
              </div>
            ),
          },
          {
            key: 'phone',
            label: t('pages.customers.fields.phone'),
            sortable: true,
          },
          {
            key: 'email',
            label: t('pages.customers.fields.email'),
            sortable: true,
            render: (customer) => (
              <span className="text-muted-foreground">{customer.email || '-'}</span>
            ),
          },
          {
            key: 'gender',
            label: t('pages.customers.fields.gender'),
            sortable: true,
            render: (customer) => (
              <Badge variant="outline">{getGenderBadge(customer.gender)}</Badge>
            ),
          },
          {
            key: 'dateOfBirth',
            label: t('pages.customers.fields.dateOfBirth'),
            sortable: true,
            render: (customer) => formatDate(customer.dateOfBirth),
          },
          {
            key: 'loyaltyCardNumber',
            label: t('pages.customers.fields.loyaltyCard'),
            render: (customer) =>
              customer.loyaltyCardNumber ? (
                <Badge variant="success">{customer.loyaltyCardNumber}</Badge>
              ) : (
                <span className="text-muted-foreground">-</span>
              ),
          },
        ]}
        data={filteredCustomers}
        onRowClick={(customer) => router.push(`/intranet/customers/${customer.id}`)}
        emptyMessage={
          search || genderFilter !== 'all' || birthYearFilter !== 'all'
            ? t('pages.customers.notFound')
            : t('pages.customers.noCustomers')
        }
        pagination={{ enabled: true, pageSize: 15 }}
      />

      {filteredCustomers.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {t('pages.customers.showing', { count: filteredCustomers.length, total: customers.length })}
        </div>
      )}
    </div>
  );
}
