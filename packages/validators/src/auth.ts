import { z } from 'zod';

/**
 * Валидация номера телефона в формате Узбекистана
 * Формат: +998XXXXXXXXX (998 + 9 цифр)
 */
export const phoneSchema = z
  .string()
  .regex(/^998\d{9}$/, {
    message: 'Номер телефона должен быть в формате +998 XX XXX-XX-XX',
  });

/**
 * Валидация OTP кода (6 цифр)
 */
export const otpSchema = z
  .string()
  .length(6, { message: 'Код должен содержать 6 цифр' })
  .regex(/^\d{6}$/, { message: 'Код должен содержать только цифры' });

/**
 * Валидация пароля
 * Требования:
 * - Минимум 8 символов
 * - Минимум 1 заглавная буква (A-Z или А-Я)
 */
export const passwordSchema = z
  .string()
  .min(8, { message: 'Пароль должен содержать минимум 8 символов' })
  .regex(/[A-ZА-ЯЁ]/, {
    message: 'Пароль должен содержать минимум одну заглавную букву',
  });

/**
 * Тип бизнеса
 */
export const businessTypeSchema = z.enum(['single_brand', 'multi_brand'], {
  errorMap: () => ({ message: 'Выберите тип бизнеса' }),
});

/**
 * Шаг 1 регистрации: телефон + имя + пароль + согласие
 */
export const registerStep1Schema = z
  .object({
    phone: phoneSchema,
    name: z
      .string()
      .min(2, { message: 'Имя должно содержать минимум 2 символа' })
      .max(100, { message: 'Имя не должно превышать 100 символов' }),
    password: passwordSchema,
    confirmPassword: z.string(),
    agreedToTerms: z.literal(true, {
      errorMap: () => ({
        message: 'Необходимо согласиться с условиями использования',
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

/**
 * Шаг 2 регистрации: OTP код
 */
export const registerStep2Schema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});

/**
 * Шаг 3 регистрации: тип бизнеса + название
 */
export const registerStep3Schema = z.object({
  businessType: businessTypeSchema,
  businessName: z
    .string()
    .min(2, { message: 'Название бизнеса должно содержать минимум 2 символа' })
    .max(200, { message: 'Название не должно превышать 200 символов' }),
});

/**
 * Полная схема регистрации (объединение всех шагов)
 * Используется для финального API запроса после прохождения всех шагов регистрации
 */
export const registerSchema = z.object({
  phone: phoneSchema,
  name: z.string().min(2).max(100),
  password: passwordSchema,
  businessType: businessTypeSchema,
  businessName: z.string().min(2).max(200),
});

/**
 * Вход по телефону и паролю
 */
export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, { message: 'Введите пароль' }),
});

/**
 * Отправка OTP кода
 */
export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

/**
 * Проверка OTP кода
 */
export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});

/**
 * Запрос на восстановление пароля (шаг 1)
 */
export const forgotPasswordSchema = z.object({
  phone: phoneSchema,
});

/**
 * Сброс пароля (шаг 3 - после проверки OTP)
 */
export const resetPasswordSchema = z
  .object({
    phone: phoneSchema,
    otp: otpSchema,
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmNewPassword'],
  });

/**
 * TypeScript типы из схем
 */
export type PhoneSchema = z.infer<typeof phoneSchema>;
export type OtpSchema = z.infer<typeof otpSchema>;
export type PasswordSchema = z.infer<typeof passwordSchema>;
export type BusinessTypeSchema = z.infer<typeof businessTypeSchema>;
export type RegisterStep1Schema = z.infer<typeof registerStep1Schema>;
export type RegisterStep2Schema = z.infer<typeof registerStep2Schema>;
export type RegisterStep3Schema = z.infer<typeof registerStep3Schema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type SendOtpSchema = z.infer<typeof sendOtpSchema>;
export type VerifyOtpSchema = z.infer<typeof verifyOtpSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
