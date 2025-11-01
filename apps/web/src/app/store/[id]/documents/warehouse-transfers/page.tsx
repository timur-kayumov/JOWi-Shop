'use client';

import { useTranslation } from 'react-i18next';

export default function WarehouseTransfersPage() {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('storeNavigation.warehouseTransfers')}
        </h1>
        <p className="text-muted-foreground mt-2">
          Управление перемещениями товаров между складами
        </p>
      </div>

      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Страница перемещений между складами в разработке
        </p>
      </div>
    </div>
  );
}
