'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Store, Users, UserCircle, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppShell, NavItem, type Language } from '@jowi/ui';

// Mock user data - replace with actual auth later
const mockUser = {
  name: 'Администратор',
  email: 'admin@jowi.uz',
  avatar: undefined,
};

export default function IntranetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, i18n } = useTranslation('common');
  const [currentLanguage, setCurrentLanguage] = useState<Language>('ru');

  // Load saved language on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('jowi-language');
    if (savedLanguage && (savedLanguage === 'ru' || savedLanguage === 'uz')) {
      setCurrentLanguage(savedLanguage as Language);
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

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
    };

    if (paths.length > 1) {
      const currentPage = paths[paths.length - 1];
      if (pathMap[currentPage]) {
        breadcrumbs.push({
          label: pathMap[currentPage],
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
    // TODO: Implement global search functionality
  };

  const handleNotifications = () => {
    console.log('Open notifications');
    // TODO: Implement notifications panel
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

  return (
    <AppShell
      navItems={navItems}
      currentPath={pathname}
      breadcrumbs={generateBreadcrumbs()}
      user={mockUser}
      currentLanguage={currentLanguage}
      notificationCount={3}
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
  );
}
