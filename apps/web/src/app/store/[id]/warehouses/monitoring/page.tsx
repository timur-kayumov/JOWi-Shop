'use client';

import { useTranslation } from 'react-i18next';

export default function WarehouseMonitoringPage() {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('storeNavigation.warehouseMonitoring')}
        </h1>
        <p className="text-muted-foreground mt-2">
          Мониторинг складских операций и остатков в режиме реального времени
        </p>
      </div>

      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Страница мониторинга складов в разработке
        </p>
      </div>
    </div>
  );
}
