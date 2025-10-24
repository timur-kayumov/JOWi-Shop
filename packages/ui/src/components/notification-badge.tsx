'use client';

import * as React from 'react';
import { Bell } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './button';

interface NotificationBadgeProps {
  count?: number;
  onClick?: () => void;
  className?: string;
}

export function NotificationBadge({
  count = 0,
  onClick,
  className,
}: NotificationBadgeProps) {
  const hasNotifications = count > 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn('relative', className)}
      title={hasNotifications ? `${count} новых уведомлений` : 'Уведомления'}
    >
      <Bell className="h-5 w-5" />
      {hasNotifications && (
        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Button>
  );
}
