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
  isActive: z.boolean().default(true),
});

export const updateStoreSchema = createStoreSchema.partial();

// Terminal
export const terminalSettingsSchema = z.object({
  printerConfig: z
    .object({
      type: z.enum(['escpos', 'pdf']),
      width: z.enum([48, 80]),
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
export const createCustomerSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(9).max(20).optional(),
  email: z.string().email().optional(),
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

// Export all schemas
export * from './auth';
export * from './inventory';
