'use client';

import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('common');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedStore, setSelectedStore] = useState('all');
  const [productSearch, setProductSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');

  // Mock данные для продаж по категориям (переведенные)
  const salesByCategoryData = [
    { name: t('categories.drinks'), value: 35, revenue: 45500000 },
    { name: t('categories.dairy'), value: 25, revenue: 32500000 },
    { name: t('categories.bread'), value: 15, revenue: 19500000 },
    { name: t('categories.cereals'), value: 12, revenue: 15600000 },
    { name: t('categories.other'), value: 13, revenue: 16900000 },
  ];

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
        <h1 className="text-3xl font-bold">{t('pages.reports.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('pages.reports.subtitle')}
        </p>
      </div>

      {/* Фильтры */}
      <div className="flex items-center gap-4 flex-wrap">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Период" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">{t('pages.reports.period.today')}</SelectItem>
            <SelectItem value="yesterday">{t('pages.reports.period.yesterday')}</SelectItem>
            <SelectItem value="week">{t('pages.reports.period.week')}</SelectItem>
            <SelectItem value="month">{t('pages.reports.period.month')}</SelectItem>
            <SelectItem value="quarter">{t('pages.reports.period.quarter')}</SelectItem>
            <SelectItem value="year">{t('pages.reports.period.year')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStore} onValueChange={setSelectedStore}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Магазин" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('pages.reports.store.all')}</SelectItem>
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
            <CardTitle className="text-sm font-medium">{t('pages.reports.kpi.totalRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockStats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% {t('pages.reports.kpi.comparedToPrevious')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pages.reports.kpi.totalOrders')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              +15.2% {t('pages.reports.kpi.comparedToPrevious')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pages.reports.kpi.averageCheck')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockStats.averageCheck)}</div>
            <p className="text-xs text-muted-foreground">
              +4.3% {t('pages.reports.kpi.comparedToPrevious')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pages.reports.kpi.topProduct')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.topProduct}</div>
            <p className="text-xs text-muted-foreground">
              234 {t('pages.reports.kpi.sales')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Табы с отчётами */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">{t('pages.reports.tabs.sales')}</TabsTrigger>
          <TabsTrigger value="products">{t('pages.reports.tabs.products')}</TabsTrigger>
          <TabsTrigger value="employees">{t('pages.reports.tabs.employees')}</TabsTrigger>
          <TabsTrigger value="inventory">{t('pages.reports.tabs.inventory')}</TabsTrigger>
        </TabsList>

        {/* Отчёт по продажам */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('pages.reports.salesTab.dynamicsTitle')}</CardTitle>
                <CardDescription>{t('pages.reports.salesTab.dynamicsDescription')}</CardDescription>
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
                      name={t('pages.reports.salesTab.revenue')}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('pages.reports.salesTab.categoriesTitle')}</CardTitle>
                <CardDescription>{t('pages.reports.salesTab.categoriesDescription')}</CardDescription>
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
              <CardTitle>{t('pages.reports.salesTab.ordersTitle')}</CardTitle>
              <CardDescription>{t('pages.reports.salesTab.ordersDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesByDayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orders" fill="#34c759" name={t('pages.reports.salesTab.orders')} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Отчёт по топ товарам */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.reports.productsTab.title')}</CardTitle>
              <CardDescription>{t('pages.reports.productsTab.description')}</CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('pages.reports.productsTab.searchPlaceholder')}
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
                      <div className="text-sm text-muted-foreground">{product.sold} {t('pages.reports.productsTab.sales')}</div>
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
              <CardTitle>{t('pages.reports.employeesTab.title')}</CardTitle>
              <CardDescription>{t('pages.reports.employeesTab.description')}</CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('pages.reports.employeesTab.searchPlaceholder')}
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
                    label: t('pages.reports.employeesTab.columns.employee'),
                    sortable: true,
                    render: (employee) => <span className="font-medium">{employee.name}</span>,
                  },
                  {
                    key: 'role',
                    label: t('pages.reports.employeesTab.columns.role'),
                    sortable: true,
                    className: 'text-muted-foreground',
                  },
                  {
                    key: 'store',
                    label: t('pages.reports.employeesTab.columns.store'),
                    sortable: true,
                  },
                  {
                    key: 'sales',
                    label: t('pages.reports.employeesTab.columns.sales'),
                    sortable: true,
                    className: 'text-right font-medium',
                  },
                  {
                    key: 'revenue',
                    label: t('pages.reports.employeesTab.columns.revenue'),
                    sortable: true,
                    className: 'text-right font-bold',
                    render: (employee) => formatCurrency(employee.revenue),
                  },
                  {
                    key: 'avgCheck',
                    label: t('pages.reports.employeesTab.columns.avgCheck'),
                    sortable: true,
                    className: 'text-right text-muted-foreground',
                    render: (employee) => formatCurrency(employee.avgCheck),
                  },
                ]}
                data={filteredEmployees}
                emptyMessage={t('pages.reports.noData')}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('pages.reports.employeesTab.revenueChartTitle')}</CardTitle>
              <CardDescription>{t('pages.reports.employeesTab.revenueChartDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={employeePerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#007aff" name={t('pages.reports.employeesTab.columns.revenue')} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Складской отчёт */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.reports.inventoryTab.title')}</CardTitle>
              <CardDescription>{t('pages.reports.inventoryTab.description')}</CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('pages.reports.inventoryTab.searchPlaceholder')}
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
                          {item.stock} {t('pages.reports.inventoryTab.pcs')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {t('pages.reports.inventoryTab.min')}: {item.minStock} {t('pages.reports.inventoryTab.pcs')}
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
