import * as React from 'react';
import { useMask } from '@react-input/mask';
import { cn } from '../lib/utils';

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'defaultValue'> {
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  variant?: 'default' | 'card';
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value = '', onChange, error, variant = 'default', ...props }, ref) => {
    const inputRef = useMask({
      mask: '+998 (__) ___-__-__',
      replacement: { _: /\d/ },
      showMask: true,
      separate: false,
    });

    const processValue = React.useCallback((rawValue: string) => {
      // Extract only the digits from the entire string (includes 998)
      let allDigits = rawValue.replace(/\D/g, '');

      // Handle browser autofill duplicating the country code
      // If we have 998998... (country code duplicated), remove the first 998
      if (allDigits.startsWith('998998')) {
        allDigits = allDigits.slice(3); // Remove first 998
      }

      // Call onChange with all digits (998 + 9 digits = 12 total)
      onChange?.(allDigits.slice(0, 12));
    }, [onChange]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Use setTimeout to let the mask library finish processing
      setTimeout(() => {
        const formattedValue = inputRef.current?.value || '';
        processValue(formattedValue);
      }, 0);
    };

    // Detect and handle browser autofill
    React.useEffect(() => {
      const input = inputRef.current;
      if (!input) return;

      let lastValue = input.value;

      // Check for value changes (autofill detection)
      const checkAutofill = () => {
        if (input.value !== lastValue) {
          lastValue = input.value;
          processValue(input.value);
        }
      };

      // Use polling to detect autofill (browsers don't always trigger events)
      const interval = setInterval(checkAutofill, 100);

      return () => clearInterval(interval);
    }, [processValue]);

    // Sync external value changes to the input
    React.useEffect(() => {
      if (inputRef.current && value !== undefined) {
        // Format the value: expect value to be 998XXXXXXXXX (12 digits total)
        const allDigits = String(value || '').replace(/\D/g, '');

        // Extract the phone digits after 998 prefix
        const phoneDigits = allDigits.substring(0, 3) === '998' ? allDigits.slice(3) : allDigits;

        // Build the formatted string manually to match mask
        let formatted = '+998 ';
        if (phoneDigits.length >= 2) {
          formatted += `(${phoneDigits.slice(0, 2)})`;
        } else if (phoneDigits.length > 0) {
          formatted += `(${phoneDigits}`;
        } else {
          formatted += '(';
        }

        if (phoneDigits.length > 2) {
          formatted += ` ${phoneDigits.slice(2, 5)}`;
        }

        if (phoneDigits.length > 5) {
          formatted += `-${phoneDigits.slice(5, 7)}`;
        }

        if (phoneDigits.length > 7) {
          formatted += `-${phoneDigits.slice(7, 9)}`;
        }

        // Only update if different to avoid cursor issues
        if (inputRef.current.value !== formatted) {
          inputRef.current.value = formatted;
        }
      }
    }, [value]);

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    return (
      <div className="w-full">
        <input
          ref={inputRef}
          type="tel"
          autoComplete="tel"
          onChange={handleChange}
          className={cn(
            'flex h-10 w-full rounded-lg border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            // Variant styles
            variant === 'default' && 'bg-muted hover:bg-muted-foreground/10',
            variant === 'card' && 'bg-card hover:bg-muted-foreground/5',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);
PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
