import { z } from 'zod';

// Zod schemas for PaymentType entity
export const CreatePaymentTypeSchema = z.object({
  safeId: z.string().uuid('Некорректный ID сейфа'),
  name: z.string().min(2, 'Минимум 2 символа').max(100, 'Максимум 100 символов'),
  icon: z.string().optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6})$/, 'Цвет должен быть в формате #RRGGBB').optional(),
});

export const UpdatePaymentTypeSchema = CreatePaymentTypeSchema.partial();

export const PaymentTypeFilterSchema = z.object({
  safeId: z.string().uuid().optional(),
  search: z.string().optional(),
});

// TypeScript types
export type CreatePaymentTypeDto = z.infer<typeof CreatePaymentTypeSchema>;
export type UpdatePaymentTypeDto = z.infer<typeof UpdatePaymentTypeSchema>;
export type PaymentTypeFilterDto = z.infer<typeof PaymentTypeFilterSchema>;
