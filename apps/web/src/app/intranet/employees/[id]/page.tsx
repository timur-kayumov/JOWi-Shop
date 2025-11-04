'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Mail,
  Phone,
  User,
  Save,
  ChevronRight,
  Check,
  X,
  Monitor,
  Tablet,
} from 'lucide-react';
import '../../../../lib/i18n';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Avatar,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Checkbox,
  DataTable,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jowi/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { updateEmployeeBasicInfoSchema, type UpdateEmployeeBasicInfoSchema } from '@jowi/validators';

// Mock data
const mockEmployee = {
  id: '1',
  firstName: 'Азиз',
  lastName: 'Каримов',
  email: 'aziz.karimov@jowi.uz',
  phone: '+998901234567',
  citizenship: 'Узбекистан',
  passportSeries: 'AB',
  passportNumber: '1234567',
  isActive: true,
  createdAt: '2024-01-15',
  updatedAt: '2024-11-04',
};

const mockStores = [
  {
    id: '1',
    name: 'Магазин Центральный',
    roles: { admin: true, manager: false, cashier: false, warehouse: false },
    webAccess: true,
    posAccess: true
  },
  {
    id: '2',
    name: 'Магазин Чиланзар',
    roles: { admin: false, manager: true, cashier: false, warehouse: false },
    webAccess: true,
    posAccess: false
  },
  {
    id: '3',
    name: 'Магазин Юнусабад',
    roles: { admin: false, manager: false, cashier: false, warehouse: false },
    webAccess: false,
    posAccess: false
  },
  {
    id: '4',
    name: 'Магазин Сергели',
    roles: { admin: false, manager: false, cashier: false, warehouse: false },
    webAccess: false,
    posAccess: true
  },
];

// Access level types
type AccessLevel = 'none' | 'view' | 'edit';

// Initial permission levels (new model)
const mockPermissionLevels = {
  stores: 'view' as AccessLevel,
  employees: 'edit' as AccessLevel,
  customers: 'edit' as AccessLevel,
  reports: 'view' as AccessLevel,
  subscription: 'view' as AccessLevel,
};

// Reports sub-permissions (kept as checkboxes)
const mockReportTypes = {
  sales: true,
  products: false,
  employees: false,
  inventory: false,
};

// Helper: Convert access level to boolean permissions for backend
const accessLevelToPermissions = (level: AccessLevel) => {
  switch (level) {
    case 'none':
      return { view: false, create: false, edit: false, delete: false };
    case 'view':
      return { view: true, create: false, edit: false, delete: false };
    case 'edit':
      return { view: true, create: true, edit: true, delete: true };
  }
};

// Helper: Infer access level from boolean permissions (for loading existing data)
const permissionsToAccessLevel = (permissions: { view: boolean; create: boolean; edit: boolean; delete: boolean }): AccessLevel => {
  if (!permissions.view) return 'none';
  if (permissions.edit || permissions.create || permissions.delete) return 'edit';
  return 'view';
};

type UserRole = 'admin' | 'manager' | 'cashier' | 'warehouse';

const roleLabels: Record<UserRole, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  cashier: 'Кассир',
  warehouse: 'Складской работник',
};

const roleBadgeVariant: Record<UserRole, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  manager: 'secondary',
  cashier: 'outline',
  warehouse: 'outline',
};

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { id } = use(params);
  const employee = mockEmployee; // In real app: fetch by ID

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [permissionLevels, setPermissionLevels] = useState(mockPermissionLevels);
  const [reportTypes, setReportTypes] = useState(mockReportTypes);
  const [storeRoles, setStoreRoles] = useState(mockStores);

  // Store access dialogs
  const [selectedStore, setSelectedStore] = useState<typeof mockStores[0] | null>(null);
  const [isAccessTypeDialogOpen, setIsAccessTypeDialogOpen] = useState(false);

  const form = useForm<UpdateEmployeeBasicInfoSchema>({
    resolver: zodResolver(updateEmployeeBasicInfoSchema),
    defaultValues: {
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      citizenship: employee.citizenship,
      passportSeries: employee.passportSeries,
      passportNumber: employee.passportNumber,
      isActive: employee.isActive,
    },
  });

  const handleEditSubmit = (data: UpdateEmployeeBasicInfoSchema) => {
    console.log('Update employee:', data);
    // TODO: API call to update employee
    setIsEditOpen(false);
  };

  const handleDelete = () => {
    console.log('Delete employee:', id);
    // TODO: API call to delete employee
    setIsDeleteOpen(false);
    router.push('/intranet/employees');
  };

  const handleSaveIntranetPermissions = () => {
    // Convert levels to backend format
    const backendPermissions = {
      stores: accessLevelToPermissions(permissionLevels.stores),
      employees: {
        ...accessLevelToPermissions(permissionLevels.employees),
        editPermissions: permissionLevels.employees === 'edit', // Auto-enable for full access
      },
      customers: accessLevelToPermissions(permissionLevels.customers),
      reports: {
        view: permissionLevels.reports !== 'none',
        sales: reportTypes.sales,
        products: reportTypes.products,
        employees: reportTypes.employees,
        inventory: reportTypes.inventory,
      },
      subscription: {
        view: permissionLevels.subscription !== 'none',
        manage: permissionLevels.subscription === 'edit', // "edit" level = "manage"
      },
    };

    console.log('Save intranet permissions:', backendPermissions);
    // TODO: API call to save permissions
    alert('Права доступа сохранены!');
  };

  const handleStoreRoleChange = (storeId: string, role: UserRole, checked: boolean) => {
    setStoreRoles((prev) =>
      prev.map((store) =>
        store.id === storeId
          ? { ...store, roles: { ...store.roles, [role]: checked } }
          : store
      )
    );
  };

  const handleStoreRowClick = (store: typeof mockStores[0]) => {
    setSelectedStore(store);
    setIsAccessTypeDialogOpen(true);
  };

  const handleOpenWebAccessDialog = () => {
    if (selectedStore) {
      router.push(`/intranet/employees/${id}/stores/${selectedStore.id}/web`);
    }
  };

  const handleOpenPosAccessDialog = () => {
    if (selectedStore) {
      router.push(`/intranet/employees/${id}/stores/${selectedStore.id}/pos`);
    }
  };


  // Helper function to get primary role
  const getPrimaryRole = (roles: { admin: boolean; manager: boolean; cashier: boolean; warehouse: boolean }): string => {
    if (roles.admin) return 'Администратор';
    if (roles.manager) return 'Менеджер';
    if (roles.cashier) return 'Кассир';
    if (roles.warehouse) return 'Складской работник';
    return '—';
  };

  const storeColumns = [
    {
      key: 'name',
      label: 'Название магазина',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{item.name}</span>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Роль в магазине',
      render: (item: any) => (
        <span className="text-sm">{getPrimaryRole(item.roles)}</span>
      ),
    },
    {
      key: 'webAccess',
      label: 'Доступ в Web',
      render: (item: any) => (
        <div className="flex items-center">
          {item.webAccess ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <X className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      key: 'posAccess',
      label: 'Доступ в POS',
      render: (item: any) => (
        <div className="flex items-center">
          {item.posAccess ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <X className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      ),
    },
  ];

  if (!employee) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/intranet/employees')}>
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

  const initials = `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push('/intranet/employees')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('pages.employeeDetail.back')}
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('pages.employeeDetail.editEmployee')}</DialogTitle>
            <DialogDescription>{t('pages.employeeDetail.editEmployeeDescription')}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pages.employees.fields.firstName')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pages.employees.fields.lastName')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.employees.fields.email')}</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.employees.fields.phone')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="citizenship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.employees.fields.citizenship')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="passportSeries"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Серия паспорта</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="passportNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Номер паспорта</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  {t('actions.cancel')}
                </Button>
                <Button type="submit">{t('actions.save')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pages.employeeDetail.deleteEmployee')}</DialogTitle>
            <DialogDescription>
              {t('pages.employeeDetail.deleteConfirmation', { name: `${employee.firstName} ${employee.lastName}` })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Type Selection Dialog */}
      <Dialog open={isAccessTypeDialogOpen} onOpenChange={setIsAccessTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать доступ</DialogTitle>
            <DialogDescription>
              Выберите, какой тип доступа вы хотите редактировать для магазина "{selectedStore?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Card
              className="p-6 cursor-pointer hover:border-primary transition-colors"
              onClick={handleOpenWebAccessDialog}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="rounded-full bg-primary/10 p-4">
                  <Monitor className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">WEB доступ</h3>
                  <p className="text-sm text-muted-foreground">
                    Настроить доступ к веб-панели
                  </p>
                </div>
              </div>
            </Card>
            <Card
              className="p-6 cursor-pointer hover:border-primary transition-colors"
              onClick={handleOpenPosAccessDialog}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="rounded-full bg-primary/10 p-4">
                  <Tablet className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">POS доступ</h3>
                  <p className="text-sm text-muted-foreground">
                    Настроить доступ к POS приложению
                  </p>
                </div>
              </div>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAccessTypeDialogOpen(false)}>
              Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Employee Info Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar
                  className="h-20 w-20 mb-4 text-lg"
                  fallback={initials}
                  size="lg"
                />
                <h2 className="text-xl font-bold">
                  {employee.firstName} {employee.lastName}
                </h2>
                <Badge variant={employee.isActive ? 'success' : 'outline'} className="mt-2">
                  {employee.isActive ? t('status.active') : t('status.inactive')}
                </Badge>
              </div>

              <div className="mt-6 pt-6 border-t space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">{t('pages.employees.fields.email')}</p>
                    <p className="font-medium truncate">{employee.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{t('pages.employees.fields.phone')}</p>
                    <p className="font-medium">{employee.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{t('pages.employees.fields.citizenship')}</p>
                    <p className="font-medium">{employee.citizenship}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Паспорт</p>
                    <p className="font-medium">{employee.passportSeries} {employee.passportNumber}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>{t('fields.createdAt')}:</span>
                  <span>{new Date(employee.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('fields.updatedAt')}:</span>
                  <span>{new Date(employee.updatedAt).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-6 border-t flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsEditOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t('actions.edit')}
                </Button>
                <Button variant="ghost" className="flex-1 bg-red-50 text-destructive hover:bg-red-100 hover:text-destructive" onClick={() => setIsDeleteOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('actions.delete')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Intranet Access Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.employeeDetail.intranetAccess')}</CardTitle>
              <CardDescription>{t('pages.employeeDetail.intranetAccessDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stores Module */}
              <div className="flex items-center justify-between gap-4">
                <Label className="font-medium">{t('pages.employeeDetail.modules.stores')}</Label>
                <Select
                  value={permissionLevels.stores}
                  onValueChange={(value: AccessLevel) =>
                    setPermissionLevels((prev) => ({ ...prev, stores: value }))
                  }
                >
                  <SelectTrigger className="w-[260px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('permissions.noAccess')}</SelectItem>
                    <SelectItem value="view">{t('permissions.viewOnly')}</SelectItem>
                    <SelectItem value="edit">{t('permissions.fullAccess')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Employees Module */}
              <div className="flex items-center justify-between gap-4">
                <Label className="font-medium">{t('pages.employeeDetail.modules.employees')}</Label>
                <Select
                  value={permissionLevels.employees}
                  onValueChange={(value: AccessLevel) =>
                    setPermissionLevels((prev) => ({ ...prev, employees: value }))
                  }
                >
                  <SelectTrigger className="w-[260px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('permissions.noAccess')}</SelectItem>
                    <SelectItem value="view">{t('permissions.viewOnly')}</SelectItem>
                    <SelectItem value="edit">{t('permissions.fullAccess')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Customers Module */}
              <div className="flex items-center justify-between gap-4">
                <Label className="font-medium">{t('pages.employeeDetail.modules.customers')}</Label>
                <Select
                  value={permissionLevels.customers}
                  onValueChange={(value: AccessLevel) =>
                    setPermissionLevels((prev) => ({ ...prev, customers: value }))
                  }
                >
                  <SelectTrigger className="w-[260px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('permissions.noAccess')}</SelectItem>
                    <SelectItem value="view">{t('permissions.viewOnly')}</SelectItem>
                    <SelectItem value="edit">{t('permissions.fullAccess')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reports Module - Two-level system */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <Label className="font-medium pt-2">{t('pages.employeeDetail.modules.reports')}</Label>
                  <div className="flex flex-col gap-2 w-[260px]">
                    <Select
                      value={permissionLevels.reports}
                      onValueChange={(value: AccessLevel) =>
                        setPermissionLevels((prev) => ({ ...prev, reports: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('permissions.noAccess')}</SelectItem>
                        <SelectItem value="view">{t('permissions.viewOnly')}</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Report types - only shown if reports access is enabled */}
                    {permissionLevels.reports !== 'none' && (
                      <>
                        <Label
                          htmlFor="reports-sales"
                          className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                        >
                          <Checkbox
                            id="reports-sales"
                            checked={reportTypes.sales}
                            onCheckedChange={(checked) =>
                              setReportTypes((prev) => ({ ...prev, sales: checked as boolean }))
                            }
                          />
                          <span className="text-sm flex-1">
                            {t('permissions.salesReports')}
                          </span>
                        </Label>
                        <Label
                          htmlFor="reports-products"
                          className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                        >
                          <Checkbox
                            id="reports-products"
                            checked={reportTypes.products}
                            onCheckedChange={(checked) =>
                              setReportTypes((prev) => ({ ...prev, products: checked as boolean }))
                            }
                          />
                          <span className="text-sm flex-1">
                            {t('permissions.productReports')}
                          </span>
                        </Label>
                        <Label
                          htmlFor="reports-employees"
                          className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                        >
                          <Checkbox
                            id="reports-employees"
                            checked={reportTypes.employees}
                            onCheckedChange={(checked) =>
                              setReportTypes((prev) => ({ ...prev, employees: checked as boolean }))
                            }
                          />
                          <span className="text-sm flex-1">
                            {t('permissions.employeeReports')}
                          </span>
                        </Label>
                        <Label
                          htmlFor="reports-inventory"
                          className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                        >
                          <Checkbox
                            id="reports-inventory"
                            checked={reportTypes.inventory}
                            onCheckedChange={(checked) =>
                              setReportTypes((prev) => ({ ...prev, inventory: checked as boolean }))
                            }
                          />
                          <span className="text-sm flex-1">
                            {t('permissions.inventoryReports')}
                          </span>
                        </Label>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Subscription Module */}
              <div className="flex items-center justify-between gap-4">
                <Label className="font-medium">{t('pages.employeeDetail.modules.subscription')}</Label>
                <Select
                  value={permissionLevels.subscription}
                  onValueChange={(value: AccessLevel) =>
                    setPermissionLevels((prev) => ({ ...prev, subscription: value }))
                  }
                >
                  <SelectTrigger className="w-[260px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('permissions.noAccess')}</SelectItem>
                    <SelectItem value="view">{t('permissions.viewOnly')}</SelectItem>
                    <SelectItem value="edit">{t('permissions.fullAccess')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSaveIntranetPermissions} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {t('actions.save')}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Store Access Table */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader>
              <div>
                <CardTitle>{t('pages.employeeDetail.storeAccess')}</CardTitle>
                <CardDescription>{t('pages.employeeDetail.storeAccessDescription')}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={storeColumns}
                data={storeRoles}
                onRowClick={handleStoreRowClick}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
