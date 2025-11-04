'use client';

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@jowi/ui';

export default function StoreIntegrationsPage() {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('storeNavigation.integrations')}</h1>
        <p className="text-muted-foreground mt-2">
          Управление интеграциями и подключениями к внешним сервисам
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Интеграции</CardTitle>
          <CardDescription>
            Здесь будет список доступных интеграций для магазина
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            Раздел в разработке
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
