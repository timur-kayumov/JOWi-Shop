import * as React from 'react';
import { cn } from '../lib/utils';

export interface BusinessTypeCardProps {
  title: string;
  description: string;
  value: string;
  selected: boolean;
  onSelect: (value: string) => void;
  icon?: React.ReactNode;
}

export function BusinessTypeCard({
  title,
  description,
  value,
  selected,
  onSelect,
  icon,
}: BusinessTypeCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        'relative w-full rounded-lg border-2 p-6 text-left transition-all hover:border-primary/50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        {
          'border-primary bg-primary/5': selected,
          'border-muted bg-background': !selected,
        }
      )}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full',
              {
                'bg-primary text-primary-foreground': selected,
                'bg-muted text-muted-foreground': !selected,
              }
            )}
          >
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h3
            className={cn('font-semibold', {
              'text-foreground': selected,
              'text-foreground/90': !selected,
            })}
          >
            {title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {selected && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
      </div>
    </button>
  );
}
