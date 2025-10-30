'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileText, PenTool } from 'lucide-react';
import { Button, Card } from '@jowi/ui';

export default function NewProductChoicePage() {
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
          onClick={() => router.push(`/store/${storeId}/products`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('pages.products.newProduct')}
          </h1>
          <p className="text-muted-foreground">
            {t('pages.products.chooseAddType')}
          </p>
        </div>
      </div>

      {/* Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* From Nomenclature */}
        <Card
          className="p-8 hover:bg-muted/50 transition-colors cursor-pointer group"
          onClick={() => router.push(`/store/${storeId}/products/new/nomenclature`)}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {t('pages.products.addFromNomenclature')}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t('pages.products.fromNomenclatureDescription')}
              </p>
            </div>
            <Button variant="outline" className="w-full mt-4">
              {t('actions.next')}
            </Button>
          </div>
        </Card>

        {/* Manual Entry */}
        <Card
          className="p-8 hover:bg-muted/50 transition-colors cursor-pointer group"
          onClick={() => router.push(`/store/${storeId}/products/new/manual`)}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <PenTool className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {t('pages.products.addManually')}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t('pages.products.manuallyDescription')}
              </p>
            </div>
            <Button className="w-full mt-4">{t('actions.next')}</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
