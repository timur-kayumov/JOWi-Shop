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

// Auth schemas are now in ./auth.ts and exported at the bottom of this file

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
    .or(z.literal(''))
    .transform((val) => (val === '' ? '00:00' : val)),
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
export const productSourceTypeSchema = z.enum(['manual', 'nomenclature']);

export const createProductSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(200),
  description: z.string().max(1000).optional(),
  categoryId: z.string().uuid('Выберите категорию'),
  taxRate: z.number().min(0).max(100).default(0),
  imageUrl: z.string().url().optional(),
  sourceType: productSourceTypeSchema.default('manual'),
  isActive: z.boolean().default(true),
  hasVariants: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial();

// Product Variant
export const createVariantSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().min(1, 'SKU обязателен').max(50),
  name: z.string().min(1, 'Название обязательно').max(200),
  barcode: z.string().max(100).optional(),
  price: z.number().positive('Цена должна быть положительной'),
  cost: z.number().positive('Себестоимость должна быть положительной').optional(),
  unit: z.string().min(1).max(20).default('шт'),
  imageUrl: z.string().url().optional(),
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

// Receipt status
export const receiptStatusSchema = z.enum(['draft', 'completed', 'refunded', 'partially_refunded']);

// Receipt filters with pagination
export const getCustomerReceiptsSchema = z.object({
  customerId: z.string(), // Temporarily removed .uuid() for mock data compatibility
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(50).default(10),
  search: z.string().optional(), // search by receipt number
  storeId: z.string().optional(), // Temporarily removed .uuid() for mock data compatibility
  paymentMethod: paymentMethodSchema.optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

// Refund schemas
export const refundReceiptItemSchema = z.object({
  receiptItemId: z.string().uuid(),
  quantity: z.number().positive(),
  reason: z.string().max(500).optional(),
});

export const refundReceiptSchema = z.object({
  receiptId: z.string().uuid(),
  items: z.array(refundReceiptItemSchema).min(1),
  reason: z.string().max(500).optional(),
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
  citizenship: z.string().min(2).max(100),
  passportSeries: z.string().min(1).max(10),
  passportNumber: z.string().min(1).max(20),
});

export const updateEmployeeBasicInfoSchema = z.object({
  firstName: z.string().min(2, 'Имя должно содержать минимум 2 символа').max(100).optional(),
  lastName: z.string().min(2, 'Фамилия должна содержать минимум 2 символа').max(100).optional(),
  phone: z.string().min(9).max(20).optional(),
  email: z.string().email().optional(),
  citizenship: z.string().min(2).max(100).optional(),
  passportSeries: z.string().min(1).max(10).optional(),
  passportNumber: z.string().min(1).max(20).optional(),
  isActive: z.boolean().optional(),
});

// Store Employee (per-store role assignment)
export const createStoreEmployeeSchema = z.object({
  userId: z.string().uuid(),
  storeId: z.string().uuid(),
  role: userRoleSchema,
  isActive: z.boolean().default(true),
});

export const updateStoreEmployeeSchema = z.object({
  role: userRoleSchema.optional(),
  isActive: z.boolean().optional(),
});

// Intranet Access (global permissions)
export const intranetPermissionsSchema = z.object({
  stores: z
    .object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    })
    .optional(),
  employees: z
    .object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      editPermissions: z.boolean().default(false),
      delete: z.boolean().default(false),
    })
    .optional(),
  customers: z
    .object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    })
    .optional(),
  reports: z
    .object({
      view: z.boolean().default(false),
      sales: z.boolean().default(false),
      products: z.boolean().default(false),
      employees: z.boolean().default(false),
      inventory: z.boolean().default(false),
    })
    .optional(),
  subscription: z
    .object({
      view: z.boolean().default(false),
      manage: z.boolean().default(false),
    })
    .optional(),
});

export const updateIntranetAccessSchema = z.object({
  userId: z.string().uuid(),
  permissions: intranetPermissionsSchema,
});

// Store Web Access (per-store web admin permissions)
export const storeWebPermissionsSchema = z.object({
  dashboard: z
    .object({
      view: z.boolean().default(false),
    })
    .optional(),
  orders: z
    .object({
      view: z.boolean().default(false),
      viewDetail: z.boolean().default(false),
      refund: z.boolean().default(false),
    })
    .optional(),
  products: z
    .object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
      addFromNomenclature: z.boolean().default(false),
    })
    .optional(),
  categories: z
    .object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    })
    .optional(),
  inventory: z
    .object({
      view: z.boolean().default(false),
      manageWarehouses: z.boolean().default(false),
      monitoring: z.boolean().default(false),
      alerts: z.boolean().default(false),
      writeoff: z.boolean().default(false),
      count: z.boolean().default(false),
    })
    .optional(),
  documents: z
    .object({
      suppliers: z.boolean().default(false),
      invoices: z.boolean().default(false),
      warehouseTransfers: z.boolean().default(false),
      storeTransfers: z.boolean().default(false),
    })
    .optional(),
  reports: z
    .object({
      view: z.boolean().default(false),
    })
    .optional(),
  integrations: z
    .object({
      manage: z.boolean().default(false),
    })
    .optional(),
  settings: z
    .object({
      view: z.boolean().default(false),
      edit: z.boolean().default(false),
    })
    .optional(),
});

// Store POS Access (per-store POS terminal permissions) - placeholder for future
export const storePosPermissionsSchema = z.object({
  sales: z.boolean().default(false),
  returns: z.boolean().default(false),
  shiftManagement: z.boolean().default(false),
  viewReports: z.boolean().default(false),
});

export const updateStoreWebAccessSchema = z.object({
  userId: z.string().uuid(),
  storeId: z.string().uuid(),
  permissions: storeWebPermissionsSchema,
});

export const updateStorePosAccessSchema = z.object({
  userId: z.string().uuid(),
  storeId: z.string().uuid(),
  permissions: storePosPermissionsSchema,
});

// Warehouse
export const createWarehouseSchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа').max(200),
  storeId: z.string().uuid('Выберите магазин'),
  managerId: z.string().uuid('Выберите ответственного').optional(),
  isActive: z.boolean().default(true),
});

export const updateWarehouseSchema = createWarehouseSchema.partial();

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
export type CreateProductSchema = z.infer<typeof createProductSchema>;
export type UpdateProductSchema = z.infer<typeof updateProductSchema>;
export type CreateVariantSchema = z.infer<typeof createVariantSchema>;
export type UpdateVariantSchema = z.infer<typeof updateVariantSchema>;
export type ProductSourceType = z.infer<typeof productSourceTypeSchema>;
export type CreateCategorySchema = z.infer<typeof createCategorySchema>;
export type UpdateCategorySchema = z.infer<typeof updateCategorySchema>;
export type CreateCustomerSchema = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerSchema = z.infer<typeof updateCustomerSchema>;
export type CreateEmployeeSchema = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeBasicInfoSchema = z.infer<typeof updateEmployeeBasicInfoSchema>;
export type CreateStoreEmployeeSchema = z.infer<typeof createStoreEmployeeSchema>;
export type UpdateStoreEmployeeSchema = z.infer<typeof updateStoreEmployeeSchema>;
export type IntranetPermissions = z.infer<typeof intranetPermissionsSchema>;
export type UpdateIntranetAccessSchema = z.infer<typeof updateIntranetAccessSchema>;
export type StoreWebPermissions = z.infer<typeof storeWebPermissionsSchema>;
export type StorePosPermissions = z.infer<typeof storePosPermissionsSchema>;
export type UpdateStoreWebAccessSchema = z.infer<typeof updateStoreWebAccessSchema>;
export type UpdateStorePosAccessSchema = z.infer<typeof updateStorePosAccessSchema>;
export type CreateWarehouseSchema = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseSchema = z.infer<typeof updateWarehouseSchema>;
export type Gender = z.infer<typeof genderSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type PermissionResource = z.infer<typeof permissionResourceSchema>;
export type PermissionAction = z.infer<typeof permissionActionSchema>;
export type ReceiptStatus = z.infer<typeof receiptStatusSchema>;
export type GetCustomerReceiptsSchema = z.infer<typeof getCustomerReceiptsSchema>;
export type RefundReceiptItemSchema = z.infer<typeof refundReceiptItemSchema>;
export type RefundReceiptSchema = z.infer<typeof refundReceiptSchema>;

// Finance - Accruals
export const accrualEntityTypeSchema = z.enum(['safe', 'cash_register', 'counterparty']);
export const accrualStatusSchema = z.enum(['draft', 'published', 'canceled']);
export const accrualTypeSchema = z.enum(['system', 'user']);

export const accrualEntityReferenceSchema = z.object({
  type: accrualEntityTypeSchema,
  id: z.string().uuid(),
  name: z.string(),
});

export const createAccrualSchema = z.object({
  datetime: z.date(),
  purposeId: z.string().uuid(),
  purposeName: z.string().min(1).max(200),
  source: accrualEntityReferenceSchema,
  recipient: accrualEntityReferenceSchema,
  amount: z.number().positive('Amount must be greater than 0'),
  type: accrualTypeSchema,
  status: accrualStatusSchema,
});

export const updateAccrualSchema = createAccrualSchema.partial();

// Accrual TypeScript types
export type AccrualEntityType = z.infer<typeof accrualEntityTypeSchema>;
export type AccrualStatus = z.infer<typeof accrualStatusSchema>;
export type AccrualType = z.infer<typeof accrualTypeSchema>;
export type AccrualEntityReference = z.infer<typeof accrualEntityReferenceSchema>;
export type CreateAccrualSchema = z.infer<typeof createAccrualSchema>;
export type UpdateAccrualSchema = z.infer<typeof updateAccrualSchema>;

// Finance - Transactions (same enums as accruals)
export const transactionStatusSchema = accrualStatusSchema;
export const transactionTypeSchema = accrualTypeSchema;
export const transactionEntityTypeSchema = accrualEntityTypeSchema;
export const transactionEntityReferenceSchema = accrualEntityReferenceSchema;

export const createTransactionSchema = z.object({
  datetime: z.date(),
  purposeId: z.string().uuid(),
  purposeName: z.string().min(1).max(200),
  source: transactionEntityReferenceSchema,
  recipient: transactionEntityReferenceSchema,
  amount: z.number().positive('Amount must be greater than 0'),
  type: transactionTypeSchema,
  status: transactionStatusSchema,
  fiscalData: z.record(z.any()).optional(), // Fiscal provider specific data
  metadata: z.record(z.any()).optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

// Transaction TypeScript types
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;
export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type TransactionEntityType = z.infer<typeof transactionEntityTypeSchema>;
export type TransactionEntityReference = z.infer<typeof transactionEntityReferenceSchema>;
export type CreateTransactionSchema = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionSchema = z.infer<typeof updateTransactionSchema>;

// Finance - Purposes (справочник назначений операций)
export const purposeCategorySchema = z.enum(['income', 'expense', 'transfer']);

export const createPurposeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  category: purposeCategorySchema.optional(),
  isSystem: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const updatePurposeSchema = createPurposeSchema.partial();

// Purpose TypeScript types
export type PurposeCategory = z.infer<typeof purposeCategorySchema>;
export type CreatePurposeSchema = z.infer<typeof createPurposeSchema>;
export type UpdatePurposeSchema = z.infer<typeof updatePurposeSchema>;

// Document Activity History
export const documentTypeSchema = z.enum(['transaction', 'accrual', 'movement_document']);
export const activityTypeSchema = z.enum([
  'created',
  'updated',
  'status_changed',
  'amount_corrected',
  'deleted',
]);

export const fieldChangeSchema = z.object({
  field: z.string(),
  fieldLabel: z.string(),
  oldValue: z.string(),
  newValue: z.string(),
  oldValueRaw: z.any().optional(),
  newValueRaw: z.any().optional(),
});

export const createDocumentActivitySchema = z.object({
  documentType: documentTypeSchema,
  documentId: z.string().uuid(),
  type: activityTypeSchema,
  userId: z.string().uuid().optional(),
  userName: z.string().min(1),
  userAvatar: z.string().url().optional(),
  description: z.string().min(1),
  changes: z.array(fieldChangeSchema).optional(),
  oldStatus: z.string().optional(),
  newStatus: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
});

// Document Activity TypeScript types
export type DocumentType = z.infer<typeof documentTypeSchema>;
export type ActivityType = z.infer<typeof activityTypeSchema>;
export type FieldChange = z.infer<typeof fieldChangeSchema>;
export type CreateDocumentActivitySchema = z.infer<typeof createDocumentActivitySchema>;

// Auth schemas for API (duplicated to avoid ESM import issues)
export const phoneSchema = z
  .string()
  .regex(/^998\d{9}$/, {
    message: 'Номер телефона должен быть в формате +998 XX XXX-XX-XX',
  });

export const otpSchemaAuth = z
  .string()
  .length(6, { message: 'Код должен содержать 6 цифр' })
  .regex(/^\d{6}$/, { message: 'Код должен содержать только цифры' });

export const passwordSchemaAuth = z
  .string()
  .min(8, { message: 'Пароль должен содержать минимум 8 символов' })
  .regex(/[A-ZА-ЯЁ]/, {
    message: 'Пароль должен содержать минимум одну заглавную букву',
  });

export const businessTypeSchemaAuth = z.enum(['single_brand', 'multi_brand'], {
  errorMap: () => ({ message: 'Выберите тип бизнеса' }),
});

export const registerSchema = z.object({
  phone: phoneSchema,
  name: z.string().min(2).max(100),
  password: passwordSchemaAuth,
  businessType: businessTypeSchemaAuth,
  businessName: z.string().min(2).max(200),
});

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, { message: 'Введите пароль' }),
});

export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: otpSchemaAuth,
});

export const forgotPasswordSchema = z.object({
  phone: phoneSchema,
});

export const resetPasswordSchema = z
  .object({
    phone: phoneSchema,
    otp: otpSchemaAuth,
    newPassword: passwordSchemaAuth,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmNewPassword'],
  });

// Auth types for API
export type PhoneSchema = z.infer<typeof phoneSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
