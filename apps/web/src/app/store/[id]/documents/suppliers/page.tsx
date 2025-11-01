'use client';

import { useTranslation } from 'react-i18next';

export default function SuppliersPage() {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('storeNavigation.suppliers')}
        </h1>
        <p className="text-muted-foreground mt-2">
          Управление поставщиками и их контактными данными
        </p>
      </div>

      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Страница поставщиков в разработке
        </p>
      </div>
    </div>
  );
}
