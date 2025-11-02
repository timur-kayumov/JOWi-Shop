'use client';

import * as React from 'react';
import { getIconComponent } from './icon-picker';
import { cn } from '@jowi/ui';

interface CategoryBadgeProps {
  name: string;
  icon?: string;
  color?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CategoryBadge({
  name,
  icon,
  color = '#6B7280',
  className,
  size = 'md',
}: CategoryBadgeProps) {
  const Icon = getIconComponent(icon);

  const sizeClasses = {
    sm: 'gap-1 px-2 py-1 text-xs',
    md: 'gap-1.5 px-2.5 py-1.5 text-sm',
    lg: 'gap-2 px-3 py-2 text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md font-medium',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      <Icon className={iconSizes[size]} />
      <span>{name}</span>
    </div>
  );
}
