import * as React from 'react';
import Image from 'next/image';
import { cn } from '../lib/utils';
import { LanguageSwitcher } from './language-switcher';
import { ThemeToggle } from './theme-toggle';

export interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const AuthLayout = React.forwardRef<HTMLDivElement, AuthLayoutProps>(
  ({ children, className }, ref) => {
    return (
      <div ref={ref} className={cn('min-h-screen grid lg:grid-cols-2 relative', className)}>
        {/* Logo in top-left corner */}
        <div className="absolute left-6 top-6 z-50 flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="JOWi Shop"
            width={40}
            height={40}
            className="h-10 w-10"
          />
          <Image
            src="/logo-lettering.svg"
            alt="JOWi Shop"
            width={120}
            height={28}
            className="h-7 dark:brightness-0 dark:invert"
          />
        </div>

        {/* Controls in top-right corner */}
        <div className="absolute right-4 top-4 z-50 flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        {/* Left side - Form content */}
        <div className="flex items-center justify-center p-8 bg-white dark:bg-neutral-950">
          <div className="w-full max-w-md space-y-6">{children}</div>
        </div>

        {/* Right side - Background image and logo */}
        <div className="relative hidden lg:block">
          {/* Background image */}
          <Image
            src="/images/auth/bg.jpg"
            alt="Background"
            fill
            sizes="50vw"
            className="object-cover"
            priority
          />

          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40" />

          {/* Content overlay */}
          <div className="relative z-10 flex h-full flex-col items-center justify-center p-12 text-white">
            {/* Logo */}
            <Image
              src="/images/auth/logo-white.svg"
              alt="JOWi Shop Logo"
              width={88}
              height={88}
              className="mb-6"
            />

            {/* Product description */}
            <div className="text-center">
              <Image
                src="/logo-lettering.svg"
                alt="JOWi Shop"
                width={180}
                height={40}
                className="mb-2 h-10 brightness-0 invert"
              />
              <p className="text-lg text-white/90">Описание продукта</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

AuthLayout.displayName = 'AuthLayout';

export { AuthLayout };
