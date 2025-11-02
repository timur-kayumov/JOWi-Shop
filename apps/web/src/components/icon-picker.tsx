'use client';

import * as React from 'react';
import {
  Apple,
  Beef,
  Beer,
  Cake,
  Candy,
  Coffee,
  Cookie,
  Fish,
  IceCream,
  Milk,
  Pizza,
  Salad,
  Soup,
  Wine,
  ShoppingBag,
  Sparkles,
  Wheat,
  Grape,
  Egg,
  CakeSlice,
  type LucideIcon,
} from 'lucide-react';
import { Button, cn } from '@jowi/ui';

export const AVAILABLE_ICONS = {
  Coffee,
  Milk,
  Beef,
  Fish,
  Pizza,
  Salad,
  Soup,
  Beer,
  Wine,
  Apple,
  Grape,
  Cookie,
  Cake,
  CakeSlice,
  Candy,
  IceCream,
  Egg,
  Wheat,
  ShoppingBag,
  Sparkles,
} as const;

export type IconName = keyof typeof AVAILABLE_ICONS;

interface IconPickerProps {
  value?: string;
  onChange: (iconName: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {Object.entries(AVAILABLE_ICONS).map(([name, Icon]) => {
        const isSelected = value === name;
        return (
          <Button
            key={name}
            type="button"
            variant={isSelected ? 'default' : 'outline'}
            size="icon"
            className={cn(
              'h-10 w-10',
              isSelected && 'ring-2 ring-primary ring-offset-2'
            )}
            onClick={() => onChange(name)}
          >
            <Icon className="h-5 w-5" />
          </Button>
        );
      })}
    </div>
  );
}

export function getIconComponent(iconName?: string): LucideIcon {
  if (!iconName || !(iconName in AVAILABLE_ICONS)) {
    return ShoppingBag;
  }
  return AVAILABLE_ICONS[iconName as IconName];
}
