'use client';

import { useTranslation } from 'react-i18next';

export default function CategoriesPage() {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('storeNavigation.categories')}
        </h1>
        <p className="text-muted-foreground mt-2">
          Управление категориями товаров
        </p>
      </div>

      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Страница категорий в разработке
        </p>
      </div>
    </div>
  );
}
