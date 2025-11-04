'use client';

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@jowi/ui';

export default function SubscriptionPage() {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('navigation.subscription')}</h1>
        <p className="text-muted-foreground mt-2">
          Управление подпиской и тарифными планами
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Подписка</CardTitle>
          <CardDescription>
            Здесь будет информация о вашей подписке и доступных тарифах
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
