import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

// ==================== INPUT GROUP ====================

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'relative flex items-stretch overflow-hidden rounded-lg border bg-muted transition-colors',
        'has-[[data-slot="input-group-control"]:focus-visible]:ring-2',
        'has-[[data-slot="input-group-control"]:focus-visible]:ring-ring',
        'has-[[data-slot="input-group-control"]:focus-visible]:ring-offset-0',
        className
      )}
      {...props}
    />
  );
});
InputGroup.displayName = 'InputGroup';

// ==================== INPUT GROUP INPUT ====================

export interface InputGroupInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  asChild?: boolean;
}

const InputGroupInput = React.forwardRef<HTMLInputElement, InputGroupInputProps>(
  ({ className, type, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'input';
    return (
      <Comp
        type={type}
        data-slot="input-group-control"
        className={cn(
          'flex h-10 w-full border-0 bg-transparent pl-3 pr-0 py-2 text-sm text-left ring-offset-background',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
InputGroupInput.displayName = 'InputGroupInput';

// ==================== INPUT GROUP TEXTAREA ====================

export interface InputGroupTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  asChild?: boolean;
}

const InputGroupTextarea = React.forwardRef<
  HTMLTextAreaElement,
  InputGroupTextareaProps
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'textarea';
  return (
    <Comp
      data-slot="input-group-control"
      className={cn(
        'flex min-h-[80px] w-full border-0 bg-transparent px-3 py-2 text-sm',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
InputGroupTextarea.displayName = 'InputGroupTextarea';

// ==================== INPUT GROUP ADDON ====================

const inputGroupAddonVariants = cva('flex items-center whitespace-nowrap', {
  variants: {
    align: {
      'inline-start': 'border-r',
      'inline-end': 'border-l',
      'block-start': 'border-b',
      'block-end': 'border-t',
    },
  },
  defaultVariants: {
    align: 'inline-start',
  },
});

export interface InputGroupAddonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof inputGroupAddonVariants> {
  asChild?: boolean;
}

const InputGroupAddon = React.forwardRef<HTMLDivElement, InputGroupAddonProps>(
  ({ className, align, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div';
    return (
      <Comp
        ref={ref}
        className={cn(inputGroupAddonVariants({ align }), className)}
        {...props}
      />
    );
  }
);
InputGroupAddon.displayName = 'InputGroupAddon';

// ==================== INPUT GROUP TEXT ====================

const InputGroupText = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center px-3 text-sm text-muted-foreground',
        className
      )}
      {...props}
    />
  );
});
InputGroupText.displayName = 'InputGroupText';

// ==================== INPUT GROUP BUTTON ====================

const inputGroupButtonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        xs: 'h-7 px-2',
        'icon-xs': 'h-7 w-7',
        sm: 'h-8 px-3',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'xs',
    },
  }
);

export interface InputGroupButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof inputGroupButtonVariants> {
  asChild?: boolean;
}

const InputGroupButton = React.forwardRef<
  HTMLButtonElement,
  InputGroupButtonProps
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      className={cn(inputGroupButtonVariants({ variant, size }), className)}
      {...props}
    />
  );
});
InputGroupButton.displayName = 'InputGroupButton';

// ==================== EXPORTS ====================

export {
  InputGroup,
  InputGroupInput,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupText,
  InputGroupButton,
};
