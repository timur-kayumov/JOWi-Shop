import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: string;
  variant?: 'default' | 'card';
  showToggle?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, variant = 'default', showToggle = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <div className="w-full">
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            className={cn(
              'flex h-10 w-full rounded-lg border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
              // Variant styles
              variant === 'default' && 'bg-muted hover:bg-muted-foreground/10',
              variant === 'card' && 'bg-card hover:bg-muted-foreground/5',
              error && 'border-destructive focus-visible:ring-destructive',
              showToggle && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          {showToggle && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="sr-only">
                {showPassword ? 'Hide password' : 'Show password'}
              </span>
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
