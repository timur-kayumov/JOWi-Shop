'use client';

import * as React from 'react';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from '@jowi/ui';
import { ChevronDown } from 'lucide-react';
import { AVAILABLE_ICONS, getIconComponent, type IconName } from './icon-picker';

interface IconPickerPopoverProps {
  value?: string;
  onChange: (iconName: string) => void;
  label?: string;
}

export function IconPickerPopover({
  value,
  onChange,
  label = 'Выбрать иконку',
}: IconPickerPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const IconComponent = getIconComponent(value);

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
            <IconComponent className="h-4 w-4" />
            <span>{label}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3">
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
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
              >
                <Icon className="h-5 w-5" />
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
