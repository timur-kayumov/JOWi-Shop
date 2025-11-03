'use client';

import * as React from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './button';

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(
  undefined
);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

interface SidebarProviderProps {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

export function SidebarProvider({
  children,
  defaultCollapsed = false,
}: SidebarProviderProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <SidebarContext.Provider
      value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  sidebarHeader?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
}

export function Sidebar({ children, className, sidebarHeader, sidebarFooter, ...props }: SidebarProps) {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen border-r bg-card transition-all duration-300',
          // Desktop - always visible
          'hidden lg:block',
          collapsed ? 'lg:w-16' : 'lg:w-64',
          // Mobile - only visible when open
          mobileOpen && 'block w-64',
          className
        )}
        {...props}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            {!collapsed ? (
              <div className="flex items-center gap-2">
                <img
                  src="/logo.svg"
                  alt="JOWi Shop Logo"
                  className="h-8 w-8"
                />
                <img
                  src="/logo-lettering.svg"
                  alt="JOWi Shop"
                  className="h-8 dark:invert"
                />
              </div>
            ) : (
              <img
                src="/logo.svg"
                alt="JOWi Shop Logo"
                className="h-8 w-8 mx-auto"
              />
            )}
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Sidebar Header (e.g., store selector) */}
          {sidebarHeader && !collapsed && (
            <div className="border-b p-3">{sidebarHeader}</div>
          )}

          {/* Content */}
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">{children}</div>

          {/* Footer (e.g., POS download banner) */}
          {sidebarFooter && !collapsed && (
            <div className="border-t p-3">{sidebarFooter}</div>
          )}
        </div>
      </aside>
    </>
  );
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { setMobileOpen } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setMobileOpen(true)}
      className={cn('lg:hidden', className)}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
