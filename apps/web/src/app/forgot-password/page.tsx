'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { PhoneInput, OTPInput, PasswordInput, Button, AuthLayout } from '@jowi/ui';
import {
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  type ForgotPasswordSchema,
  type VerifyOtpSchema,
  type ResetPasswordSchema,
} from '@jowi/validators';
import { CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const { t } = useTranslation('auth');

  return (
    <AuthLayout>
      <div>
        {/* Back to Login Link */}
        <div className="mb-6">
          <Link
            href="/login"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            ← {t('forgotPassword.backToLogin')}
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            {currentStep === 1
              ? t('forgotPassword.title')
              : currentStep === 2
                ? t('forgotPassword.step2.title')
                : currentStep === 3
                  ? t('forgotPassword.step3.title')
                  : t('forgotPassword.success.title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {currentStep === 1
              ? t('forgotPassword.subtitle')
              : currentStep === 2
                ? `${t('forgotPassword.step2.subtitle')} +${phoneNumber.slice(0, 3)} (${phoneNumber.slice(3, 5)}) ${phoneNumber.slice(5, 8)}-${phoneNumber.slice(8, 10)}-${phoneNumber.slice(10)}`
                : currentStep === 3
                  ? t('forgotPassword.step3.subtitle')
                  : t('forgotPassword.success.subtitle')}
          </p>
        </div>

        {/* Step Content */}
        <div>
          {currentStep === 1 && (
            <Step1
              onNext={(data) => {
                setPhoneNumber(data.phone);
                setCurrentStep(2);
              }}
            />
          )}
          {currentStep === 2 && (
            <Step2
              phone={phoneNumber}
              onNext={(data) => {
                setOtpCode(data.otp);
                setCurrentStep(3);
              }}
              onBack={() => setCurrentStep(1)}
            />
          )}
          {currentStep === 3 && (
            <Step3
              phone={phoneNumber}
              otp={otpCode}
              onSuccess={() => setCurrentStep(4)}
              onBack={() => setCurrentStep(2)}
            />
          )}
          {currentStep === 4 && <SuccessStep />}
        </div>
      </div>
    </AuthLayout>
  );
}

// Step 1: Phone Input
function Step1({ onNext }: { onNext: (data: ForgotPasswordSchema) => void }) {
  const { t } = useTranslation('auth');
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      phone: '',
    },
  });

  const phone = watch('phone');

  const onSubmit = async (data: ForgotPasswordSchema) => {
    try {
      // TODO: Call API to send password reset OTP
      console.log('Forgot password step 1 data:', data);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      onNext(data);
    } catch (error) {
      console.error('Send OTP error:', error);
      // TODO: Show error toast
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="phone" className="mb-2 block text-sm font-medium">
          {t('forgotPassword.step1.phoneLabel')}
        </label>
        <PhoneInput
          id="phone"
          value={phone}
          onChange={(value) => setValue('phone', value)}
          error={errors.phone?.message}
          placeholder={t('forgotPassword.step1.phonePlaceholder')}
          disabled={isSubmitting}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t('loading.sendingResetCode') : t('forgotPassword.step1.sendCodeButton')}
      </Button>
    </form>
  );
}

// Step 2: OTP Verification
function Step2({
  phone,
  onNext,
  onBack,
}: {
  phone: string;
  onNext: (data: VerifyOtpSchema) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation(['auth', 'common']);
  const {
    handleSubmit,
    formState: { isSubmitting },
    setValue,
    watch,
  } = useForm<VerifyOtpSchema>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      phone,
      otp: '',
    },
  });

  const otp = watch('otp');
  const [resendTimer, setResendTimer] = useState(60);

  // Countdown timer effect
  React.useEffect(() => {
    if (resendTimer > 0) {
      const timerId = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timerId);
    }
  }, [resendTimer]);

  const onSubmit = async (data: VerifyOtpSchema) => {
    try {
      // TODO: Call API to verify password reset OTP
      console.log('Forgot password step 2 data:', data);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      onNext(data);
    } catch (error) {
      console.error('Verify OTP error:', error);
      // TODO: Show error toast
    }
  };

  const handleResend = async () => {
    // TODO: Call API to resend password reset OTP
    console.log('Resending password reset OTP to:', phone);
    setResendTimer(60);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="otp" className="mb-4 block text-sm font-medium">
          {t('forgotPassword.step2.codeLabel')}
        </label>
        <OTPInput value={otp} onChange={(value) => setValue('otp', value)} length={6} />
      </div>

      <div className="text-sm text-muted-foreground">
        {t('forgotPassword.step2.resendText')}{' '}
        {resendTimer > 0 ? (
          <span>{t('forgotPassword.step2.resendTimer', { seconds: resendTimer })}</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="font-medium text-primary hover:underline"
          >
            {t('forgotPassword.step2.resendButton')}
          </button>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          {t('actions.back', { ns: 'common' })}
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting || otp.length !== 6}>
          {isSubmitting ? t('loading.verifyingCode') : t('forgotPassword.step2.verifyButton')}
        </Button>
      </div>
    </form>
  );
}

// Step 3: New Password
function Step3({
  phone,
  otp,
  onSuccess,
  onBack,
}: {
  phone: string;
  otp: string;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation(['auth', 'common']);
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      phone,
      otp,
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const newPassword = watch('newPassword');
  const confirmNewPassword = watch('confirmNewPassword');

  const onSubmit = async (data: ResetPasswordSchema) => {
    try {
      // TODO: Call API to reset password
      console.log('Forgot password step 3 data:', data);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      onSuccess();
    } catch (error) {
      console.error('Reset password error:', error);
      // TODO: Show error toast
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="newPassword" className="mb-2 block text-sm font-medium">
          {t('forgotPassword.step3.passwordLabel')}
        </label>
        <PasswordInput
          id="newPassword"
          value={newPassword}
          onChange={(e) => setValue('newPassword', e.target.value)}
          error={errors.newPassword?.message}
          disabled={isSubmitting}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {t('forgotPassword.step3.passwordHint')}
        </p>
      </div>

      <div>
        <label htmlFor="confirmNewPassword" className="mb-2 block text-sm font-medium">
          {t('forgotPassword.step3.confirmPasswordLabel')}
        </label>
        <PasswordInput
          id="confirmNewPassword"
          value={confirmNewPassword}
          onChange={(e) => setValue('confirmNewPassword', e.target.value)}
          error={errors.confirmNewPassword?.message}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          {t('actions.back', { ns: 'common' })}
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? t('loading.resettingPassword') : t('forgotPassword.step3.resetButton')}
        </Button>
      </div>
    </form>
  );
}

// Success Step
function SuccessStep() {
  const { t } = useTranslation('auth');
  const router = useRouter();

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>

      <p className="text-sm text-muted-foreground">{t('forgotPassword.success.message')}</p>

      <Button
        onClick={() => router.push('/login')}
        className="w-full"
      >
        {t('forgotPassword.success.loginButton')}
      </Button>
    </div>
  );
}
