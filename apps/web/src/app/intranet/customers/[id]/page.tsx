'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Mail, Phone, Calendar, CreditCard, ShoppingBag, User, Edit, Trash } from 'lucide-react';
import {
  Button,
  Badge,
  Input,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jowi/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateCustomerSchema, type UpdateCustomerSchema } from '@jowi/validators';
import '../../../../lib/i18n'; // Ensure i18n is initialized
import { CustomerPurchaseHistory } from '../../../../components/customer-purchase-history';

// Mock data for a single customer with purchase history
const mockCustomerData = {
  '1': {
    id: '1',
    firstName: 'Алишер',
    lastName: 'Усманов',
    phone: '+998901234567',
    email: 'alisher@example.com',
    gender: 'male',
    dateOfBirth: new Date('1990-05-15'),
    loyaltyCardNumber: 'LC001234',
    createdAt: new Date('2024-01-15'),
    receipts: [
      {
        id: 'R001',
        storeId: 'store1',
        storeName: 'Магазин Центральный',
        createdAt: new Date('2024-03-15T14:30:00'),
        totalAmount: 250000,
        items: [
          { name: 'Кроссовки Nike Air Max', quantity: 1, price: 150000 },
          { name: 'Футболка Adidas', quantity: 2, price: 50000 },
        ],
        payments: [{ method: 'card', amount: 250000 }],
      },
      {
        id: 'R002',
        storeId: 'store2',
        storeName: 'Магазин Чиланзар',
        createdAt: new Date('2024-03-10T10:15:00'),
        totalAmount: 120000,
        items: [
          { name: 'Шорты Puma', quantity: 1, price: 80000 },
          { name: 'Носки спортивные', quantity: 4, price: 10000 },
        ],
        payments: [{ method: 'cash', amount: 120000 }],
      },
      {
        id: 'R003',
        storeId: 'store1',
        storeName: 'Магазин Центральный',
        createdAt: new Date('2024-02-28T16:45:00'),
        totalAmount: 350000,
        items: [
          { name: 'Куртка зимняя', quantity: 1, price: 350000 },
        ],
        payments: [{ method: 'card', amount: 350000 }],
      },
    ],
  },
  '2': {
    id: '2',
    firstName: 'Малика',
    lastName: 'Каримова',
    phone: '+998907654321',
    email: 'malika@example.com',
    gender: 'female',
    dateOfBirth: new Date('1985-08-22'),
    loyaltyCardNumber: 'LC001235',
    createdAt: new Date('2024-02-10'),
    receipts: [
      {
        id: 'R004',
        storeId: 'store2',
        storeName: 'Магазин Чиланзар',
        createdAt: new Date('2024-03-12T11:20:00'),
        totalAmount: 180000,
        items: [
          { name: 'Платье летнее', quantity: 1, price: 180000 },
        ],
        payments: [{ method: 'card', amount: 180000 }],
      },
    ],
  },
};

export default function CustomerShowPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation('common');
  const customerId = params.id as string;

  const customer = mockCustomerData[customerId as keyof typeof mockCustomerData];

  // Dialog states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form for editing customer
  const form = useForm<UpdateCustomerSchema>({
    resolver: zodResolver(updateCustomerSchema),
    defaultValues: {
      firstName: customer?.firstName || '',
      lastName: customer?.lastName || '',
      phone: customer?.phone || '',
      email: customer?.email || '',
      gender: customer?.gender as 'male' | 'female' | 'other' | undefined,
      dateOfBirth: customer?.dateOfBirth,
      loyaltyCardNumber: customer?.loyaltyCardNumber || '',
    },
  });

  const handleEditSubmit = (data: UpdateCustomerSchema) => {
    console.log('Update customer:', data);
    // TODO: API call to update customer
    setIsEditOpen(false);
  };

  const handleDelete = () => {
    console.log('Delete customer:', customerId);
    // TODO: API call to delete customer
    setIsDeleteOpen(false);
    router.push('/intranet/customers');
  };

  if (!customer) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => router.push('/intranet/customers')}
          className="bg-white hover:bg-neutral-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('pages.customerDetail.backToList')}
        </Button>
        <div className="rounded-2xl border bg-card p-8 text-center">
          <p className="text-lg text-muted-foreground">{t('pages.customerDetail.notFound')}</p>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU').format(date);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: t('paymentMethods.cash'),
      card: t('paymentMethods.card'),
      transfer: t('paymentMethods.transfer'),
      installment: t('paymentMethods.installment'),
    };
    return labels[method] || method;
  };

  const getGenderLabel = (gender: string) => {
    const labels: Record<string, string> = {
      male: t('pages.customers.gender.male'),
      female: t('pages.customers.gender.female'),
      other: t('pages.customers.gender.other'),
    };
    return labels[gender] || gender;
  };

  const totalPurchases = customer.receipts.reduce((sum, receipt) => sum + receipt.totalAmount, 0);
  const purchaseCount = customer.receipts.length;

  // Get unique stores from receipts for the new component
  const stores = Array.from(new Set(customer.receipts.map((r) => r.storeId))).map((storeId) => {
    const receipt = customer.receipts.find((r) => r.storeId === storeId);
    return { id: storeId, name: receipt?.storeName || storeId };
  });

  return (
    <div className="space-y-6">
      <Button
        variant="outline"
        onClick={() => router.push('/intranet/customers')}
        className="bg-white hover:bg-neutral-100"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('pages.customerDetail.backToList')}
      </Button>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('pages.customers.editCustomer')}</DialogTitle>
            <DialogDescription>{t('pages.customers.editDescription')}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pages.customers.fields.firstName')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} />
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
                      <Input {...field} />
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
                      <Input type="email" {...field} value={field.value || ''} />
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
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
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
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  {t('actions.cancel')}
                </Button>
                <Button type="submit">{t('actions.save')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pages.customerDetail.deleteCustomer')}</DialogTitle>
            <DialogDescription>
              {t('pages.customerDetail.deleteCustomerConfirm', {
                name: `${customer.firstName} ${customer.lastName}`,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Customer Info Card */}
        <div className="md:col-span-1">
          <div className="rounded-2xl border bg-card p-6 space-y-6">
            <div className="flex flex-col items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
                <User className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-center">
                {customer.firstName} {customer.lastName}
              </h2>
              {customer.loyaltyCardNumber && (
                <Badge variant="success" className="mt-2">
                  {customer.loyaltyCardNumber}
                </Badge>
              )}
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>

              {customer.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{getGenderLabel(customer.gender)}</span>
              </div>

              {customer.dateOfBirth && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span suppressHydrationWarning>{formatDate(customer.dateOfBirth)}</span>
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('pages.customerDetail.customerSince')}</span>
                <span className="text-sm font-medium" suppressHydrationWarning>{formatDate(customer.createdAt)}</span>
              </div>
            </div>

            <div className="border-t pt-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsEditOpen(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                {t('pages.customerDetail.editCustomer')}
              </Button>
              <Button
                variant="ghost"
                className="flex-1 bg-red-50 text-destructive hover:bg-red-100 hover:text-destructive"
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash className="mr-2 h-4 w-4" />
                {t('pages.customerDetail.deleteCustomer')}
              </Button>
            </div>
          </div>
        </div>

        {/* Purchase Stats and History */}
        <div className="md:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('pages.customerDetail.totalPurchases')}</p>
                  <p className="text-2xl font-bold">{purchaseCount}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('pages.customerDetail.totalAmount')}</p>
                  <p className="text-2xl font-bold" suppressHydrationWarning>{formatCurrency(totalPurchases)} {t('currency')}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Purchase History */}
          <CustomerPurchaseHistory customerId={customerId} stores={stores} />
        </div>
      </div>
    </div>
  );
}
