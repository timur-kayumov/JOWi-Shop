'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Store, Users, UserCircle, BarChart3, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppShell, NavItem, type Language, type Notification, NotificationPanel, PosDownloadBanner } from '@jowi/ui';

// Mock user data - replace with actual auth later
const mockUser = {
  name: 'Администратор',
  email: 'admin@jowi.uz',
  avatar: undefined,
};

// Mock notifications for intranet - replace with actual API later
const createIntranetMockNotifications = (t: any): Notification[] => [
  {
    id: '1',
    type: 'warning',
    title: t('notifications.testNotifications.lowStock.title'),
    message: t('notifications.testNotifications.lowStock.message'),
    timestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
    isRead: false,
    icon: 'package',
    storeName: 'Центральный магазин',
  },
  {
    id: '2',
    type: 'success',
    title: t('notifications.testNotifications.shiftClosed.title'),
    message: t('notifications.testNotifications.shiftClosed.message'),
    timestamp: new Date(Date.now() - 45 * 60000), // 45 minutes ago
    isRead: false,
    icon: 'money',
    storeName: 'Магазин "Чиланзар"',
  },
  {
    id: '3',
    type: 'error',
    title: t('notifications.testNotifications.fiscalError.title'),
    message: t('notifications.testNotifications.fiscalError.message'),
    timestamp: new Date(Date.now() - 2 * 3600000), // 2 hours ago
    isRead: false,
    icon: 'alert',
    storeName: 'Магазин "Юнусабад"',
  },
  {
    id: '4',
    type: 'info',
    title: t('notifications.testNotifications.newDelivery.title'),
    message: t('notifications.testNotifications.newDelivery.message'),
    timestamp: new Date(Date.now() - 4 * 3600000), // 4 hours ago
    isRead: true,
    icon: 'package',
    storeName: 'Центральный магазин',
  },
  {
    id: '5',
    type: 'info',
    title: t('notifications.testNotifications.newEmployee.title'),
    message: t('notifications.testNotifications.newEmployee.message'),
    timestamp: new Date(Date.now() - 24 * 3600000), // 1 day ago
    isRead: true,
    icon: 'user',
    storeName: 'Магазин "Чиланзар"',
  },
  {
    id: '6',
    type: 'error',
    title: t('notifications.testNotifications.criticalStock.title'),
    message: t('notifications.testNotifications.criticalStock.message'),
    timestamp: new Date(Date.now() - 48 * 3600000), // 2 days ago
    isRead: true,
    icon: 'package',
    storeName: 'Магазин "Юнусабад"',
  },
  {
    id: '7',
    type: 'success',
    title: t('notifications.testNotifications.syncComplete.title'),
    message: t('notifications.testNotifications.syncComplete.message'),
    timestamp: new Date(Date.now() - 72 * 3600000), // 3 days ago
    isRead: true,
    icon: 'settings',
    storeName: 'Центральный магазин',
  },
];

export default function IntranetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, i18n } = useTranslation('common');
  const [currentLanguage, setCurrentLanguage] = useState<Language>('ru');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load saved language on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('jowi-language');
    if (savedLanguage && (savedLanguage === 'ru' || savedLanguage === 'uz')) {
      setCurrentLanguage(savedLanguage as Language);
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  // Initialize notifications
  useEffect(() => {
    setNotifications(createIntranetMockNotifications(t));
  }, [t]);

  // Navigation items with translations
  const navItems: NavItem[] = [
    {
      title: t('navigation.stores'),
      href: '/intranet/stores',
      icon: Store,
    },
    {
      title: t('navigation.employees'),
      href: '/intranet/employees',
      icon: Users,
    },
    {
      title: t('navigation.customers'),
      href: '/intranet/customers',
      icon: UserCircle,
    },
    {
      title: t('navigation.reports'),
      href: '/intranet/reports',
      icon: BarChart3,
    },
    {
      title: t('navigation.subscription'),
      href: '/intranet/subscription',
      icon: CreditCard,
    },
  ];

  // Generate breadcrumbs from pathname with translations
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{
      label: t('navigation.intranet'),
      href: '/intranet/stores'
    }];

    const pathMap: Record<string, string> = {
      stores: t('navigation.stores'),
      employees: t('navigation.employees'),
      customers: t('navigation.customers'),
      reports: t('navigation.reports'),
      subscription: t('navigation.subscription'),
    };

    // Check if we're in employee/customer context (for special breadcrumb handling)
    const isEmployeeContext = pathname.includes('/employees/');
    const isCustomerContext = pathname.includes('/customers/');

    // Build breadcrumbs for each path segment
    let currentPath = '';
    for (let i = 1; i < paths.length; i++) {
      const segment = paths[i];
      currentPath += `/${segment}`;

      // Skip 'intranet' as it's already the root
      if (segment === 'intranet') continue;

      // Check if it's a known page
      if (pathMap[segment]) {
        breadcrumbs.push({
          label: pathMap[segment],
          href: currentPath,
        });
      }
      // Handle dynamic routes (UUIDs or numeric IDs)
      else if (/^[0-9a-f-]+$|^\d+$/.test(segment)) {
        const parent = paths[i - 1];
        if (parent === 'employees') {
          breadcrumbs.push({
            label: 'Детали сотрудника',
            href: currentPath,
          });
        } else if (parent === 'customers') {
          breadcrumbs.push({
            label: 'Детали клиента',
            href: currentPath,
          });
        } else if (parent === 'stores' && !isEmployeeContext && !isCustomerContext) {
          // Only show store details if NOT in employee/customer context
          breadcrumbs.push({
            label: 'Детали магазина',
            href: currentPath,
          });
        }
        // Skip store IDs in employee/customer context
      }
      // Skip 'stores' segment in employee/customer context
      else if (segment === 'stores' && (isEmployeeContext || isCustomerContext)) {
        continue;
      }
      // Handle 'web' or 'pos' access pages
      else if (segment === 'web') {
        breadcrumbs.push({
          label: 'WEB доступ',
          href: currentPath,
        });
      } else if (segment === 'pos') {
        breadcrumbs.push({
          label: 'POS доступ',
          href: currentPath,
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
    // TODO: Implement global search functionality
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
    // TODO: Navigate to settings page
    router.push('/intranet/settings');
  };

  const handleProfile = () => {
    console.log('Navigate to profile');
    // TODO: Navigate to profile page
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

  const handlePosDownload = () => {
    console.log('POS download clicked');
    // TODO: Implement POS app download functionality (e.g., redirect to download page)
    // For now, just log the action
    // Future: router.push('/intranet/pos-download') or window.open('download-url')
  };

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

  // POS download banner in sidebar footer
  const sidebarFooter = (
    <PosDownloadBanner onDownloadClick={handlePosDownload} />
  );

  return (
    <AppShell
      navItems={navItems}
      currentPath={pathname}
      breadcrumbs={generateBreadcrumbs()}
      user={mockUser}
      currentLanguage={currentLanguage}
      notificationCount={notifications.filter(n => !n.isRead).length}
      notificationComponent={notificationComponent}
      sidebarFooter={sidebarFooter}
      onNavigate={handleNavigate}
      onSearch={handleSearch}
      onSettingsClick={handleSettings}
      onProfileClick={handleProfile}
      onLanguageChange={handleLanguageChange}
      onLogoutClick={handleLogout}
    >
      {children}
    </AppShell>
  );
}
