'use client';

import * as React from 'react';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from '@jowi/ui';
import { Check, ChevronDown } from 'lucide-react';
import { PRESET_COLORS } from './color-picker';

interface ColorPickerPopoverProps {
  value?: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPickerPopover({
  value,
  onChange,
  label = 'Выбрать цвет',
}: ColorPickerPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const selectedColor = PRESET_COLORS.find((c) => c.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full border-2 border-gray-300"
              style={{ backgroundColor: value || '#3B82F6' }}
            />
            <span>{selectedColor?.name || label}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3">
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
                onClick={() => {
                  onChange(color.value);
                  setOpen(false);
                }}
                title={color.name}
              >
                {isSelected && <Check className="h-4 w-4 text-white" />}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
