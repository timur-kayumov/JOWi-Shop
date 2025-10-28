'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
} from '@jowi/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schema для сотрудника
const employeeSchema = z.object({
  firstName: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  lastName: z.string().min(2, 'Фамилия должна содержать минимум 2 символа'),
  email: z.string().email('Некорректный email'),
  phone: z.string().min(9, 'Некорректный номер телефона'),
  role: z.enum(['administrator', 'manager', 'cashier', 'warehouse']),
  storeId: z.string().min(1, 'Выберите магазин'),
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

const roleLabels = {
  administrator: 'Администратор',
  manager: 'Менеджер',
  cashier: 'Кассир',
  warehouse: 'Складской работник',
};

const roleColors = {
  administrator: 'default' as const,
  manager: 'secondary' as const,
  cashier: 'outline' as const,
  warehouse: 'outline' as const,
};

export default function EmployeesPage() {
  const router = useRouter();
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
      role: 'cashier',
      storeId: '',
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
    const store = mockStores.find((s) => s.id === data.storeId);
    if (editingEmployee) {
      // Update existing employee
      setEmployees(
        employees.map((e) =>
          e.id === editingEmployee.id
            ? { ...e, ...data, storeName: store?.name || '' }
            : e
        )
      );
    } else {
      // Create new employee
      const newEmployee = {
        id: String(employees.length + 1),
        ...data,
        storeName: store?.name || '',
        createdAt: new Date(),
      };
      setEmployees([...employees, newEmployee]);
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
      role: employee.role,
      storeId: employee.storeId,
      isActive: employee.isActive,
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
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
      <div>
        <h1 className="text-3xl font-bold">Сотрудники</h1>
        <p className="text-muted-foreground mt-2">
          Управление сотрудниками и их правами доступа
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени или email..."
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
              <SelectItem value="all">Все роли</SelectItem>
              <SelectItem value="administrator">Администратор</SelectItem>
              <SelectItem value="manager">Менеджер</SelectItem>
              <SelectItem value="cashier">Кассир</SelectItem>
              <SelectItem value="warehouse">Складской работник</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingEmployee(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить сотрудника
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? 'Редактировать сотрудника' : 'Новый сотрудник'}
              </DialogTitle>
              <DialogDescription>
                {editingEmployee
                  ? 'Внесите изменения в информацию о сотруднике'
                  : 'Заполните информацию о новом сотруднике'}
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
                        <FormLabel>Имя</FormLabel>
                        <FormControl>
                          <Input placeholder="Азиз" {...field} />
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
                        <FormLabel>Фамилия</FormLabel>
                        <FormControl>
                          <Input placeholder="Каримов" {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="aziz.karimov@jowi.uz" type="email" {...field} />
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
                      <FormLabel>Телефон</FormLabel>
                      <FormControl>
                        <Input placeholder="+998901234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Роль</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите роль" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="administrator">Администратор</SelectItem>
                            <SelectItem value="manager">Менеджер</SelectItem>
                            <SelectItem value="cashier">Кассир</SelectItem>
                            <SelectItem value="warehouse">Складской работник</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Магазин</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите магазин" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockStores.map((store) => (
                              <SelectItem key={store.id} value={store.id}>
                                {store.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Отмена
                  </Button>
                  <Button type="submit">
                    {editingEmployee ? 'Сохранить изменения' : 'Создать сотрудника'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={[
          {
            key: 'fullName',
            label: 'Сотрудник',
            sortable: true,
            render: (employee) => (
              <div className="font-medium">
                {employee.firstName} {employee.lastName}
              </div>
            ),
          },
          {
            key: 'email',
            label: 'Контакты',
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
            label: 'Роль',
            sortable: true,
            render: (employee) => (
              <Badge variant={roleColors[employee.role]}>
                {roleLabels[employee.role]}
              </Badge>
            ),
          },
          {
            key: 'storeName',
            label: 'Магазин',
            sortable: true,
          },
          {
            key: 'isActive',
            label: 'Статус',
            sortable: true,
            render: (employee) => (
              <Badge variant={employee.isActive ? 'success' : 'outline'}>
                {employee.isActive ? 'Активен' : 'Неактивен'}
              </Badge>
            ),
          },
        ]}
        data={filteredEmployees}
        onRowClick={(employee) => router.push(`/intranet/employees/${employee.id}`)}
        emptyMessage={search || roleFilter !== 'all' ? 'Ничего не найдено' : 'Нет сотрудников'}
      />

      {filteredEmployees.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Показано {filteredEmployees.length} из {employees.length} сотрудников
        </div>
      )}
    </div>
  );
}
