'use client';

import { useTranslation } from 'react-i18next';

export default function AccrualsPage() {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('finance.accruals.title')}</h1>
        <p className="text-muted-foreground">
          {t('finance.accruals.description')}
        </p>
      </div>

      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          {t('finance.accruals.pageInDevelopment')}
        </p>
      </div>
    </div>
  );
}
