'use client';

import * as React from 'react';
import { LucideIcon, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSidebar } from './sidebar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export interface NavItem {
  title: string;
  href?: string;
  icon: LucideIcon;
  badge?: string | number;
  children?: NavItem[];
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
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());
  const [openPopover, setOpenPopover] = React.useState<string | null>(null);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load expanded state from localStorage on mount (client-side only)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jowi-sidebar-expanded');
      if (saved) {
        try {
          setExpandedItems(new Set(JSON.parse(saved)));
        } catch (e) {
          console.error('Failed to load sidebar state:', e);
        }
      }
    }
  }, []);

  // Save expanded state to localStorage whenever it changes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jowi-sidebar-expanded', JSON.stringify(Array.from(expandedItems)));
    }
  }, [expandedItems]);

  // Auto-expand parent items if child is active (accordion: only one item at a time)
  React.useEffect(() => {
    const newExpanded = new Set<string>();
    items.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child) => child.href && (currentPath === child.href || currentPath.startsWith(child.href + '/'))
        );
        if (hasActiveChild) {
          // Only add this item, ignore others (accordion behavior)
          newExpanded.add(item.title);
        }
      }
    });
    // Update only if different
    const currentExpandedArray = Array.from(expandedItems);
    const newExpandedArray = Array.from(newExpanded);
    if (currentExpandedArray[0] !== newExpandedArray[0] || currentExpandedArray.length !== newExpandedArray.length) {
      setExpandedItems(newExpanded);
    }
  }, [currentPath, items]);

  const toggleExpanded = (title: string) => {
    const newExpanded = new Set<string>();
    if (!expandedItems.has(title)) {
      // Only expand the clicked item, collapse all others
      newExpanded.add(title);
    }
    // If the item was already expanded, newExpanded stays empty (accordion closes)
    setExpandedItems(newExpanded);
  };

  const handleClick = (href?: string, title?: string, hasChildren?: boolean) => {
    if (hasChildren) {
      // Toggle expansion for parent items
      if (title) {
        toggleExpanded(title);
      }
    } else if (href) {
      // Navigate for items with href
      if (onNavigate) {
        onNavigate(href);
      }
      // Close mobile menu on navigation
      setMobileOpen(false);
    }
  };

  // Handle popover open with cleanup
  const handlePopoverOpen = (itemTitle: string) => {
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenPopover(itemTitle);
  };

  // Handle popover close with delay
  const handlePopoverCloseDelayed = (itemTitle: string) => {
    // Clear any existing timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    // Set a timeout to close the popover
    closeTimeoutRef.current = setTimeout(() => {
      setOpenPopover((current) => current === itemTitle ? null : current);
      closeTimeoutRef.current = null;
    }, 300);
  };

  // Handle popover close immediately
  const handlePopoverClose = () => {
    // Clear any pending timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenPopover(null);
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const isItemActive = (item: NavItem, allItems: NavItem[]): boolean => {
    if (!item.href) return false;

    const isExactMatch = currentPath === item.href;
    const isPrefixMatch = currentPath.startsWith(item.href + '/');

    // Collect all href values from nested structure
    const allHrefs: string[] = [];
    allItems.forEach((navItem) => {
      if (navItem.href) allHrefs.push(navItem.href);
      if (navItem.children) {
        navItem.children.forEach((child) => {
          if (child.href) allHrefs.push(child.href);
        });
      }
    });

    // Find if there's a longer matching item
    const hasLongerMatch = allHrefs.some(
      (otherHref) =>
        otherHref !== item.href &&
        otherHref.startsWith(item.href) &&
        (currentPath === otherHref || currentPath.startsWith(otherHref + '/'))
    );

    return isExactMatch || (isPrefixMatch && !hasLongerMatch);
  };

  const renderNavItem = (item: NavItem, depth: number = 0) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.title);
    const isActive = item.href ? isItemActive(item, items) : false;

    // Check if any child is active
    const hasActiveChild = hasChildren && item.children!.some(
      (child) => child.href && (currentPath === child.href || currentPath.startsWith(child.href + '/'))
    );

    // Render button content
    const buttonContent = (
      <button
        onClick={() => handleClick(item.href, item.title, hasChildren)}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isActive
            ? 'bg-accent text-accent-foreground'
            : hasActiveChild
            ? 'text-foreground'
            : 'text-muted-foreground',
          collapsed && 'justify-center',
          depth > 0 && !collapsed && 'ml-6'
        )}
        title={collapsed ? item.title : undefined}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.title}</span>
            {item.badge !== undefined && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  isExpanded && 'rotate-180'
                )}
              />
            )}
          </>
        )}
      </button>
    );

    // Render children for popover (when collapsed) or inline (when expanded)
    const renderChildren = () => {
      if (!hasChildren) return null;

      return item.children!.map((child) => {
        const ChildIcon = child.icon;
        const isChildActive = child.href ? isItemActive(child, items) : false;

        return (
          <button
            key={child.title}
            onClick={() => {
              handleClick(child.href, child.title, false);
              handlePopoverClose(); // Close popover on navigation
            }}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              !collapsed && 'pl-12',
              isChildActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground'
            )}
          >
            {collapsed && <ChildIcon className="h-4 w-4 shrink-0" />}
            <span className="flex-1 text-left truncate">{child.title}</span>
            {child.badge !== undefined && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                {child.badge}
              </span>
            )}
          </button>
        );
      });
    };

    return (
      <div key={item.title}>
        {/* If collapsed and has children, wrap in Popover */}
        {collapsed && hasChildren ? (
          <Popover
            open={openPopover === item.title}
            onOpenChange={(open) => {
              if (open) {
                handlePopoverOpen(item.title);
              } else {
                handlePopoverClose();
              }
            }}
          >
            <PopoverTrigger asChild>
              <div
                onMouseEnter={() => handlePopoverOpen(item.title)}
                onMouseLeave={() => handlePopoverCloseDelayed(item.title)}
              >
                {buttonContent}
              </div>
            </PopoverTrigger>
            <PopoverContent
              side="right"
              align="start"
              className="w-56 p-2"
              onMouseEnter={() => handlePopoverOpen(item.title)}
              onMouseLeave={handlePopoverClose}
            >
              <div className="space-y-1">
                <div className="px-2 py-1.5 text-sm font-semibold">
                  {item.title}
                </div>
                {renderChildren()}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <>
            {buttonContent}

            {/* Render children inline if expanded and not collapsed */}
            {hasChildren && isExpanded && !collapsed && (
              <div className="mt-1 space-y-1">
                {renderChildren()}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => renderNavItem(item))}
    </nav>
  );
}
