import * as React from 'react';
import { cn } from '../lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function Avatar({
  src,
  alt = '',
  fallback,
  size = 'md',
  className,
  ...props
}: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);

  const showFallback = !src || imgError;

  const getFallbackText = () => {
    if (fallback) return fallback;
    if (alt) {
      return alt
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return '?';
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-muted',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {showFallback ? (
        <span className="font-medium text-muted-foreground">
          {getFallbackText()}
        </span>
      ) : (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
}
