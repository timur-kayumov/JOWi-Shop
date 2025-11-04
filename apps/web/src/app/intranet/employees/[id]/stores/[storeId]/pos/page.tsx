'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Tablet } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@jowi/ui';
import '../../../../../../../lib/i18n';

export default function EmployeeStorePosAccessPage({
  params,
}: {
  params: Promise<{ id: string; storeId: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push(`/intranet/employees/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к сотруднику
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <Tablet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>POS доступ</CardTitle>
              <CardDescription>Настройка доступа к POS приложению</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-12 text-muted-foreground">
            Страница в разработке
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
