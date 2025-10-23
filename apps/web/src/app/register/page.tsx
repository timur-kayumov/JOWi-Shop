'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  PhoneInput,
  OTPInput,
  StepIndicator,
  BusinessTypeCard,
  Button,
  Input,
  Card,
} from '@jowi/ui';
import {
  registerStep1Schema,
  registerStep2Schema,
  registerStep3Schema,
  type RegisterStep1Schema,
  type RegisterStep2Schema,
  type RegisterStep3Schema,
} from '@jowi/validators';

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState('');

  const steps = [
    { label: 'Телефон', description: 'Введите данные' },
    { label: 'Подтверждение', description: 'Код из SMS' },
    { label: 'Бизнес', description: 'О вашем бизнесе' },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Регистрация</h1>
          <p className="mt-2 text-muted-foreground">
            Создайте аккаунт для управления вашим бизнесом
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 1 && (
            <Step1
              onNext={(data) => {
                setPhoneNumber(data.phone);
                setUserName(data.name);
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
              onBack={() => setCurrentStep(2)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Войти
          </Link>
        </div>
      </Card>
    </div>
  );
}

// Step 1: Phone + Name + Agreement
function Step1({ onNext }: { onNext: (data: RegisterStep1Schema) => void }) {
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
      agreedToTerms: false,
    },
  });

  const phone = watch('phone');

  const onSubmit = async (data: RegisterStep1Schema) => {
    // TODO: Call API to send OTP
    console.log('Step 1 data:', data);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Добро пожаловать!</h2>
        <p className="text-sm text-muted-foreground">
          Введите ваши данные для регистрации
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

      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium">
          Ваше имя
        </label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Введите ваше имя"
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
        )}
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
          Я согласен с{' '}
          <Link href="/terms" className="text-primary hover:underline">
            условиями использования
          </Link>{' '}
          и{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            политикой конфиденциальности
          </Link>
        </label>
      </div>
      {errors.agreedToTerms && (
        <p className="text-sm text-destructive">{errors.agreedToTerms.message}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Отправка...' : 'Продолжить'}
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

  const onSubmit = async (data: RegisterStep2Schema) => {
    // TODO: Call API to verify OTP
    console.log('Step 2 data:', data);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
    onNext();
  };

  const handleResend = async () => {
    // TODO: Call API to resend OTP
    console.log('Resending OTP to:', phone);
    setResendTimer(60);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Подтвердите номер</h2>
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
          {isSubmitting ? 'Проверка...' : 'Подтвердить'}
        </Button>
      </div>
    </form>
  );
}

// Step 3: Business Type + Name
function Step3({
  phone,
  name,
  onBack,
}: {
  phone: string;
  name: string;
  onBack: () => void;
}) {
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
    // TODO: Call API to create account
    const fullData = {
      phone,
      name,
      ...data,
    };
    console.log('Registration data:', fullData);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

    // Redirect to success page
    window.location.href = '/auth/success';
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Расскажите о вашем бизнесе</h2>
        <p className="text-sm text-muted-foreground">
          Эта информация поможет настроить систему под вас
        </p>
      </div>

      <div>
        <label className="mb-4 block text-sm font-medium">
          Какой у вас тип бизнеса?
        </label>
        <div className="space-y-3">
          <BusinessTypeCard
            title="Сеть магазинов с одинаковым названием"
            description="Все ваши магазины работают под одним брендом"
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
            title="Сеть магазинов с разным названием"
            description="У вас несколько разных брендов или франшиз"
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
          Название бизнеса
        </label>
        <Input
          id="businessName"
          {...register('businessName')}
          placeholder="Введите название вашего бизнеса"
          disabled={isSubmitting}
        />
        {errors.businessName && (
          <p className="mt-1 text-sm text-destructive">{errors.businessName.message}</p>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Назад
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? 'Создание аккаунта...' : 'Создать аккаунт'}
        </Button>
      </div>
    </form>
  );
}
