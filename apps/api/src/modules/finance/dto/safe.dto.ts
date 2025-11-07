import { z } from 'zod';

// Zod schemas for Safe entity
export const SafeTypeEnum = z.enum(['cash', 'bank_account', 'card_account']);

export const CreateSafeSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа').max(100, 'Максимум 100 символов'),
  type: SafeTypeEnum,
  accountNumber: z.string().optional(),
  balance: z.number().default(0),
  isActive: z.boolean().default(true),
});

export const UpdateSafeSchema = CreateSafeSchema.partial();

export const SafeFilterSchema = z.object({
  type: SafeTypeEnum.optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
});

// TypeScript types
export type CreateSafeDto = z.infer<typeof CreateSafeSchema>;
export type UpdateSafeDto = z.infer<typeof UpdateSafeSchema>;
export type SafeFilterDto = z.infer<typeof SafeFilterSchema>;
export type SafeType = z.infer<typeof SafeTypeEnum>;
