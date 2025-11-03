'use client';

import * as React from 'react';
import { cn } from '../lib/utils';
import { SidebarProvider, Sidebar, useSidebar } from './sidebar';
import { SidebarNav, NavItem } from './sidebar-nav';
import { TopBar } from './topbar';
import { BreadcrumbItem } from './breadcrumbs';
import { UserMenuProps, Language } from './user-menu';

interface AppShellProps {
  navItems: NavItem[];
  currentPath: string;
  breadcrumbs?: BreadcrumbItem[];
  user: UserMenuProps['user'];
  currentLanguage?: Language;
  notificationCount?: number;
  sidebarHeader?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  notificationComponent?: React.ReactNode;
  onNavigate?: (href: string) => void;
  onSearch?: (query: string) => void;
  onNotificationsClick?: () => void;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
  onLanguageChange?: (language: Language) => void;
  onLogoutClick?: () => void;
  children: React.ReactNode;
}

function AppShellContent({
  navItems,
  currentPath,
  breadcrumbs,
  user,
  currentLanguage,
  notificationCount,
  sidebarHeader,
  sidebarFooter,
  notificationComponent,
  onNavigate,
  onSearch,
  onNotificationsClick,
  onSettingsClick,
  onProfileClick,
  onLanguageChange,
  onLogoutClick,
  children,
}: AppShellProps) {
  const { collapsed } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarHeader={sidebarHeader} sidebarFooter={sidebarFooter}>
        <SidebarNav
          items={navItems}
          currentPath={currentPath}
          onNavigate={onNavigate}
        />
      </Sidebar>

      {/* Main content area */}
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300',
          // Offset for sidebar
          'lg:ml-64',
          collapsed && 'lg:ml-16'
        )}
      >
        {/* Top bar */}
        <TopBar
          breadcrumbs={breadcrumbs}
          onBreadcrumbNavigate={onNavigate}
          onSearch={onSearch}
          notificationCount={notificationCount}
          notificationComponent={notificationComponent}
          onNotificationsClick={onNotificationsClick}
          user={user}
          currentLanguage={currentLanguage}
          onSettingsClick={onSettingsClick}
          onProfileClick={onProfileClick}
          onLanguageChange={onLanguageChange}
          onLogoutClick={onLogoutClick}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppShell(props: AppShellProps) {
  return (
    <SidebarProvider>
      <AppShellContent {...props} />
    </SidebarProvider>
  );
}
