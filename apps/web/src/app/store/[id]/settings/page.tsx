'use client';

import { useTranslation } from 'react-i18next';

export default function StoreSettingsPage() {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('storePages.settings.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('storePages.settings.description')}
        </p>
      </div>
    </div>
  );
}
