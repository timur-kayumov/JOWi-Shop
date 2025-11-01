'use client';

import * as React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { SidebarTrigger, useSidebar } from './sidebar';
import { Breadcrumbs, BreadcrumbItem } from './breadcrumbs';
import { SearchBar } from './search-bar';
import { NotificationBadge } from './notification-badge';
import { ThemeToggle } from './theme-toggle';
import { UserMenu, UserMenuProps, Language } from './user-menu';
import { Button } from './button';

interface TopBarProps {
  breadcrumbs?: BreadcrumbItem[];
  onBreadcrumbNavigate?: (href: string) => void;
  onSearch?: (query: string) => void;
  notificationCount?: number;
  notificationComponent?: React.ReactNode;
  onNotificationsClick?: () => void;
  user: UserMenuProps['user'];
  currentLanguage?: Language;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
  onLanguageChange?: (language: Language) => void;
  onLogoutClick?: () => void;
  className?: string;
}

export function TopBar({
  breadcrumbs = [],
  onBreadcrumbNavigate,
  onSearch,
  notificationCount = 0,
  notificationComponent,
  onNotificationsClick,
  user,
  currentLanguage,
  onSettingsClick,
  onProfileClick,
  onLanguageChange,
  onLogoutClick,
  className,
}: TopBarProps) {
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4',
        className
      )}
    >
      {/* Mobile menu trigger */}
      <SidebarTrigger />

      {/* Desktop sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex"
      >
        {collapsed ? (
          <PanelLeftOpen className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
      </Button>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <Breadcrumbs
          items={breadcrumbs}
          onNavigate={onBreadcrumbNavigate}
          className="hidden md:flex"
        />
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search bar */}
      <SearchBar
        onSearch={onSearch}
        placeholder="Поиск..."
        className="hidden w-64 md:block lg:w-80"
      />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {notificationComponent || (
          <NotificationBadge
            count={notificationCount}
            onClick={onNotificationsClick}
          />
        )}
        <ThemeToggle />
        <UserMenu
          user={user}
          currentLanguage={currentLanguage}
          onSettingsClick={onSettingsClick}
          onProfileClick={onProfileClick}
          onLanguageChange={onLanguageChange}
          onLogoutClick={onLogoutClick}
        />
      </div>
    </header>
  );
}
