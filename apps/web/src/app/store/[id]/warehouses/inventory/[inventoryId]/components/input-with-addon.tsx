'use client';

import * as React from 'react';
import { cn } from '@jowi/ui';

export interface InputWithAddonProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  addon?: string;
  variant?: 'default' | 'card';
}

const InputWithAddon = React.forwardRef<HTMLInputElement, InputWithAddonProps>(
  ({ className, addon, variant = 'default', ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className={cn(
            'flex h-10 w-full rounded-lg border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            // Variant styles
            variant === 'default' && 'bg-muted hover:bg-muted-foreground/10',
            variant === 'card' && 'bg-card hover:bg-muted-foreground/5',
            addon && 'pr-12',
            className
          )}
          ref={ref}
          {...props}
        />
        {addon && (
          <span className="absolute right-3 text-sm text-muted-foreground pointer-events-none">
            {addon}
          </span>
        )}
      </div>
    );
  }
);
InputWithAddon.displayName = 'InputWithAddon';

export { InputWithAddon };
