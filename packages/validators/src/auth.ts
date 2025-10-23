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
 * Тип бизнеса
 */
export const businessTypeSchema = z.enum(['single_brand', 'multi_brand'], {
  errorMap: () => ({ message: 'Выберите тип бизнеса' }),
});

/**
 * Шаг 1 регистрации: телефон + имя + согласие
 */
export const registerStep1Schema = z.object({
  phone: phoneSchema,
  name: z
    .string()
    .min(2, { message: 'Имя должно содержать минимум 2 символа' })
    .max(100, { message: 'Имя не должно превышать 100 символов' }),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({
      message: 'Необходимо согласиться с условиями использования',
    }),
  }),
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
 */
export const registerSchema = z.object({
  phone: phoneSchema,
  name: z.string().min(2).max(100),
  businessType: businessTypeSchema,
  businessName: z.string().min(2).max(200),
});

/**
 * Шаг 1 входа: телефон
 */
export const loginStep1Schema = z.object({
  phone: phoneSchema,
});

/**
 * Шаг 2 входа: OTP код
 */
export const loginStep2Schema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
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
 * TypeScript типы из схем
 */
export type PhoneSchema = z.infer<typeof phoneSchema>;
export type OtpSchema = z.infer<typeof otpSchema>;
export type BusinessTypeSchema = z.infer<typeof businessTypeSchema>;
export type RegisterStep1Schema = z.infer<typeof registerStep1Schema>;
export type RegisterStep2Schema = z.infer<typeof registerStep2Schema>;
export type RegisterStep3Schema = z.infer<typeof registerStep3Schema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginStep1Schema = z.infer<typeof loginStep1Schema>;
export type LoginStep2Schema = z.infer<typeof loginStep2Schema>;
export type SendOtpSchema = z.infer<typeof sendOtpSchema>;
export type VerifyOtpSchema = z.infer<typeof verifyOtpSchema>;
