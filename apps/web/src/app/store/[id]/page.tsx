'use client';

import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  DollarSign,
  Package,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@jowi/ui';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

// Mock data for demonstration
const mockKPIs = {
  todayRevenue: 5420000,
  yesterdayRevenue: 4980000,
  receiptsCount: 142,
  yesterdayReceipts: 138,
  averageCheck: 38169,
  yesterdayAverage: 36087,
  lowStockCount: 12,
};

const mockHourlyRevenue = [
  { hour: '9:00', revenue: 120000 },
  { hour: '10:00', revenue: 280000 },
  { hour: '11:00', revenue: 450000 },
  { hour: '12:00', revenue: 620000 },
  { hour: '13:00', revenue: 580000 },
  { hour: '14:00', revenue: 490000 },
  { hour: '15:00', revenue: 720000 },
  { hour: '16:00', revenue: 850000 },
  { hour: '17:00', revenue: 910000 },
  { hour: '18:00', revenue: 700000 },
  { hour: '19:00', revenue: 490000 },
  { hour: '20:00', revenue: 210000 },
];

const mockTopProducts = [
  { name: 'Coca-Cola 0.5л', sales: 85 },
  { name: 'Хлеб белый', sales: 72 },
  { name: 'Молоко 1л', sales: 58 },
  { name: 'Pepsi 0.5л', sales: 54 },
  { name: 'Кефир 0.5л', sales: 41 },
];

const mockCategoryData = [
  { name: 'Напитки', value: 1820000 },
  { name: 'Молочные', value: 980000 },
  { name: 'Хлеб', value: 640000 },
  { name: 'Крупы', value: 1980000 },
];

const mockRecentReceipts = [
  {
    id: 'R-10142',
    time: '19:45',
    cashier: 'Азиз Каримов',
    amount: 127000,
  },
  {
    id: 'R-10141',
    time: '19:32',
    cashier: 'Нигора Усманова',
    amount: 85000,
  },
  {
    id: 'R-10140',
    time: '19:18',
    cashier: 'Азиз Каримов',
    amount: 156000,
  },
  {
    id: 'R-10139',
    time: '19:05',
    cashier: 'Нигора Усманова',
    amount: 43000,
  },
  {
    id: 'R-10138',
    time: '18:52',
    cashier: 'Азиз Каримов',
    amount: 92000,
  },
];

const mockLowStockProducts = [
  { name: 'Рис басмати 1кг', stock: 12, min: 20 },
  { name: 'Гречка 1кг', stock: 8, min: 15 },
  { name: 'Масло подсолнечное 1л', stock: 5, min: 10 },
  { name: 'Сахар 1кг', stock: 18, min: 25 },
  { name: 'Мука высший сорт 1кг', stock: 14, min: 20 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default function StoreDashboardPage() {
  const { t } = useTranslation('common');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTrendIndicator = (current: number, previous: number) => {
    const diff = current - previous;
    const percentChange = ((diff / previous) * 100).toFixed(1);

    if (diff > 0) {
      return (
        <div className="flex items-center gap-1 text-sm text-green-600">
          <TrendingUp className="h-4 w-4" />
          <span>+{percentChange}%</span>
        </div>
      );
    } else if (diff < 0) {
      return (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <TrendingDown className="h-4 w-4" />
          <span>{percentChange}%</span>
        </div>
      );
    }
    return (
      <div className="text-sm text-muted-foreground">
        {t('storePages.dashboard.trends.same')}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('storePages.dashboard.title')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('storePages.dashboard.description')}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Today Revenue */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground">
                {t('storePages.dashboard.kpi.todayRevenue')}
              </div>
              <div className="text-2xl font-bold mt-1">
                {formatCurrency(mockKPIs.todayRevenue)} {t('currency')}
              </div>
              <div className="mt-2">
                {getTrendIndicator(
                  mockKPIs.todayRevenue,
                  mockKPIs.yesterdayRevenue
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receipts Count */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Receipt className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground">
                {t('storePages.dashboard.kpi.receiptsCount')}
              </div>
              <div className="text-2xl font-bold mt-1">
                {mockKPIs.receiptsCount}
              </div>
              <div className="mt-2">
                {getTrendIndicator(
                  mockKPIs.receiptsCount,
                  mockKPIs.yesterdayReceipts
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Check */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground">
                {t('storePages.dashboard.kpi.averageCheck')}
              </div>
              <div className="text-2xl font-bold mt-1">
                {formatCurrency(mockKPIs.averageCheck)} {t('currency')}
              </div>
              <div className="mt-2">
                {getTrendIndicator(
                  mockKPIs.averageCheck,
                  mockKPIs.yesterdayAverage
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground">
                {t('storePages.dashboard.kpi.lowStockProducts')}
              </div>
              <div className="text-2xl font-bold mt-1 text-orange-600">
                {mockKPIs.lowStockCount}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {t('storePages.dashboard.lowStock.min')} {t('units.pcs')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hourly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('storePages.dashboard.charts.hourlyRevenueTitle')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('storePages.dashboard.charts.hourlyRevenueDescription')}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockHourlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value) + ' ' + t('currency')}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name={t('storePages.dashboard.charts.revenue')}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('storePages.dashboard.charts.topProductsTitle')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('storePages.dashboard.charts.topProductsDescription')}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockTopProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="sales"
                  fill="#10b981"
                  name={t('storePages.dashboard.charts.sales')}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Categories Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('storePages.dashboard.charts.categoriesTitle')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('storePages.dashboard.charts.categoriesDescription')}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value) + ' ' + t('currency')}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Receipts Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('storePages.dashboard.recentReceipts.title')}</CardTitle>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                {t('storePages.dashboard.recentReceipts.viewAll')}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentReceipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Receipt className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{receipt.id}</div>
                      <div className="text-sm text-muted-foreground">
                        {receipt.cashier} • {receipt.time}
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold">
                    {formatCurrency(receipt.amount)} {t('currency')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Products Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('storePages.dashboard.lowStock.title')}</CardTitle>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              {t('storePages.dashboard.lowStock.viewAll')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockLowStockProducts.map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Package className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="font-medium">{product.name}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    {t('storePages.dashboard.lowStock.min')}: {product.min} {t('units.pcs')}
                  </div>
                  <Badge variant="warning">
                    {product.stock} {t('units.pcs')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
