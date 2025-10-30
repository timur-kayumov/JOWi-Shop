'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button, Card } from '@jowi/ui';

export default function NomenclatureProductPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation('common');
  const storeId = params.id as string;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/store/${storeId}/products/new`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('pages.products.addFromNomenclature')}
          </h1>
          <p className="text-muted-foreground">
            {t('pages.products.fromNomenclatureDescription')}
          </p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <Card className="p-12 max-w-2xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-yellow-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">
              {t('pages.products.nomenclatureComingSoon')}
            </h2>
            <p className="text-muted-foreground max-w-md">
              {t('pages.products.nomenclatureDescription')}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/store/${storeId}/products/new`)}
            >
              {t('pages.products.backToChoice')}
            </Button>
            <Button onClick={() => router.push(`/store/${storeId}/products/new/manual`)}>
              {t('pages.products.addManually')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
