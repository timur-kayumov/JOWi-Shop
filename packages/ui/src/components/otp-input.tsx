'use client';

import * as React from 'react';
import { OTPInput, SlotProps } from 'input-otp';
import { cn } from '../lib/utils';

export interface OTPInputComponentProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: string;
  disabled?: boolean;
}

const OTPInputComponent = React.forwardRef<
  HTMLInputElement,
  OTPInputComponentProps
>(({ value, onChange, length = 6, error, disabled }, ref) => {
  return (
    <div className="w-full">
      <OTPInput
        ref={ref}
        maxLength={length}
        value={value}
        onChange={onChange}
        disabled={disabled}
        containerClassName="flex gap-2 justify-center"
        render={({ slots }) => (
          <>
            {slots.map((slot, idx) => (
              <Slot key={idx} {...slot} hasError={!!error} />
            ))}
          </>
        )}
      />
      {error && (
        <p className="mt-2 text-center text-sm text-destructive">{error}</p>
      )}
    </div>
  );
});

OTPInputComponent.displayName = 'OTPInput';

function Slot(props: SlotProps & { hasError?: boolean }) {
  return (
    <div
      className={cn(
        'relative h-12 w-10 text-[2rem] flex items-center justify-center',
        'border-y border-r border-input rounded-md',
        'transition-all duration-300',
        'first:border-l first:rounded-l-md last:rounded-r-md',
        'group-hover:border-accent-foreground/20',
        'focus-within:border-accent-foreground/20',
        'outline outline-0 outline-accent-foreground/20',
        {
          'outline-2 outline-ring': props.isActive,
          'border-destructive': props.hasError,
        }
      )}
    >
      {props.char !== null && <div>{props.char}</div>}
      {props.hasFakeCaret && <FakeCaret />}
    </div>
  );
}

function FakeCaret() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-px h-6 bg-foreground animate-caret-blink" />
    </div>
  );
}

export { OTPInputComponent as OTPInput };
