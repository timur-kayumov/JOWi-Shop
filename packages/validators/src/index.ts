/**
 * @jowi/validators - Zod schemas for API validation
 */

import { z } from 'zod';

// Common schemas
export const currencySchema = z.literal('UZS');
export const localeSchema = z.enum(['ru', 'uz']);
export const userRoleSchema = z.enum(['admin', 'manager', 'cashier', 'warehouse']);
export const paymentMethodSchema = z.enum(['cash', 'card', 'transfer', 'installment']);

// Pagination
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// Auth
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
  businessName: z.string().min(2).max(200),
  taxId: z.string().optional(),
  locale: localeSchema.default('ru'),
});

export const sendOtpSchema = z.object({
  phone: z.string().min(9).max(20),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(9).max(20),
  otp: z.string().length(6),
});

// Registration multi-step schemas
export const registerStep1Schema = z.object({
  phone: z.string().min(12, 'Введите корректный номер телефона'),
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа').max(100),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: 'Необходимо согласиться с условиями',
  }),
});

export const registerStep2Schema = z.object({
  phone: z.string().min(12),
  otp: z.string().length(6, 'Код должен содержать 6 цифр'),
});

export const registerStep3Schema = z.object({
  businessType: z.enum(['single_brand', 'multi_brand'], {
    errorMap: () => ({ message: 'Выберите тип бизнеса' }),
  }),
  businessName: z.string().min(2, 'Название должно содержать минимум 2 символа').max(200),
});

// Login multi-step schemas
export const loginStep1Schema = z.object({
  phone: z.string().min(12, 'Введите корректный номер телефона'),
});

export const loginStep2Schema = z.object({
  phone: z.string().min(12),
  otp: z.string().length(6, 'Код должен содержать 6 цифр'),
});

// TypeScript types for the schemas
export type RegisterStep1Schema = z.infer<typeof registerStep1Schema>;
export type RegisterStep2Schema = z.infer<typeof registerStep2Schema>;
export type RegisterStep3Schema = z.infer<typeof registerStep3Schema>;
export type LoginStep1Schema = z.infer<typeof loginStep1Schema>;
export type LoginStep2Schema = z.infer<typeof loginStep2Schema>;

// Business
export const createBusinessSchema = z.object({
  name: z.string().min(2).max(200),
  taxId: z.string().min(9).max(20),
  currency: currencySchema.default('UZS'),
  locale: localeSchema.default('ru'),
});

export const updateBusinessSchema = createBusinessSchema.partial();

// Store
export const createStoreSchema = z.object({
  name: z.string().min(2).max(200),
  address: z.string().min(5).max(500),
  phone: z.string().min(9).max(20),
  country: z.string().min(2).max(100).default('Uzbekistan'),
  city: z.string().min(2).max(100),
  logoUrl: z.string().url().optional(),
  shiftTransitionTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Время должно быть в формате HH:MM')
    .default('00:00'),
  isActive: z.boolean().default(true),
});

export const updateStoreSchema = createStoreSchema.partial();

// Terminal
export const terminalSettingsSchema = z.object({
  printerConfig: z
    .object({
      type: z.enum(['escpos', 'pdf']),
      width: z.union([z.literal(48), z.literal(80)]),
      encoding: z.enum(['utf8', 'cp866']),
    })
    .optional(),
  scannerEnabled: z.boolean().default(true),
  touchMode: z.boolean().default(true),
  hotkeysEnabled: z.boolean().default(true),
});

export const createTerminalSchema = z.object({
  name: z.string().min(2).max(100),
  deviceId: z.string().min(1),
  storeId: z.string().uuid(),
  fiscalProviderId: z.string().optional(),
  settings: terminalSettingsSchema.default({}),
  isActive: z.boolean().default(true),
});

export const updateTerminalSchema = createTerminalSchema.partial();

// Product
export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  categoryId: z.string().uuid().optional(),
  taxRate: z.number().min(0).max(100),
  isActive: z.boolean().default(true),
  hasVariants: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial();

// Product Variant
export const createVariantSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  barcode: z.string().max(100).optional(),
  price: z.number().positive(),
  cost: z.number().positive().optional(),
  unit: z.string().min(1).max(20).default('шт'),
  attributes: z.record(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export const updateVariantSchema = createVariantSchema.partial().omit({ productId: true });

// Category
export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().uuid().optional(),
  sortOrder: z.number().int().default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

// Receipt
export const createReceiptItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().positive(),
  price: z.number().positive(),
  discountAmount: z.number().min(0).default(0),
});

export const createReceiptSchema = z.object({
  terminalId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  items: z.array(createReceiptItemSchema).min(1),
  payments: z
    .array(
      z.object({
        method: paymentMethodSchema,
        amount: z.number().positive(),
        reference: z.string().optional(),
      })
    )
    .min(1),
});

// Customer
export const genderSchema = z.enum(['male', 'female', 'other']);

export const createCustomerSchema = z.object({
  firstName: z.string().min(2, 'Имя должно содержать минимум 2 символа').max(100),
  lastName: z.string().min(2, 'Фамилия должна содержать минимум 2 символа').max(100),
  phone: z.string().min(9).max(20),
  email: z.string().email().optional(),
  gender: genderSchema.optional(),
  dateOfBirth: z.date().optional(),
  loyaltyCardNumber: z.string().max(50).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// Shift
export const openShiftSchema = z.object({
  terminalId: z.string().uuid(),
  employeeId: z.string().uuid(),
  openingCash: z.number().min(0),
});

export const closeShiftSchema = z.object({
  shiftId: z.string().uuid(),
  closingCash: z.number().min(0),
});

// Cash Operation
export const cashOperationSchema = z.object({
  shiftId: z.string().uuid(),
  type: z.enum(['in', 'out']),
  amount: z.number().positive(),
  reason: z.string().min(2).max(500),
});

// Employee
export const createEmployeeSchema = z.object({
  firstName: z.string().min(2, 'Имя должно содержать минимум 2 символа').max(100),
  lastName: z.string().min(2, 'Фамилия должна содержать минимум 2 символа').max(100),
  phone: z.string().min(9).max(20),
  email: z.string().email(),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
  role: userRoleSchema,
  storeId: z.string().uuid(),
  citizenship: z.string().min(2).max(100),
  passportSeries: z.string().min(1).max(10),
  passportNumber: z.string().min(1).max(20),
  pin: z.string().length(4).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().omit({ password: true });

// Permissions
export const permissionResourceSchema = z.enum([
  'stores',
  'customers',
  'employees',
  'reports',
  'products',
  'inventory',
  'finance',
  'settings',
]);

export const permissionActionSchema = z.enum(['view', 'create', 'update', 'delete', 'manage']);

export const createPermissionSchema = z.object({
  name: z.string().min(3).max(100),
  resource: permissionResourceSchema,
  action: permissionActionSchema,
  description: z.string().max(500).optional(),
});

export const userPermissionSchema = z.object({
  userId: z.string().uuid(),
  permissionId: z.string().uuid(),
  allowed: z.boolean().default(true),
});

export const storeAccessSchema = z.object({
  userId: z.string().uuid(),
  storeId: z.string().uuid(),
  permissions: z.record(z.boolean()).default({}),
});

// Export TypeScript types
export type CreateStoreSchema = z.infer<typeof createStoreSchema>;
export type UpdateStoreSchema = z.infer<typeof updateStoreSchema>;
export type CreateCustomerSchema = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerSchema = z.infer<typeof updateCustomerSchema>;
export type CreateEmployeeSchema = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeSchema = z.infer<typeof updateEmployeeSchema>;
export type Gender = z.infer<typeof genderSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type PermissionResource = z.infer<typeof permissionResourceSchema>;
export type PermissionAction = z.infer<typeof permissionActionSchema>;

// Export all schemas
// TODO: Add auth and inventory schema modules when needed
// export * from './auth';
// export * from './inventory';
