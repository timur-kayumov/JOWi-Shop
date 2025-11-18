'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { PhoneInput, PasswordInput, Button, AuthLayout } from '@jowi/ui';
import { loginSchema, type LoginSchema } from '@jowi/validators';
import { useAuth } from '../../providers/auth-provider';

export default function LoginPage() {
  const { t } = useTranslation('auth');
  const { login } = useAuth();

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginSchema) => {
    try {
      await login(data.phone, data.password);
      // Note: login() handles redirect to /intranet/stores automatically
    } catch (error: any) {
      console.error('Login error:', error);

      // Show error message
      const errorMessage = error?.data?.message || error?.message || t('login.error');
      toast.error(errorMessage);
    }
  };


  return (
    <AuthLayout>
      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{t('login.title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('login.subtitle')}</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Phone Input */}
          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-medium">
              {t('login.phoneLabel')}
            </label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  id="phone"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.phone?.message}
                  placeholder={t('login.phonePlaceholder')}
                  disabled={isSubmitting}
                />
              )}
            />
          </div>

          {/* Password Input */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">
                {t('login.passwordLabel')}
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                {t('login.forgotPassword')}
              </Link>
            </div>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <PasswordInput
                  id="password"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={errors.password?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t('loading.loggingIn') : t('login.loginButton')}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {t('login.noAccount')}{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            {t('login.registerLink')}
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
