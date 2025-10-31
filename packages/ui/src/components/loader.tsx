import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';
import './loader.css';

const loaderVariants = cva('loader-5', {
  variants: {
    size: {
      sm: 'loader-sm',
      default: '',
      lg: 'loader-lg',
      xl: 'loader-xl',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

export interface LoaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loaderVariants> {
  text?: string;
  fullScreen?: boolean;
}

const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
  ({ className, size, text, fullScreen = false, ...props }, ref) => {
    const content = (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center gap-3',
          fullScreen && 'min-h-screen',
          className
        )}
        {...props}
      >
        <div className={cn(loaderVariants({ size }))}>
          <span></span>
        </div>
        {text && (
          <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
        )}
      </div>
    );

    return content;
  }
);

Loader.displayName = 'Loader';

export { Loader, loaderVariants };
