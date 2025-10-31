'use client';

import * as React from 'react';
import {
  Bell,
  X,
  CheckCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Package,
  DollarSign,
  User,
  Settings,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '../lib/utils';
import { Button } from './button';
import { Badge } from './badge';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  icon?: 'package' | 'money' | 'user' | 'settings' | 'alert';
  storeName?: string;
}

interface NotificationPanelProps {
  notifications: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onClearAll?: () => void;
  className?: string;
}

const getNotificationIcon = (notification: Notification) => {
  if (notification.icon) {
    switch (notification.icon) {
      case 'package':
        return Package;
      case 'money':
        return DollarSign;
      case 'user':
        return User;
      case 'settings':
        return Settings;
      case 'alert':
        return AlertTriangle;
    }
  }

  switch (notification.type) {
    case 'success':
      return CheckCircle2;
    case 'error':
      return XCircle;
    case 'warning':
      return AlertTriangle;
    default:
      return Info;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'text-green-600 bg-green-100';
    case 'error':
      return 'text-red-600 bg-red-100';
    case 'warning':
      return 'text-orange-600 bg-orange-100';
    default:
      return 'text-blue-600 bg-blue-100';
  }
};

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Только что';
  if (minutes < 60) return `${minutes} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  if (days < 7) return `${days} д назад`;

  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

export function NotificationPanel({
  notifications,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  className,
}: NotificationPanelProps) {
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = React.useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter(n => !n.isRead);
    }
    return notifications;
  }, [notifications, filter]);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          title={unreadCount > 0 ? `${unreadCount} новых уведомлений` : 'Уведомления'}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 w-96 rounded-2xl border bg-card p-0 shadow-lg"
          sideOffset={8}
          align="end"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="font-semibold text-lg">Уведомления</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMarkAllAsRead}
                  className="h-8 text-xs"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Прочитать все
                </Button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b px-4 py-2">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              Все ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                filter === 'unread'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              Непрочитанные ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  {filter === 'unread' ? 'Нет непрочитанных уведомлений' : 'Нет уведомлений'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification);
                const colorClass = getNotificationColor(notification.type);

                return (
                  <DropdownMenu.Item
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-3 p-4 cursor-pointer outline-none transition-colors border-b last:border-b-0',
                      !notification.isRead && 'bg-blue-50/50',
                      'hover:bg-muted focus:bg-muted'
                    )}
                    onSelect={() => {
                      if (onNotificationClick) {
                        onNotificationClick(notification);
                      }
                      if (!notification.isRead && onMarkAsRead) {
                        onMarkAsRead(notification.id);
                      }
                    }}
                  >
                    {/* Icon */}
                    <div className={cn('p-2 rounded-lg flex-shrink-0', colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-semibold line-clamp-1">
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.timestamp)}
                        </span>
                        {notification.storeName && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground font-medium">
                              {notification.storeName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </DropdownMenu.Item>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="w-full justify-center text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="h-4 w-4 mr-1" />
                Очистить все
              </Button>
            </div>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
