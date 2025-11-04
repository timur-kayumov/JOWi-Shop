import * as React from 'react';
import { cn } from '../lib/utils';

export interface TimeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value?: string;
  onChange?: (value: string) => void;
  variant?: 'default' | 'card';
}

const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  ({ className, variant = 'default', value = '', onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(value);

    React.useEffect(() => {
      setDisplayValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;

      // Remove all non-digit characters
      const digitsOnly = input.replace(/\D/g, '');

      // Limit to 4 digits
      const limitedDigits = digitsOnly.slice(0, 4);

      // Format as HH:MM
      let formatted = '';
      if (limitedDigits.length > 0) {
        // First digit of hours (0-2)
        const firstHourDigit = parseInt(limitedDigits[0]);
        formatted = limitedDigits[0];

        if (limitedDigits.length > 1) {
          // Second digit of hours (if first is 2, max is 3, otherwise 9)
          const secondHourDigit = parseInt(limitedDigits[1]);
          const maxSecondDigit = firstHourDigit === 2 ? 3 : 9;
          formatted += Math.min(secondHourDigit, maxSecondDigit).toString();

          // Add colon automatically after HH
          if (limitedDigits.length > 2) {
            formatted += ':';

            // First digit of minutes (0-5)
            const firstMinuteDigit = parseInt(limitedDigits[2]);
            formatted += Math.min(firstMinuteDigit, 5).toString();

            if (limitedDigits.length > 3) {
              // Second digit of minutes (0-9)
              formatted += limitedDigits[3];
            }
          }
        }
      }

      // Validate complete time (HH must be 00-23)
      if (formatted.length === 5) {
        const hours = parseInt(formatted.slice(0, 2));
        if (hours > 23) {
          formatted = '23:' + formatted.slice(3);
        }
      }

      setDisplayValue(formatted);
      onChange?.(formatted);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter, and arrow keys
      if (
        e.key === 'Backspace' ||
        e.key === 'Delete' ||
        e.key === 'Tab' ||
        e.key === 'Escape' ||
        e.key === 'Enter' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'Home' ||
        e.key === 'End'
      ) {
        return;
      }

      // Allow Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        return;
      }

      // Prevent non-digit input
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    };

    return (
      <input
        type="text"
        inputMode="numeric"
        className={cn(
          'flex h-10 w-full rounded-lg border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          variant === 'default' && 'bg-muted hover:bg-muted/80',
          variant === 'card' && 'bg-card hover:bg-card/80',
          className
        )}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        maxLength={5}
        {...props}
      />
    );
  }
);

TimeInput.displayName = 'TimeInput';

export { TimeInput };
