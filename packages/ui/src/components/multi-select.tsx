'use client';

import * as React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Checkbox } from './checkbox';
import { Button } from './button';

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  className?: string;
  emptyText?: string;
  selectAllText?: string;
  clearAllText?: string;
}

export function MultiSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Выберите...',
  className,
  emptyText = 'Ничего не выбрано',
  selectAllText = 'Выбрать все',
  clearAllText = 'Снять все',
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onValueChange(newValue);
  };

  const handleSelectAll = () => {
    onValueChange(options.map((opt) => opt.value));
  };

  const handleClearAll = () => {
    onValueChange([]);
  };

  const selectedCount = value.length;
  const allSelected = selectedCount === options.length && options.length > 0;

  const getDisplayText = () => {
    if (selectedCount === 0) {
      return emptyText;
    }
    if (selectedCount === 1) {
      const selected = options.find((opt) => opt.value === value[0]);
      return selected?.label || emptyText;
    }
    return `Выбрано: ${selectedCount}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-[200px] justify-between bg-muted hover:bg-muted-foreground/10',
            className
          )}
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="max-h-[300px] overflow-y-auto">
          {/* Select All / Clear All */}
          {options.length > 0 && (
            <div className="flex items-center justify-between border-b px-3 py-2">
              <button
                type="button"
                onClick={allSelected ? handleClearAll : handleSelectAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {allSelected ? clearAllText : selectAllText}
              </button>
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {/* Options */}
          <div className="p-1">
            {options.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <div
                    key={option.value}
                    className={cn(
                      'relative flex cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
                      isSelected && 'bg-accent/50'
                    )}
                    onClick={() => handleToggle(option.value)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(option.value)}
                      className="mr-2"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="flex-1">{option.label}</span>
                    {isSelected && (
                      <Check className="ml-2 h-4 w-4 text-primary" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
