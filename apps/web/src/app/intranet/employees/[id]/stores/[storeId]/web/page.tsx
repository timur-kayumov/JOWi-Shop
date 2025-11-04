'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Save,
  Monitor,
  LayoutDashboard,
  Receipt,
  Package,
  Warehouse,
  FileText,
  BarChart,
  Plug,
  Settings,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Label,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jowi/ui';
import { useState } from 'react';
import '../../../../../../../lib/i18n';

// Mock data - in real app, fetch from API
const mockStores = [
  { id: '1', name: 'Магазин Центральный' },
  { id: '2', name: 'Магазин Чиланзар' },
  { id: '3', name: 'Магазин Юнусабад' },
  { id: '4', name: 'Магазин Сергели' },
];

const mockEmployee = {
  id: '1',
  firstName: 'Азиз',
  lastName: 'Каримов',
};

type UserRole = 'admin' | 'manager' | 'cashier' | 'warehouse';

const roleLabels: Record<UserRole, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  cashier: 'Кассир',
  warehouse: 'Складской работник',
};

// Module access types
type ModuleKey = 'dashboard' | 'orders' | 'products' | 'inventory' | 'documents' | 'reports' | 'integrations' | 'settings';
type AccessLevel = 'no_access' | 'view' | 'edit';

type ModulePermissions = Record<ModuleKey, AccessLevel>;

// Module definitions
interface ModuleDefinition {
  key: ModuleKey;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const modules: ModuleDefinition[] = [
  { key: 'dashboard', name: 'Панель управления', icon: LayoutDashboard },
  { key: 'orders', name: 'Чеки', icon: Receipt },
  { key: 'products', name: 'Управление товарами', icon: Package },
  { key: 'inventory', name: 'Склад', icon: Warehouse },
  { key: 'documents', name: 'Накладные', icon: FileText },
  { key: 'reports', name: 'Отчёты', icon: BarChart },
  { key: 'integrations', name: 'Интеграции', icon: Plug },
  { key: 'settings', name: 'Настройки', icon: Settings },
];

const accessLevelLabels: Record<AccessLevel, string> = {
  no_access: 'Нет доступа',
  view: 'Просмотр',
  edit: 'Редактирование',
};

// SegmentedControl component for access levels
interface SegmentedControlProps {
  value: AccessLevel;
  onChange: (value: AccessLevel) => void;
  disabled?: boolean;
}

function SegmentedControl({ value, onChange, disabled = false }: SegmentedControlProps) {
  const options: { value: AccessLevel; label: string }[] = [
    { value: 'no_access', label: 'Нет' },
    { value: 'view', label: 'Просмотр' },
    { value: 'edit', label: 'Редактирование' },
  ];

  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg">
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`
              flex-1 flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${isActive
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// Role permission presets
const rolePermissionPresets: Record<UserRole, ModulePermissions> = {
  admin: {
    dashboard: 'edit',
    orders: 'edit',
    products: 'edit',
    inventory: 'edit',
    documents: 'edit',
    reports: 'edit',
    integrations: 'edit',
    settings: 'edit',
  },
  manager: {
    dashboard: 'edit',
    orders: 'edit',
    products: 'edit',
    inventory: 'view',
    documents: 'view',
    reports: 'edit',
    integrations: 'view',
    settings: 'view',
  },
  cashier: {
    dashboard: 'view',
    orders: 'edit',
    products: 'view',
    inventory: 'no_access',
    documents: 'no_access',
    reports: 'no_access',
    integrations: 'no_access',
    settings: 'no_access',
  },
  warehouse: {
    dashboard: 'view',
    orders: 'no_access',
    products: 'view',
    inventory: 'edit',
    documents: 'edit',
    reports: 'view',
    integrations: 'no_access',
    settings: 'no_access',
  },
};

export default function EmployeeStoreWebAccessPage({
  params,
}: {
  params: Promise<{ id: string; storeId: string }>;
}) {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { id, storeId } = use(params);

  // In real app: fetch employee and store data
  const employee = mockEmployee;
  const store = mockStores.find((s) => s.id === storeId);

  const [webAccessEnabled, setWebAccessEnabled] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [modulePermissions, setModulePermissions] = useState<ModulePermissions>(
    rolePermissionPresets.admin
  );

  const handleRoleChange = (newRole: UserRole) => {
    setSelectedRole(newRole);
    // Apply permission preset for the selected role
    setModulePermissions(rolePermissionPresets[newRole]);
  };

  const handleModulePermissionChange = (moduleKey: ModuleKey, accessLevel: AccessLevel) => {
    setModulePermissions((prev) => ({
      ...prev,
      [moduleKey]: accessLevel,
    }));
  };

  const applyToAll = (accessLevel: AccessLevel) => {
    const allModules: ModulePermissions = {
      dashboard: accessLevel,
      orders: accessLevel,
      products: accessLevel,
      inventory: accessLevel,
      documents: accessLevel,
      reports: accessLevel,
      integrations: accessLevel,
      settings: accessLevel,
    };
    setModulePermissions(allModules);
  };

  const handleSave = () => {
    const accessData = {
      employeeId: id,
      storeId,
      webAccess: webAccessEnabled,
      role: selectedRole,
      modulePermissions,
    };
    console.log('Save WEB access:', accessData);
    // TODO: API call to save access settings
    router.push(`/intranet/employees/${id}`);
  };

  if (!store) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="bg-white hover:bg-neutral-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Магазин не найден</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push(`/intranet/employees/${id}`)}
          className="bg-white hover:bg-neutral-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к сотруднику
        </Button>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Сохранить
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Info Card */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <Monitor className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">WEB доступ</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Настройка доступа к веб-панели администратора
                </p>
              </div>

              <div className="mt-6 pt-6 border-t space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Сотрудник</p>
                  <p className="font-medium">
                    {employee.firstName} {employee.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Магазин</p>
                  <p className="font-medium">{store.name}</p>
                </div>
                <div>
                  <Label htmlFor="role-select" className="text-sm text-muted-foreground">
                    Роль в магазине
                  </Label>
                  <Select value={selectedRole} onValueChange={(value) => handleRoleChange(value as UserRole)}>
                    <SelectTrigger id="role-select" className="w-full mt-1">
                      <SelectValue placeholder="Выберите роль" />
                    </SelectTrigger>
                    <SelectContent>
                      {(['admin', 'manager', 'cashier', 'warehouse'] as UserRole[]).map((role) => (
                        <SelectItem key={role} value={role}>
                          {roleLabels[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Settings */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Настройки WEB доступа</CardTitle>
              <CardDescription>
                Управление ролями и правами доступа сотрудника к веб-панели администратора для этого
                магазина
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Access Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label htmlFor="web-access-toggle" className="text-base font-medium cursor-pointer">
                    Доступ к веб-панели
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Включить или отключить доступ к веб-панели администратора
                  </p>
                </div>
                <Switch
                  id="web-access-toggle"
                  checked={webAccessEnabled}
                  onCheckedChange={setWebAccessEnabled}
                />
              </div>

              {/* Module Permissions */}
              <div className="space-y-4">
                <div className="border-t pt-4">
                  {/* Quick Action Buttons */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!webAccessEnabled}
                      onClick={() => applyToAll('edit')}
                    >
                      Редактировать всё
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!webAccessEnabled}
                      onClick={() => applyToAll('view')}
                    >
                      Просматривать всё
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!webAccessEnabled}
                      onClick={() => applyToAll('no_access')}
                    >
                      Отключить всё
                    </Button>
                  </div>

                  {/* Module Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modules.map((module) => {
                      const Icon = module.icon;
                      return (
                        <div
                          key={module.key}
                          className={`border rounded-lg p-4 space-y-3 transition-opacity ${
                            !webAccessEnabled ? 'opacity-50 pointer-events-none' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-primary/10 p-2">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{module.name}</h4>
                            </div>
                          </div>
                          <SegmentedControl
                            value={modulePermissions[module.key]}
                            onChange={(value) => handleModulePermissionChange(module.key, value)}
                            disabled={!webAccessEnabled}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
