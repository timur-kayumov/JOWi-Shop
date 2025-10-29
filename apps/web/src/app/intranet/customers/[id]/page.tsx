'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Mail, Phone, Calendar, CreditCard, ShoppingBag, User } from 'lucide-react';
import { Button, Badge } from '@jowi/ui';
import '../../../../lib/i18n'; // Ensure i18n is initialized

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

  if (!customer) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/intranet/customers')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('pages.customerDetail.backToList')}
        </Button>
        <div className="rounded-lg border bg-card p-8 text-center">
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

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push('/intranet/customers')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('pages.customerDetail.backToList')}
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Customer Info Card */}
        <div className="md:col-span-1">
          <div className="rounded-lg border bg-card p-6 space-y-6">
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
                  <span>{formatDate(customer.dateOfBirth)}</span>
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('pages.customerDetail.customerSince')}</span>
                <span className="text-sm font-medium">{formatDate(customer.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Stats and History */}
        <div className="md:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-card p-6">
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

            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('pages.customerDetail.totalAmount')}</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalPurchases)} {t('currency.uzs')}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Purchase History */}
          <div className="rounded-lg border bg-card">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">{t('pages.customerDetail.purchaseHistory')}</h3>
            </div>

            <div className="divide-y">
              {customer.receipts.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {t('pages.customerDetail.noPurchaseHistory')}
                </div>
              ) : (
                customer.receipts.map((receipt) => (
                  <div key={receipt.id} className="p-6 hover:bg-muted/50">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-semibold">{t('pages.customerDetail.receipt')} #{receipt.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(receipt.createdAt)}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {getPaymentMethodLabel(receipt.payments[0]?.method)}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      {receipt.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.name} × {item.quantity}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(item.price * item.quantity)} {t('currency.uzs')}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="font-semibold">{t('pages.customerDetail.total')}</span>
                      <span className="text-lg font-bold">
                        {formatCurrency(receipt.totalAmount)} {t('currency.uzs')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
