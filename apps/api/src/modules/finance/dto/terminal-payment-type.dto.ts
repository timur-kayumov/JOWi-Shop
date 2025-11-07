import { z } from 'zod';

// Zod schemas for Terminal-PaymentType relationship
export const AssignPaymentTypesToTerminalSchema = z.object({
  paymentTypeIds: z.array(z.string().uuid()).min(1, 'Выберите хотя бы один тип оплаты'),
});

export const RemovePaymentTypeFromTerminalSchema = z.object({
  paymentTypeId: z.string().uuid('Некорректный ID типа оплаты'),
});

// TypeScript types
export type AssignPaymentTypesToTerminalDto = z.infer<typeof AssignPaymentTypesToTerminalSchema>;
export type RemovePaymentTypeFromTerminalDto = z.infer<typeof RemovePaymentTypeFromTerminalSchema>;
