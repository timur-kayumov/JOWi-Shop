'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Pencil, Trash2, Mail, Phone } from 'lucide-react';
import {
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  DataTable,
  Column,
  Card,
} from '@jowi/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schema для сотрудника (базовая информация без роли и магазина)
const employeeSchema = z.object({
  firstName: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  lastName: z.string().min(2, 'Фамилия должна содержать минимум 2 символа'),
  email: z.string().email('Некорректный email'),
  phone: z.string().min(9, 'Некорректный номер телефона'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
  citizenship: z.string().min(2, 'Введите гражданство'),
  passportSeries: z.string().min(1, 'Введите серию паспорта'),
  passportNumber: z.string().min(1, 'Введите номер паспорта'),
  isActive: z.boolean().default(true),
});

type EmployeeSchema = z.infer<typeof employeeSchema>;

// Mock data
const mockStores = [
  { id: '1', name: 'Магазин Центральный' },
  { id: '2', name: 'Магазин Чиланзар' },
  { id: '3', name: 'Магазин Юнусабад' },
];

const mockEmployees = [
  {
    id: '1',
    firstName: 'Азиз',
    lastName: 'Каримов',
    email: 'aziz.karimov@jowi.uz',
    phone: '+998901234567',
    role: 'administrator' as const,
    storeId: '1',
    storeName: 'Магазин Центральный',
    isActive: true,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    firstName: 'Диана',
    lastName: 'Ахмедова',
    email: 'diana.ahmed@jowi.uz',
    phone: '+998907654321',
    role: 'manager' as const,
    storeId: '1',
    storeName: 'Магазин Центральный',
    isActive: true,
    createdAt: new Date('2024-02-10'),
  },
  {
    id: '3',
    firstName: 'Шахзод',
    lastName: 'Усманов',
    email: 'shahzod.usmanov@jowi.uz',
    phone: '+998905555555',
    role: 'cashier' as const,
    storeId: '2',
    storeName: 'Магазин Чиланзар',
    isActive: true,
    createdAt: new Date('2024-03-05'),
  },
  {
    id: '4',
    firstName: 'Нодира',
    lastName: 'Рахимова',
    email: 'nodira.rahimova@jowi.uz',
    phone: '+998903333333',
    role: 'warehouse' as const,
    storeId: '3',
    storeName: 'Магазин Юнусабад',
    isActive: false,
    createdAt: new Date('2024-02-20'),
  },
];

const getRoleLabel = (role: string, t: any) => {
  const roleMap: Record<string, string> = {
    administrator: t('pages.employees.roles.administrator'),
    manager: t('pages.employees.roles.manager'),
    cashier: t('pages.employees.roles.cashier'),
    warehouse: t('pages.employees.roles.warehouse'),
  };
  return roleMap[role] || role;
};

const roleColors = {
  administrator: 'default' as const,
  manager: 'secondary' as const,
  cashier: 'outline' as const,
  warehouse: 'outline' as const,
};

export default function EmployeesPage() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [employees, setEmployees] = useState(mockEmployees);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<typeof mockEmployees[0] | null>(null);

  const form = useForm<EmployeeSchema>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      citizenship: '',
      passportSeries: '',
      passportNumber: '',
      isActive: true,
    },
  });

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.firstName.toLowerCase().includes(search.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(search.toLowerCase()) ||
      employee.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || employee.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const onSubmit = (data: EmployeeSchema) => {
    if (editingEmployee) {
      // Update existing employee - только базовая информация
      setEmployees(
        employees.map((e) =>
          e.id === editingEmployee.id
            ? {
                ...e,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                isActive: data.isActive,
              }
            : e
        )
      );
    } else {
      // Create new employee - роль и магазин назначаются позже на странице сотрудника
      const newEmployee = {
        id: String(employees.length + 1),
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        role: 'cashier' as const, // Временная роль для демо
        storeId: '1', // Временный магазин для демо
        storeName: 'Не назначен', // Показываем, что магазин еще не назначен
        isActive: data.isActive,
        createdAt: new Date(),
      };
      setEmployees([...employees, newEmployee]);
      // После создания редиректим на страницу сотрудника для настройки доступов
      // router.push(`/intranet/employees/${newEmployee.id}`);
    }
    setOpen(false);
    form.reset();
    setEditingEmployee(null);
  };

  const handleEdit = (employee: typeof mockEmployees[0]) => {
    setEditingEmployee(employee);
    form.reset({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      password: '', // Пароль не показываем при редактировании
      citizenship: 'Узбекистан', // Mock данные
      passportSeries: 'AB', // Mock данные
      passportNumber: '1234567', // Mock данные
      isActive: employee.isActive,
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('pages.employees.deleteConfirm'))) {
      setEmployees(employees.filter((e) => e.id !== id));
    }
  };

  const handleDialogClose = () => {
    setOpen(false);
    form.reset();
    setEditingEmployee(null);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{t('pages.employees.title')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('pages.employees.subtitle')}
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('pages.employees.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Все роли" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('pages.employees.allRoles')}</SelectItem>
                  <SelectItem value="administrator">{t('pages.employees.roles.administrator')}</SelectItem>
                  <SelectItem value="manager">{t('pages.employees.roles.manager')}</SelectItem>
                  <SelectItem value="cashier">{t('pages.employees.roles.cashier')}</SelectItem>
                  <SelectItem value="warehouse">{t('pages.employees.roles.warehouse')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingEmployee(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('pages.employees.addEmployee')}
                </Button>
              </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? t('pages.employees.editEmployee') : t('pages.employees.newEmployee')}
              </DialogTitle>
              <DialogDescription>
                {editingEmployee
                  ? t('pages.employees.editDescription')
                  : t('pages.employees.newDescription')}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('pages.employees.fields.firstName')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('pages.employees.placeholders.firstName')} {...field} />
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
                          <Input placeholder={t('pages.employees.placeholders.lastName')} {...field} />
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
                        <Input placeholder={t('pages.employees.placeholders.email')} type="email" {...field} />
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
                        <Input placeholder={t('pages.employees.placeholders.phone')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!editingEmployee && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Пароль</FormLabel>
                        <FormControl>
                          <Input placeholder="Минимум 8 символов" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="citizenship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pages.employees.fields.citizenship')}</FormLabel>
                      <FormControl>
                        <Input placeholder="Узбекистан" {...field} />
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
                          <Input placeholder="AB" {...field} />
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
                          <Input placeholder="1234567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    {t('actions.cancel')}
                  </Button>
                  <Button type="submit">
                    {editingEmployee ? t('actions.save') : t('actions.create')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
          </div>
        </div>
      </Card>

      <DataTable
        columns={[
          {
            key: 'fullName',
            label: t('pages.employees.fields.employee'),
            sortable: true,
            render: (employee) => (
              <div className="font-medium">
                {employee.firstName} {employee.lastName}
              </div>
            ),
          },
          {
            key: 'email',
            label: t('pages.employees.fields.contacts'),
            render: (employee) => (
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {employee.email}
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {employee.phone}
                </div>
              </div>
            ),
          },
          {
            key: 'role',
            label: t('pages.employees.fields.role'),
            sortable: true,
            render: (employee) => (
              <Badge variant={roleColors[employee.role]}>
                {getRoleLabel(employee.role, t)}
              </Badge>
            ),
          },
          {
            key: 'storeName',
            label: t('pages.employees.fields.store'),
            sortable: true,
          },
          {
            key: 'isActive',
            label: t('fields.status'),
            sortable: true,
            render: (employee) => (
              <Badge variant={employee.isActive ? 'success' : 'outline'}>
                {employee.isActive ? t('status.active') : t('status.inactive')}
              </Badge>
            ),
          },
        ]}
        data={filteredEmployees}
        onRowClick={(employee) => router.push(`/intranet/employees/${employee.id}`)}
        emptyMessage={search || roleFilter !== 'all' ? t('pages.employees.notFound') : t('pages.employees.noEmployees')}
        pagination={{ enabled: true, pageSize: 15 }}
      />

      {filteredEmployees.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {t('pages.employees.showing', { count: filteredEmployees.length, total: employees.length })}
        </div>
      )}
    </div>
  );
}
