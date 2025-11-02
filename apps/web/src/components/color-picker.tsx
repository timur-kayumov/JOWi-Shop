'use client';

import * as React from 'react';
import { Button, cn } from '@jowi/ui';
import { Check } from 'lucide-react';

export const PRESET_COLORS = [
  { name: 'Синий', value: '#3B82F6' },
  { name: 'Голубой', value: '#06B6D4' },
  { name: 'Зелёный', value: '#10B981' },
  { name: 'Лайм', value: '#84CC16' },
  { name: 'Жёлтый', value: '#F59E0B' },
  { name: 'Оранжевый', value: '#F97316' },
  { name: 'Красный', value: '#EF4444' },
  { name: 'Розовый', value: '#EC4899' },
  { name: 'Фиолетовый', value: '#A855F7' },
  { name: 'Индиго', value: '#6366F1' },
  { name: 'Серый', value: '#6B7280' },
  { name: 'Коричневый', value: '#92400E' },
] as const;

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {PRESET_COLORS.map((color) => {
        const isSelected = value === color.value;
        return (
          <Button
            key={color.value}
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              'h-10 w-10 border-2',
              isSelected && 'ring-2 ring-primary ring-offset-2'
            )}
            style={{ backgroundColor: color.value }}
            onClick={() => onChange(color.value)}
            title={color.name}
          >
            {isSelected && <Check className="h-4 w-4 text-white" />}
          </Button>
        );
      })}
    </div>
  );
}
