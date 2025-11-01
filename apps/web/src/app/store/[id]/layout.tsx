'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, Warehouse, BarChart3, Settings, ChevronDown, FolderTree, List, Activity, FileX, ClipboardList, Users, FileText, ArrowRightLeft, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  AppShell,
  NavItem,
  type Language,
  type Notification,
  NotificationPanel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jowi/ui';

// Mock user data - replace with actual auth later
const mockUser = {
  name: 'Администратор',
  email: 'admin@jowi.uz',
  avatar: undefined,
};

// Mock stores data
const mockStores = [
  { id: '1', name: 'Центральный магазин' },
  { id: '2', name: 'Магазин "Чиланзар"' },
  { id: '3', name: 'Магазин "Юнусабад"' },
];

// Mock notifications data - replace with actual API later
const createMockNotifications = (t: any): Notification[] => [
  {
    id: '1',
    type: 'warning',
    title: t('notifications.testNotifications.lowStock.title'),
    message: t('notifications.testNotifications.lowStock.message'),
    timestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
    isRead: false,
    icon: 'package',
  },
  {
    id: '2',
    type: 'success',
    title: t('notifications.testNotifications.shiftClosed.title'),
    message: t('notifications.testNotifications.shiftClosed.message'),
    timestamp: new Date(Date.now() - 45 * 60000), // 45 minutes ago
    isRead: false,
    icon: 'money',
  },
  {
    id: '3',
    type: 'error',
    title: t('notifications.testNotifications.fiscalError.title'),
    message: t('notifications.testNotifications.fiscalError.message'),
    timestamp: new Date(Date.now() - 2 * 3600000), // 2 hours ago
    isRead: false,
    icon: 'alert',
  },
  {
    id: '4',
    type: 'info',
    title: t('notifications.testNotifications.newDelivery.title'),
    message: t('notifications.testNotifications.newDelivery.message'),
    timestamp: new Date(Date.now() - 4 * 3600000), // 4 hours ago
    isRead: true,
    icon: 'package',
  },
  {
    id: '5',
    type: 'info',
    title: t('notifications.testNotifications.newEmployee.title'),
    message: t('notifications.testNotifications.newEmployee.message'),
    timestamp: new Date(Date.now() - 24 * 3600000), // 1 day ago
    isRead: true,
    icon: 'user',
  },
  {
    id: '6',
    type: 'error',
    title: t('notifications.testNotifications.criticalStock.title'),
    message: t('notifications.testNotifications.criticalStock.message'),
    timestamp: new Date(Date.now() - 48 * 3600000), // 2 days ago
    isRead: true,
    icon: 'package',
  },
  {
    id: '7',
    type: 'success',
    title: t('notifications.testNotifications.syncComplete.title'),
    message: t('notifications.testNotifications.syncComplete.message'),
    timestamp: new Date(Date.now() - 72 * 3600000), // 3 days ago
    isRead: true,
    icon: 'settings',
  },
];

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const { t, i18n } = useTranslation('common');
  const [currentLanguage, setCurrentLanguage] = useState<Language>('ru');
  const [selectedStoreId, setSelectedStoreId] = useState<string>(params.id as string);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load saved language on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('jowi-language');
    if (savedLanguage && (savedLanguage === 'ru' || savedLanguage === 'uz')) {
      setCurrentLanguage(savedLanguage as Language);
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  // Update selected store when params change
  useEffect(() => {
    if (params.id) {
      setSelectedStoreId(params.id as string);
    }
  }, [params.id]);

  // Initialize notifications
  useEffect(() => {
    setNotifications(createMockNotifications(t));
  }, [t]);

  // Navigation items for store admin
  const navItems: NavItem[] = [
    {
      title: t('storeNavigation.dashboard'),
      href: `/store/${selectedStoreId}`,
      icon: LayoutDashboard,
    },
    {
      title: t('storeNavigation.orders'),
      href: `/store/${selectedStoreId}/orders`,
      icon: ShoppingCart,
    },
    {
      title: t('storeNavigation.productManagement'),
      icon: Package,
      children: [
        {
          title: t('storeNavigation.products'),
          href: `/store/${selectedStoreId}/products`,
          icon: List,
        },
        {
          title: t('storeNavigation.categories'),
          href: `/store/${selectedStoreId}/categories`,
          icon: FolderTree,
        },
      ],
    },
    {
      title: t('storeNavigation.inventory'),
      icon: Warehouse,
      children: [
        {
          title: t('storeNavigation.warehouses'),
          href: `/store/${selectedStoreId}/warehouses`,
          icon: Building2,
        },
        {
          title: t('storeNavigation.warehouseMonitoring'),
          href: `/store/${selectedStoreId}/warehouses/monitoring`,
          icon: Activity,
        },
        {
          title: t('storeNavigation.writeoffs'),
          href: `/store/${selectedStoreId}/warehouses/writeoffs`,
          icon: FileX,
        },
      ],
    },
    {
      title: t('storeNavigation.documents'),
      icon: ClipboardList,
      children: [
        {
          title: t('storeNavigation.suppliers'),
          href: `/store/${selectedStoreId}/documents/suppliers`,
          icon: Users,
        },
        {
          title: t('storeNavigation.invoices'),
          href: `/store/${selectedStoreId}/documents/invoices`,
          icon: FileText,
        },
        {
          title: t('storeNavigation.warehouseTransfers'),
          href: `/store/${selectedStoreId}/documents/warehouse-transfers`,
          icon: ArrowRightLeft,
        },
        {
          title: t('storeNavigation.storeTransfers'),
          href: `/store/${selectedStoreId}/documents/store-transfers`,
          icon: Building2,
        },
      ],
    },
    {
      title: t('storeNavigation.reports'),
      href: `/store/${selectedStoreId}/reports`,
      icon: BarChart3,
    },
    {
      title: t('storeNavigation.settings'),
      href: `/store/${selectedStoreId}/settings`,
      icon: Settings,
    },
  ];

  // Generate breadcrumbs
  const generateBreadcrumbs = () => {
    const currentStore = mockStores.find(s => s.id === selectedStoreId);
    const storeName = currentStore?.name || 'Магазин';

    const breadcrumbs = [
      {
        label: t('navigation.stores'),
        href: '/intranet/stores'
      },
      {
        label: storeName,
        href: `/store/${selectedStoreId}`
      }
    ];

    const paths = pathname.split('/').filter(Boolean);
    if (paths.length > 2) {
      const currentPage = paths[paths.length - 1];
      const pageMap: Record<string, string> = {
        orders: t('storeNavigation.orders'),
        products: t('storeNavigation.products'),
        categories: t('storeNavigation.categories'),
        warehouses: t('storeNavigation.warehouses'),
        monitoring: t('storeNavigation.warehouseMonitoring'),
        writeoffs: t('storeNavigation.writeoffs'),
        suppliers: t('storeNavigation.suppliers'),
        invoices: t('storeNavigation.invoices'),
        'warehouse-transfers': t('storeNavigation.warehouseTransfers'),
        'store-transfers': t('storeNavigation.storeTransfers'),
        inventory: t('storeNavigation.inventory'),
        reports: t('storeNavigation.reports'),
        settings: t('storeNavigation.settings'),
      };

      if (pageMap[currentPage]) {
        breadcrumbs.push({
          label: pageMap[currentPage],
          href: pathname,
        });
      }
    }

    return breadcrumbs;
  };

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  const handleSearch = (query: string) => {
    console.log('Search query:', query);
    // TODO: Implement search functionality
  };

  const handleNotificationClick = (notification: Notification) => {
    console.log('Notification clicked:', notification);
    // Navigate to relevant page if actionUrl exists
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleSettings = () => {
    console.log('Navigate to settings');
    router.push(`/store/${selectedStoreId}/settings`);
  };

  const handleProfile = () => {
    console.log('Navigate to profile');
    router.push('/intranet/profile');
  };

  const handleLogout = () => {
    console.log('Logout');
    // TODO: Implement logout functionality
    router.push('/login');
  };

  const handleLanguageChange = (language: Language) => {
    console.log('Language changed to:', language);
    setCurrentLanguage(language);
    i18n.changeLanguage(language);
    localStorage.setItem('jowi-language', language);
  };

  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId);
    // Navigate to the same page but for a different store
    const pathSegments = pathname.split('/');
    pathSegments[2] = storeId; // Replace store ID in path
    router.push(pathSegments.join('/'));
  };

  // Get current store name
  const currentStore = mockStores.find(s => s.id === selectedStoreId);

  // Store selector component for sidebar
  const storeSelector = (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground font-medium">
        {t('storeNavigation.currentStore')}
      </p>
      <Select value={selectedStoreId} onValueChange={handleStoreChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {mockStores.map((store) => (
            <SelectItem key={store.id} value={store.id}>
              {store.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  // Custom notification component
  const notificationComponent = (
    <NotificationPanel
      notifications={notifications}
      onNotificationClick={handleNotificationClick}
      onMarkAsRead={handleMarkAsRead}
      onMarkAllAsRead={handleMarkAllAsRead}
      onClearAll={handleClearAll}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      <AppShell
        navItems={navItems}
        currentPath={pathname}
        breadcrumbs={generateBreadcrumbs()}
        user={mockUser}
        currentLanguage={currentLanguage}
        notificationCount={notifications.filter(n => !n.isRead).length}
        sidebarHeader={storeSelector}
        notificationComponent={notificationComponent}
        onNavigate={handleNavigate}
        onSearch={handleSearch}
        onSettingsClick={handleSettings}
        onProfileClick={handleProfile}
        onLanguageChange={handleLanguageChange}
        onLogoutClick={handleLogout}
      >
        {children}
      </AppShell>
    </div>
  );
}
