'use client';

import * as React from 'react';
import { OTPInput, SlotProps, REGEXP_ONLY_DIGITS } from 'input-otp';
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
        pattern={REGEXP_ONLY_DIGITS}
        containerClassName="flex gap-2"
        render={({ slots }) => (
          <>
            {slots.map((slot, idx) => (
              <React.Fragment key={idx}>
                <Slot {...slot} hasError={!!error} />
                {idx === 2 && (
                  <div className="flex items-center justify-center w-4 text-muted-foreground">
                    —
                  </div>
                )}
              </React.Fragment>
            ))}
          </>
        )}
      />
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
});

OTPInputComponent.displayName = 'OTPInput';

function Slot(props: SlotProps & { hasError?: boolean }) {
  return (
    <div
      className={cn(
        'relative h-[52px] w-10 text-base flex items-center justify-center',
        'border border-input rounded-lg bg-muted',
        'transition-colors',
        'hover:bg-muted-foreground/10',
        'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0',
        {
          'ring-2 ring-ring ring-offset-0': props.isActive,
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
