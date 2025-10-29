'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, Mail, Phone, MapPin, Briefcase } from 'lucide-react';
import '../../../../lib/i18n'; // Ensure i18n is initialized
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jowi/ui';

// Типы прав доступа
type PermissionLevel = 'none' | 'read' | 'edit';

type StorePermissions = {
  pos: PermissionLevel;
  warehouse: PermissionLevel;
  products: PermissionLevel;
  storeReports: PermissionLevel;
};

type IntranetPermissions = {
  stores: PermissionLevel;
  employees: PermissionLevel;
  customers: PermissionLevel;
  reports: PermissionLevel;
  // Будущие страницы
  productsManagement: PermissionLevel;
  warehouseManagement: PermissionLevel;
  finance: PermissionLevel;
};

// Mock данные сотрудников
const mockEmployees = [
  {
    id: '1',
    firstName: 'Азиз',
    lastName: 'Каримов',
    email: 'aziz.karimov@jowi.uz',
    phone: '+998901234567',
    role: 'administrator',
    storeId: '1',
    storeName: 'Магазин Центральный',
    isActive: true,
    storePermissions: {
      pos: 'edit' as PermissionLevel,
      warehouse: 'edit' as PermissionLevel,
      products: 'edit' as PermissionLevel,
      storeReports: 'read' as PermissionLevel,
    },
    intranetPermissions: {
      stores: 'edit' as PermissionLevel,
      employees: 'edit' as PermissionLevel,
      customers: 'edit' as PermissionLevel,
      reports: 'edit' as PermissionLevel,
      productsManagement: 'edit' as PermissionLevel,
      warehouseManagement: 'edit' as PermissionLevel,
      finance: 'edit' as PermissionLevel,
    },
  },
  {
    id: '2',
    firstName: 'Диана',
    lastName: 'Ахмедова',
    email: 'diana.ahmed@jowi.uz',
    phone: '+998907654321',
    role: 'manager',
    storeId: '1',
    storeName: 'Магазин Центральный',
    isActive: true,
    storePermissions: {
      pos: 'edit' as PermissionLevel,
      warehouse: 'read' as PermissionLevel,
      products: 'edit' as PermissionLevel,
      storeReports: 'read' as PermissionLevel,
    },
    intranetPermissions: {
      stores: 'read' as PermissionLevel,
      employees: 'read' as PermissionLevel,
      customers: 'edit' as PermissionLevel,
      reports: 'read' as PermissionLevel,
      productsManagement: 'none' as PermissionLevel,
      warehouseManagement: 'none' as PermissionLevel,
      finance: 'none' as PermissionLevel,
    },
  },
  {
    id: '3',
    firstName: 'Шахзод',
    lastName: 'Усманов',
    email: 'shahzod.usmanov@jowi.uz',
    phone: '+998905555555',
    role: 'cashier',
    storeId: '2',
    storeName: 'Магазин Чиланзар',
    isActive: true,
    storePermissions: {
      pos: 'edit' as PermissionLevel,
      warehouse: 'none' as PermissionLevel,
      products: 'read' as PermissionLevel,
      storeReports: 'none' as PermissionLevel,
    },
    intranetPermissions: {
      stores: 'none' as PermissionLevel,
      employees: 'none' as PermissionLevel,
      customers: 'read' as PermissionLevel,
      reports: 'none' as PermissionLevel,
      productsManagement: 'none' as PermissionLevel,
      warehouseManagement: 'none' as PermissionLevel,
      finance: 'none' as PermissionLevel,
    },
  },
  {
    id: '4',
    firstName: 'Нодира',
    lastName: 'Рахимова',
    email: 'nodira.rahimova@jowi.uz',
    phone: '+998903333333',
    role: 'warehouse',
    storeId: '3',
    storeName: 'Магазин Юнусабад',
    isActive: false,
    storePermissions: {
      pos: 'none' as PermissionLevel,
      warehouse: 'edit' as PermissionLevel,
      products: 'read' as PermissionLevel,
      storeReports: 'none' as PermissionLevel,
    },
    intranetPermissions: {
      stores: 'none' as PermissionLevel,
      employees: 'none' as PermissionLevel,
      customers: 'none' as PermissionLevel,
      reports: 'none' as PermissionLevel,
      productsManagement: 'none' as PermissionLevel,
      warehouseManagement: 'read' as PermissionLevel,
      finance: 'none' as PermissionLevel,
    },
  },
];

const roleLabels: Record<string, string> = {
  administrator: 'Администратор',
  manager: 'Менеджер',
  cashier: 'Кассир',
  warehouse: 'Складской работник',
};

const getPermissionLabels = (t: any): Record<PermissionLevel, string> => ({
  none: t('pages.employeeDetail.accessLevels.none'),
  read: t('pages.employeeDetail.accessLevels.read'),
  edit: t('pages.employeeDetail.accessLevels.edit'),
});

const getStorePageLabels = (t: any): Record<keyof StorePermissions, string> => ({
  pos: t('pages.employeeDetail.permissions.pos'),
  warehouse: t('pages.employeeDetail.permissions.warehouse'),
  products: t('pages.employeeDetail.permissions.products'),
  storeReports: t('pages.employeeDetail.permissions.storeReports'),
});

const getIntranetPageLabels = (t: any): Record<keyof IntranetPermissions, string> => ({
  stores: t('pages.employeeDetail.permissions.stores'),
  employees: t('pages.employeeDetail.permissions.employees'),
  customers: t('pages.employeeDetail.permissions.customers'),
  reports: t('pages.employeeDetail.permissions.reports'),
  productsManagement: t('pages.employeeDetail.permissions.productManagement'),
  warehouseManagement: t('pages.employeeDetail.permissions.warehouseManagement'),
  finance: t('pages.employeeDetail.permissions.finance'),
});

interface PermissionRowProps {
  label: string;
  value: PermissionLevel;
  onChange: (value: PermissionLevel) => void;
  t: any;
}

function PermissionRow({ label, value, onChange, t }: PermissionRowProps) {
  const permissionLabels = getPermissionLabels(t);
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b last:border-b-0 hover:bg-muted/50">
      <span className="font-medium">{label}</span>
      <Select value={value} onValueChange={(v) => onChange(v as PermissionLevel)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-muted-foreground">{permissionLabels.none}</span>
          </SelectItem>
          <SelectItem value="read">
            <span className="text-primary">{permissionLabels.read}</span>
          </SelectItem>
          <SelectItem value="edit">
            <span className="text-success">{permissionLabels.edit}</span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { id } = use(params);
  const employee = mockEmployees.find((e) => e.id === id);

  const [storePermissions, setStorePermissions] = useState<StorePermissions>(
    employee?.storePermissions || {
      pos: 'none',
      warehouse: 'none',
      products: 'none',
      storeReports: 'none',
    }
  );

  const [intranetPermissions, setIntranetPermissions] = useState<IntranetPermissions>(
    employee?.intranetPermissions || {
      stores: 'none',
      employees: 'none',
      customers: 'none',
      reports: 'none',
      productsManagement: 'none',
      warehouseManagement: 'none',
      finance: 'none',
    }
  );

  if (!employee) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('pages.employeeDetail.back')}
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('pages.employeeDetail.notFound')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStorePermissionChange = (key: keyof StorePermissions, value: PermissionLevel) => {
    setStorePermissions((prev) => ({ ...prev, [key]: value }));
  };

  const handleIntranetPermissionChange = (key: keyof IntranetPermissions, value: PermissionLevel) => {
    setIntranetPermissions((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // TODO: Сохранение прав доступа на бэкенд
    alert('Права доступа сохранены!');
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопки */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('pages.employeeDetail.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="text-muted-foreground mt-1">{roleLabels[employee.role]}</p>
          </div>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          {t('pages.employeeDetail.saveChanges')}
        </Button>
      </div>

      {/* Информация о сотруднике */}
      <Card>
        <CardHeader>
          <CardTitle>{t('pages.employeeDetail.information')}</CardTitle>
          <CardDescription>{t('pages.employeeDetail.basicInfo')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('pages.employees.fields.email')}</p>
                  <p className="font-medium">{employee.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('pages.employees.fields.phone')}</p>
                  <p className="font-medium">{employee.phone}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('pages.employees.fields.store')}</p>
                  <p className="font-medium">{employee.storeName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('fields.status')}</p>
                  <Badge variant={employee.isActive ? 'success' : 'outline'}>
                    {employee.isActive ? t('status.active') : t('status.inactive')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Права доступа к страницам магазина */}
        <Card>
          <CardHeader>
            <CardTitle>{t('pages.employeeDetail.storeAccess')}</CardTitle>
            <CardDescription>{t('pages.employeeDetail.storeAccessDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {(Object.keys(getStorePageLabels(t)) as Array<keyof StorePermissions>).map((key) => (
                <PermissionRow
                  key={key}
                  label={getStorePageLabels(t)[key]}
                  value={storePermissions[key]}
                  onChange={(value) => handleStorePermissionChange(key, value)}
                  t={t}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Права доступа к интранету */}
        <Card>
          <CardHeader>
            <CardTitle>{t('pages.employeeDetail.intranetAccess')}</CardTitle>
            <CardDescription>{t('pages.employeeDetail.intranetAccessDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {(Object.keys(getIntranetPageLabels(t)) as Array<keyof IntranetPermissions>).map((key) => (
                <PermissionRow
                  key={key}
                  label={getIntranetPageLabels(t)[key]}
                  value={intranetPermissions[key]}
                  onChange={(value) => handleIntranetPermissionChange(key, value)}
                  t={t}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Информация о правах */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <p className="font-medium">{t('pages.employeeDetail.accessLevelInfo', { defaultValue: 'Информация о правах доступа:' })}</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><span className="font-medium text-foreground">{t('pages.employeeDetail.accessLevels.none')}</span> - {t('pages.employeeDetail.accessLevelDescriptions.none', { defaultValue: 'сотрудник не видит эту страницу' })}</li>
              <li><span className="font-medium text-primary">{t('pages.employeeDetail.accessLevels.read')}</span> - {t('pages.employeeDetail.accessLevelDescriptions.read', { defaultValue: 'сотрудник может просматривать данные, но не может их изменять' })}</li>
              <li><span className="font-medium text-success">{t('pages.employeeDetail.accessLevels.edit')}</span> - {t('pages.employeeDetail.accessLevelDescriptions.edit', { defaultValue: 'сотрудник может просматривать и изменять данные (включает право на чтение)' })}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
