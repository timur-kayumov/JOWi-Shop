'use client';

import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSidebar } from './sidebar';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface SidebarNavProps {
  items: NavItem[];
  currentPath: string;
  onNavigate?: (href: string) => void;
}

export function SidebarNav({
  items,
  currentPath,
  onNavigate,
}: SidebarNavProps) {
  const { collapsed, setMobileOpen } = useSidebar();

  const handleClick = (href: string) => {
    if (onNavigate) {
      onNavigate(href);
    }
    // Close mobile menu on navigation
    setMobileOpen(false);
  };

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');

        return (
          <a
            key={item.href}
            href={item.href}
            onClick={(e) => {
              e.preventDefault();
              handleClick(item.href);
            }}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground',
              collapsed && 'justify-center'
            )}
            title={collapsed ? item.title : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1">{item.title}</span>
                {item.badge !== undefined && (
                  <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </a>
        );
      })}
    </nav>
  );
}
