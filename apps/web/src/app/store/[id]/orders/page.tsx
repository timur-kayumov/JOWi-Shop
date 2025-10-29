'use client';

import { useTranslation } from 'react-i18next';

export default function StoreOrdersPage() {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('storePages.orders.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('storePages.orders.description')}
        </p>
      </div>
    </div>
  );
}
