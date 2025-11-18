'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  PhoneInput,
  PasswordInput,
  OTPInput,
  BusinessTypeCard,
  Button,
  Input,
  AuthLayout,
  Loader,
} from '@jowi/ui';
import {
  registerStep1Schema,
  registerStep2Schema,
  registerStep3Schema,
  type RegisterStep1Schema,
  type RegisterStep2Schema,
  type RegisterStep3Schema,
} from '@jowi/validators';
import { authApi } from '../../lib/api-client';

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const { t } = useTranslation('auth');

  return (
    <AuthLayout>
      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            {currentStep === 2
              ? t('register.step2.title')
              : currentStep === 3
                ? t('register.step3.title')
                : t('register.title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {currentStep === 2 ? (
              <>
                {t('register.step2.subtitle')}{' '}
                <span className="font-medium text-foreground">
                  +{phoneNumber.slice(0, 3)} ({phoneNumber.slice(3, 5)}) {phoneNumber.slice(5, 8)}-
                  {phoneNumber.slice(8, 10)}-{phoneNumber.slice(10)}
                </span>
              </>
            ) : currentStep === 3 ? (
              t('register.step3.subtitle')
            ) : (
              t('register.subtitle')
            )}
          </p>
        </div>

        {/* Simple Step Indicator */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {t('register.stepIndicator', { current: currentStep, total: 3 })}
          </p>
        </div>

        {/* Step Content */}
        <div>
          {currentStep === 1 && (
            <Step1
              onNext={(data) => {
                setPhoneNumber(data.phone);
                setUserName(data.name);
                setUserPassword(data.password);
                setCurrentStep(2);
              }}
            />
          )}
          {currentStep === 2 && (
            <Step2
              phone={phoneNumber}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}
          {currentStep === 3 && (
            <Step3
              phone={phoneNumber}
              name={userName}
              password={userPassword}
              onBack={() => setCurrentStep(2)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {t('register.hasAccount')}{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t('register.loginLink')}
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

// Step 1: Phone + Name + Agreement
function Step1({ onNext }: { onNext: (data: RegisterStep1Schema) => void }) {
  const { t } = useTranslation('auth');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<RegisterStep1Schema>({
    resolver: zodResolver(registerStep1Schema),
    defaultValues: {
      phone: '',
      name: '',
      password: '',
      confirmPassword: '',
      agreedToTerms: false,
    },
  });

  const phone = watch('phone');
  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  const onSubmit = async (data: RegisterStep1Schema) => {
    try {
      // Send OTP to phone number
      await authApi.sendOtp(data.phone);

      // Show success message
      toast.success(t('register.step1.otpSent'));

      // Move to next step
      onNext(data);
    } catch (error: any) {
      console.error('Send OTP error:', error);

      // Show error message
      const errorMessage = error?.data?.message || error?.message || t('register.step1.otpError');
      toast.error(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="phone" className="mb-2 block text-sm font-medium">
          {t('register.step1.phoneLabel')}
        </label>
        <PhoneInput
          id="phone"
          value={phone}
          onChange={(value) => setValue('phone', value)}
          error={errors.phone?.message}
          placeholder={t('register.step1.phonePlaceholder')}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium">
          {t('register.step1.nameLabel')}
        </label>
        <Input
          id="name"
          {...register('name')}
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium">
          {t('register.step1.passwordLabel')}
        </label>
        <PasswordInput
          id="password"
          value={password}
          onChange={(e) => setValue('password', e.target.value)}
          error={errors.password?.message}
          disabled={isSubmitting}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {t('register.step1.passwordHint')}
        </p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium">
          {t('register.step1.confirmPasswordLabel')}
        </label>
        <PasswordInput
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setValue('confirmPassword', e.target.value)}
          error={errors.confirmPassword?.message}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="terms"
          {...register('agreedToTerms')}
          className="mt-1 h-4 w-4 rounded border-input"
          disabled={isSubmitting}
        />
        <label htmlFor="terms" className="text-sm text-muted-foreground">
          {t('register.step1.termsLabel')}{' '}
          <Link href="/terms" className="text-primary hover:underline">
            {t('register.step1.termsLink')}
          </Link>{' '}
          {t('register.step1.andText')}{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            {t('register.step1.privacyLink')}
          </Link>
        </label>
      </div>
      {errors.agreedToTerms && (
        <p className="text-sm text-destructive">{errors.agreedToTerms.message}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t('loading.sendingCode') : t('register.step1.nextButton')}
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
  onNext: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation(['auth', 'common']);
  const {
    handleSubmit,
    formState: { isSubmitting },
    setValue,
    watch,
  } = useForm<RegisterStep2Schema>({
    resolver: zodResolver(registerStep2Schema),
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

  const onSubmit = async (data: RegisterStep2Schema) => {
    try {
      // Verify OTP code
      await authApi.verifyOtp(data.phone, data.otp);

      // Show success message
      toast.success(t('register.step2.otpVerified'));

      // Move to next step
      onNext();
    } catch (error: any) {
      console.error('Verify OTP error:', error);

      // Show error message
      const errorMessage = error?.data?.message || error?.message || t('register.step2.otpError');
      toast.error(errorMessage);
    }
  };

  const handleResend = async () => {
    try {
      // Resend OTP to phone number
      await authApi.sendOtp(phone);

      // Show success message
      toast.success(t('register.step2.otpResent'));

      // Reset timer
      setResendTimer(60);
    } catch (error: any) {
      console.error('Resend OTP error:', error);

      // Show error message
      const errorMessage = error?.data?.message || error?.message || t('register.step2.resendError');
      toast.error(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="otp" className="mb-4 block text-sm font-medium">
          {t('register.step2.codeLabel')}
        </label>
        <OTPInput
          value={otp}
          onChange={(value) => setValue('otp', value)}
          length={6}
        />
      </div>

      <div className="text-sm text-muted-foreground">
        {t('register.step2.resendText')}{' '}
        {resendTimer > 0 ? (
          <span>{t('register.step2.resendTimer', { seconds: resendTimer })}</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="font-medium text-primary hover:underline"
          >
            {t('register.step2.resendButton')}
          </button>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          {t('actions.back', { ns: 'common' })}
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting || otp.length !== 6}>
          {isSubmitting ? t('loading.verifyingCode') : t('register.step2.verifyButton')}
        </Button>
      </div>
    </form>
  );
}

// Step 3: Business Type + Name
function Step3({
  phone,
  name,
  password,
  onBack,
}: {
  phone: string;
  name: string;
  password: string;
  onBack: () => void;
}) {
  const { t } = useTranslation(['auth', 'common']);
  const [isCreatingBusiness, setIsCreatingBusiness] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<RegisterStep3Schema>({
    resolver: zodResolver(registerStep3Schema),
    defaultValues: {
      businessType: undefined,
      businessName: '',
    },
  });

  const businessType = watch('businessType');

  const onSubmit = async (data: RegisterStep3Schema) => {
    try {
      // Prepare registration data
      const registrationData = {
        phone,
        name,
        password,
        businessType: data.businessType,
        businessName: data.businessName,
      };

      // Show fullscreen loader
      setIsCreatingBusiness(true);

      // Call API to register user
      const response = await authApi.register(registrationData);

      // Show success message
      toast.success(t('register.step3.accountCreated'));

      // Redirect to intranet (response contains accessToken and user data)
      // The middleware will handle the redirect based on auth cookie
      window.location.href = '/intranet/stores';
    } catch (error: any) {
      console.error('Registration error:', error);

      // Hide loader
      setIsCreatingBusiness(false);

      // Show error message
      const errorMessage = error?.data?.message || error?.message || t('register.step3.registrationError');
      toast.error(errorMessage);
    }
  };

  // Show fullscreen loader while creating business
  if (isCreatingBusiness) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center">
        <Image
          src="/logo.svg"
          alt="JOWi Shop"
          width={88}
          height={88}
          className="mb-6 animate-pulse"
        />
        <Loader size="lg" text={t('loading.creatingBusiness')} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="mb-4 block text-sm font-medium">
          {t('register.step3.businessTypeLabel')}
        </label>
        <div className="space-y-3">
          <BusinessTypeCard
            title={t('register.step3.singleBrand.title')}
            description={t('register.step3.singleBrand.description')}
            value="single_brand"
            selected={businessType === 'single_brand'}
            onSelect={(value) => setValue('businessType', value as any)}
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            }
          />
          <BusinessTypeCard
            title={t('register.step3.multiBrand.title')}
            description={t('register.step3.multiBrand.description')}
            value="multi_brand"
            selected={businessType === 'multi_brand'}
            onSelect={(value) => setValue('businessType', value as any)}
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            }
          />
        </div>
        {errors.businessType && (
          <p className="mt-2 text-sm text-destructive">{errors.businessType.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="businessName" className="mb-2 block text-sm font-medium">
          {t('register.step3.businessNameLabel')}
        </label>
        <Input
          id="businessName"
          {...register('businessName')}
          placeholder={t('register.step3.businessNamePlaceholder')}
          disabled={isSubmitting}
        />
        {errors.businessName && (
          <p className="mt-1 text-sm text-destructive">{errors.businessName.message}</p>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          {t('actions.back', { ns: 'common' })}
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? t('loading.creatingAccount') : t('register.step3.createButton')}
        </Button>
      </div>
    </form>
  );
}
