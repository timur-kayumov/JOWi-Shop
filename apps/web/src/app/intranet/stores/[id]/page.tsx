'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MapPin, Phone, Clock, Globe, Building } from 'lucide-react';
import { Button, Badge } from '@jowi/ui';
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

  const store = mockStoreData[storeId as keyof typeof mockStoreData];

  if (!store) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/intranet/stores')}>
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
      <Button variant="ghost" onClick={() => router.push('/intranet/stores')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('pages.storeDetail.backToList')}
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Store Info Card */}
        <div className="md:col-span-1">
          <div className="rounded-lg border bg-card p-6 space-y-6">
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
          </div>
        </div>

        {/* Stats and Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-card p-6">
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

            <div className="rounded-lg border bg-card p-6">
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

            <div className="rounded-lg border bg-card p-6">
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

            <div className="rounded-lg border bg-card p-6">
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

          {/* Additional Info */}
          <div className="rounded-lg border bg-card">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">{t('pages.storeDetail.additionalInfo')}</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm text-muted-foreground">{t('pages.storeDetail.storeId')}</span>
                <span className="text-sm font-medium font-mono">{store.id}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm text-muted-foreground">{t('fields.status')}</span>
                <Badge variant={store.isActive ? 'success' : 'outline'}>
                  {store.isActive ? t('status.active') : t('status.inactive')}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm text-muted-foreground">{t('pages.storeDetail.shiftTransitionTime')}</span>
                <span className="text-sm font-medium">{store.shiftTransitionTime}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm text-muted-foreground">{t('pages.storeDetail.city')}</span>
                <span className="text-sm font-medium">{store.city}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm text-muted-foreground">{t('pages.storeDetail.country')}</span>
                <span className="text-sm font-medium">{store.country}</span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground">{t('pages.storeDetail.createdAt')}</span>
                <span className="text-sm font-medium">{formatDate(store.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg border bg-card">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">{t('pages.storeDetail.quickActions')}</h3>
            </div>

            <div className="p-6 grid gap-3 md:grid-cols-2">
              <Button variant="outline" className="justify-start">
                {t('pages.storeDetail.viewEmployees')}
              </Button>
              <Button variant="outline" className="justify-start">
                {t('pages.storeDetail.viewTerminals')}
              </Button>
              <Button variant="outline" className="justify-start">
                {t('pages.storeDetail.salesReports')}
              </Button>
              <Button variant="outline" className="justify-start">
                {t('pages.storeDetail.manageSettings')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
