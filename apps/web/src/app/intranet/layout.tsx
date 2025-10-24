'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Store, Users, UserCircle, BarChart3 } from 'lucide-react';
import { AppShell, NavItem } from '@jowi/ui';

const navItems: NavItem[] = [
  {
    title: 'Магазины',
    href: '/intranet/stores',
    icon: Store,
  },
  {
    title: 'Сотрудники',
    href: '/intranet/employees',
    icon: Users,
  },
  {
    title: 'Клиенты',
    href: '/intranet/customers',
    icon: UserCircle,
  },
  {
    title: 'Отчёты',
    href: '/intranet/reports',
    icon: BarChart3,
  },
];

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

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Интранет', href: '/intranet/stores' }];

    const pathMap: Record<string, string> = {
      stores: 'Магазины',
      employees: 'Сотрудники',
      customers: 'Клиенты',
      reports: 'Отчёты',
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

  return (
    <AppShell
      navItems={navItems}
      currentPath={pathname}
      breadcrumbs={generateBreadcrumbs()}
      user={mockUser}
      notificationCount={3}
      onNavigate={handleNavigate}
      onSearch={handleSearch}
      onNotificationsClick={handleNotifications}
      onSettingsClick={handleSettings}
      onProfileClick={handleProfile}
      onLogoutClick={handleLogout}
    >
      {children}
    </AppShell>
  );
}
