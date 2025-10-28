'use client';

import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, Calendar } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Input,
  DataTable,
  Column,
} from '@jowi/ui';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Mock данные для графиков продаж
const salesByDayData = [
  { date: '21.10', revenue: 4200000, orders: 52 },
  { date: '22.10', revenue: 5100000, orders: 63 },
  { date: '23.10', revenue: 4800000, orders: 59 },
  { date: '24.10', revenue: 6300000, orders: 78 },
  { date: '25.10', revenue: 5900000, orders: 71 },
  { date: '26.10', revenue: 7200000, orders: 89 },
  { date: '27.10', revenue: 6800000, orders: 82 },
];

// Mock данные для топ товаров
const topProductsData = [
  {
    id: '1',
    name: 'Coca-Cola 1L',
    image: 'https://placehold.co/60x60/png?text=Coca-Cola',
    sold: 234,
    revenue: 11700000,
    category: 'Напитки',
  },
  {
    id: '2',
    name: 'Хлеб Бородинский',
    image: 'https://placehold.co/60x60/png?text=Bread',
    sold: 189,
    revenue: 1890000,
    category: 'Хлеб',
  },
  {
    id: '3',
    name: 'Молоко 1L',
    image: 'https://placehold.co/60x60/png?text=Milk',
    sold: 167,
    revenue: 5010000,
    category: 'Молочные',
  },
  {
    id: '4',
    name: 'Яйца 10шт',
    image: 'https://placehold.co/60x60/png?text=Eggs',
    sold: 145,
    revenue: 4350000,
    category: 'Яйца',
  },
  {
    id: '5',
    name: 'Рис 1кг',
    image: 'https://placehold.co/60x60/png?text=Rice',
    sold: 123,
    revenue: 3690000,
    category: 'Крупы',
  },
];

// Mock данные для продаж по категориям
const salesByCategoryData = [
  { name: 'Напитки', value: 35, revenue: 45500000 },
  { name: 'Молочные', value: 25, revenue: 32500000 },
  { name: 'Хлеб', value: 15, revenue: 19500000 },
  { name: 'Крупы', value: 12, revenue: 15600000 },
  { name: 'Прочее', value: 13, revenue: 16900000 },
];

const COLORS = ['#007aff', '#34c759', '#ff9500', '#ff3b30', '#af52de'];

// Mock данные для сотрудников
const employeePerformanceData = [
  {
    id: '1',
    name: 'Азиз Каримов',
    role: 'Администратор',
    store: 'Магазин Центральный',
    sales: 156,
    revenue: 12700000,
    avgCheck: 81410,
  },
  {
    id: '2',
    name: 'Диана Ахмедова',
    role: 'Менеджер',
    store: 'Магазин Центральный',
    sales: 143,
    revenue: 11500000,
    avgCheck: 80420,
  },
  {
    id: '3',
    name: 'Шахзод Усманов',
    role: 'Кассир',
    store: 'Магазин Чиланзар',
    sales: 189,
    revenue: 15200000,
    avgCheck: 80420,
  },
  {
    id: '4',
    name: 'Нодира Рахимова',
    role: 'Складской работник',
    store: 'Магазин Юнусабад',
    sales: 98,
    revenue: 7800000,
    avgCheck: 79590,
  },
];

// Mock данные для складских остатков
const inventoryData = [
  {
    id: '1',
    name: 'Coca-Cola 1L',
    image: 'https://placehold.co/60x60/png?text=Coca-Cola',
    category: 'Напитки',
    stock: 450,
    minStock: 200,
    warehouse: 'Центральный склад',
    cost: 50000,
  },
  {
    id: '2',
    name: 'Хлеб Бородинский',
    image: 'https://placehold.co/60x60/png?text=Bread',
    category: 'Хлеб',
    stock: 180,
    minStock: 100,
    warehouse: 'Центральный склад',
    cost: 10000,
  },
  {
    id: '3',
    name: 'Молоко 1L',
    image: 'https://placehold.co/60x60/png?text=Milk',
    category: 'Молочные',
    stock: 89,
    minStock: 150,
    warehouse: 'Чиланзар склад',
    cost: 30000,
  },
  {
    id: '4',
    name: 'Яйца 10шт',
    image: 'https://placehold.co/60x60/png?text=Eggs',
    category: 'Яйца',
    stock: 250,
    minStock: 100,
    warehouse: 'Центральный склад',
    cost: 30000,
  },
];

// Mock статистика
const mockStats = {
  totalRevenue: 125600000,
  totalOrders: 1543,
  averageCheck: 81400,
  topProduct: 'Coca-Cola 1L',
};

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedStore, setSelectedStore] = useState('all');
  const [productSearch, setProductSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' сум';
  };

  const filteredProducts = topProductsData.filter((product) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredEmployees = employeePerformanceData.filter((employee) =>
    employee.name.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const filteredInventory = inventoryData.filter((item) =>
    item.name.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Отчёты</h1>
        <p className="text-muted-foreground mt-2">
          Аналитика и отчётность по всем операциям
        </p>
      </div>

      {/* Фильтры */}
      <div className="flex items-center gap-4 flex-wrap">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Период" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Сегодня</SelectItem>
            <SelectItem value="yesterday">Вчера</SelectItem>
            <SelectItem value="week">Неделя</SelectItem>
            <SelectItem value="month">Месяц</SelectItem>
            <SelectItem value="quarter">Квартал</SelectItem>
            <SelectItem value="year">Год</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStore} onValueChange={setSelectedStore}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Магазин" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все магазины</SelectItem>
            <SelectItem value="1">Магазин Центральный</SelectItem>
            <SelectItem value="2">Магазин Чиланзар</SelectItem>
            <SelectItem value="3">Магазин Юнусабад</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button variant="outline">
          <Calendar className="mr-2 h-4 w-4" />
          {format(new Date(), 'dd MMMM yyyy', { locale: ru })}
        </Button>
      </div>

      {/* Ключевые показатели */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общая выручка</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockStats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% от предыдущего периода
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Количество заказов</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              +15.2% от предыдущего периода
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средний чек</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockStats.averageCheck)}</div>
            <p className="text-xs text-muted-foreground">
              +4.3% от предыдущего периода
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Топ товар</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.topProduct}</div>
            <p className="text-xs text-muted-foreground">
              234 продажи за период
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Табы с отчётами */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Продажи</TabsTrigger>
          <TabsTrigger value="products">Топ товаров</TabsTrigger>
          <TabsTrigger value="employees">Сотрудники</TabsTrigger>
          <TabsTrigger value="inventory">Склад</TabsTrigger>
        </TabsList>

        {/* Отчёт по продажам */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Динамика продаж</CardTitle>
                <CardDescription>Выручка и количество заказов по дням</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesByDayData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#007aff"
                      name="Выручка"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Продажи по категориям</CardTitle>
                <CardDescription>Распределение выручки по категориям товаров</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={salesByCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {salesByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Количество заказов по дням</CardTitle>
              <CardDescription>Статистика заказов за последние 7 дней</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesByDayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orders" fill="#34c759" name="Заказы" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Отчёт по топ товарам */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Самые продаваемые товары</CardTitle>
              <CardDescription>Топ товаров за выбранный период</CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск товара..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-2xl font-bold text-muted-foreground w-8">
                        #{index + 1}
                      </div>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(product.revenue)}</div>
                      <div className="text-sm text-muted-foreground">{product.sold} продаж</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Отчёт по сотрудникам */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Эффективность сотрудников</CardTitle>
              <CardDescription>Статистика продаж по сотрудникам</CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск сотрудника..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  {
                    key: 'name',
                    label: 'Сотрудник',
                    sortable: true,
                    render: (employee) => <span className="font-medium">{employee.name}</span>,
                  },
                  {
                    key: 'role',
                    label: 'Роль',
                    sortable: true,
                    className: 'text-muted-foreground',
                  },
                  {
                    key: 'store',
                    label: 'Магазин',
                    sortable: true,
                  },
                  {
                    key: 'sales',
                    label: 'Продажи',
                    sortable: true,
                    className: 'text-right font-medium',
                  },
                  {
                    key: 'revenue',
                    label: 'Выручка',
                    sortable: true,
                    className: 'text-right font-bold',
                    render: (employee) => formatCurrency(employee.revenue),
                  },
                  {
                    key: 'avgCheck',
                    label: 'Средний чек',
                    sortable: true,
                    className: 'text-right text-muted-foreground',
                    render: (employee) => formatCurrency(employee.avgCheck),
                  },
                ]}
                data={filteredEmployees}
                emptyMessage="Нет данных"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Выручка по сотрудникам</CardTitle>
              <CardDescription>Сравнение выручки сотрудников</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={employeePerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#007aff" name="Выручка" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Складской отчёт */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Складские остатки</CardTitle>
              <CardDescription>Текущие остатки товаров на складах</CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск товара..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredInventory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{item.category}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {item.warehouse}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={item.stock < item.minStock ? 'warning' : 'success'}
                        >
                          {item.stock} шт
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Мин: {item.minStock} шт
                      </div>
                      <div className="text-sm font-medium mt-1">
                        {formatCurrency(item.cost * item.stock)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
