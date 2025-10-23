'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PhoneInput, OTPInput, Button, Card } from '@jowi/ui';
import {
  loginStep1Schema,
  loginStep2Schema,
  type LoginStep1Schema,
  type LoginStep2Schema,
} from '@jowi/validators';

export default function LoginPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Вход</h1>
          <p className="mt-2 text-muted-foreground">Войдите в свой аккаунт</p>
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {currentStep === 1 && (
            <Step1
              onNext={(data) => {
                setPhoneNumber(data.phone);
                setCurrentStep(2);
              }}
            />
          )}
          {currentStep === 2 && (
            <Step2 phone={phoneNumber} onBack={() => setCurrentStep(1)} />
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Нет аккаунта?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Зарегистрироваться
          </Link>
        </div>
      </Card>
    </div>
  );
}

// Step 1: Phone Input
function Step1({ onNext }: { onNext: (data: LoginStep1Schema) => void }) {
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<LoginStep1Schema>({
    resolver: zodResolver(loginStep1Schema),
    defaultValues: {
      phone: '',
    },
  });

  const phone = watch('phone');

  const onSubmit = async (data: LoginStep1Schema) => {
    // TODO: Call API to send OTP
    console.log('Login Step 1 data:', data);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">С возвращением!</h2>
        <p className="text-sm text-muted-foreground">
          Введите номер телефона для входа
        </p>
      </div>

      <div>
        <label htmlFor="phone" className="mb-2 block text-sm font-medium">
          Номер телефона
        </label>
        <PhoneInput
          id="phone"
          value={phone}
          onChange={(value) => setValue('phone', value)}
          error={errors.phone?.message}
          placeholder="+998 (XX) XXX-XX-XX"
          disabled={isSubmitting}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Отправка...' : 'Продолжить'}
      </Button>
    </form>
  );
}

// Step 2: OTP Verification
function Step2({ phone, onBack }: { phone: string; onBack: () => void }) {
  const {
    handleSubmit,
    formState: { isSubmitting },
    setValue,
    watch,
  } = useForm<LoginStep2Schema>({
    resolver: zodResolver(loginStep2Schema),
    defaultValues: {
      phone,
      otp: '',
    },
  });

  const otp = watch('otp');
  const [resendTimer, setResendTimer] = useState(60);

  const onSubmit = async (data: LoginStep2Schema) => {
    // TODO: Call API to verify OTP and login
    console.log('Login Step 2 data:', data);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

    // Redirect to success page for testing
    window.location.href = '/auth/success';
  };

  const handleResend = async () => {
    // TODO: Call API to resend OTP
    console.log('Resending OTP to:', phone);
    setResendTimer(60);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Подтвердите вход</h2>
        <p className="text-sm text-muted-foreground">
          Введите код из SMS, отправленного на{' '}
          <span className="font-medium text-foreground">
            +{phone.slice(0, 3)} ({phone.slice(3, 5)}) {phone.slice(5, 8)}-
            {phone.slice(8, 10)}-{phone.slice(10)}
          </span>
        </p>
      </div>

      <div>
        <label htmlFor="otp" className="mb-4 block text-center text-sm font-medium">
          Код подтверждения
        </label>
        <OTPInput
          value={otp}
          onChange={(value) => setValue('otp', value)}
          length={6}
        />
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Не получили код?{' '}
        {resendTimer > 0 ? (
          <span>Повторная отправка через {resendTimer} сек</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="font-medium text-primary hover:underline"
          >
            Отправить повторно
          </button>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Назад
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting || otp.length !== 6}>
          {isSubmitting ? 'Вход...' : 'Войти'}
        </Button>
      </div>
    </form>
  );
}
