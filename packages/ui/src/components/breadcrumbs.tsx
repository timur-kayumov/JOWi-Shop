import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate?: (href: string) => void;
  className?: string;
}

export function Breadcrumbs({
  items,
  onNavigate,
  className,
}: BreadcrumbsProps) {
  return (
    <nav className={cn('flex items-center gap-1 text-sm', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            {item.href && !isLast ? (
              <a
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigate && item.href) {
                    onNavigate(item.href);
                  }
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <span
                className={cn(
                  isLast ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            )}
            {!isLast && (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
