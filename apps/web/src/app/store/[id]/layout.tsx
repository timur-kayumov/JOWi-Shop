'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, Warehouse, BarChart3, Settings, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppShell, NavItem, type Language } from '@jowi/ui';
import {
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
      title: t('storeNavigation.products'),
      href: `/store/${selectedStoreId}/products`,
      icon: Package,
    },
    {
      title: t('storeNavigation.inventory'),
      href: `/store/${selectedStoreId}/inventory`,
      icon: Warehouse,
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

  const handleNotifications = () => {
    console.log('Open notifications');
    // TODO: Implement notifications panel
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

  return (
    <div className="min-h-screen bg-background">
      <AppShell
        navItems={navItems}
        currentPath={pathname}
        breadcrumbs={generateBreadcrumbs()}
        user={mockUser}
        currentLanguage={currentLanguage}
        notificationCount={3}
        sidebarHeader={storeSelector}
        onNavigate={handleNavigate}
        onSearch={handleSearch}
        onNotificationsClick={handleNotifications}
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
