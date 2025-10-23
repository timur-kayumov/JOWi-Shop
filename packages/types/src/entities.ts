/**
 * Domain entity types (aligned with Prisma schema)
 */

import type { Currency, Locale, UserRole, PaymentMethod } from './index';

// Business & Tenant
export interface Business {
  id: string;
  name: string;
  taxId: string;
  currency: Currency;
  locale: Locale;
  createdAt: Date;
  updatedAt: Date;
}

export interface Store {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Terminal {
  id: string;
  tenantId: string;
  storeId: string;
  name: string;
  deviceId: string;
  fiscalProviderId?: string;
  isActive: boolean;
  settings: TerminalSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface TerminalSettings {
  printerConfig?: {
    type: 'escpos' | 'pdf';
    width: 48 | 80;
    encoding: 'utf8' | 'cp866';
  };
  scannerEnabled: boolean;
  touchMode: boolean;
  hotkeysEnabled: boolean;
}

// Users & Auth
export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  tenantId: string;
  userId: string;
  storeId: string;
  pin?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Products
export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  categoryId?: string;
  taxRate: number;
  isActive: boolean;
  hasVariants: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  tenantId: string;
  productId: string;
  sku: string;
  name: string;
  barcode?: string;
  price: number;
  cost?: number;
  unit: string;
  attributes?: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  parentId?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Inventory
export interface StockLevel {
  id: string;
  tenantId: string;
  storeId: string;
  variantId: string;
  quantity: number;
  reservedQuantity: number;
  updatedAt: Date;
}

export interface StockBatch {
  id: string;
  tenantId: string;
  storeId: string;
  variantId: string;
  quantity: number;
  costPrice: number;
  receivedAt: Date;
  supplierId?: string;
}

// Sales
export interface Receipt {
  id: string;
  tenantId: string;
  storeId: string;
  terminalId: string;
  receiptNumber: string;
  customerId?: string;
  employeeId: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'completed' | 'refunded';
  fiscalData?: FiscalData;
  createdAt: Date;
  completedAt?: Date;
}

export interface ReceiptItem {
  id: string;
  receiptId: string;
  variantId: string;
  quantity: number;
  price: number;
  discountAmount: number;
  taxRate: number;
  total: number;
}

export interface Payment {
  id: string;
  receiptId: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  createdAt: Date;
}

export interface FiscalData {
  fiscalReceiptNumber: string;
  fiscalDate: Date;
  fiscalSign: string;
  qrCode?: string;
}

// Customer & Loyalty
export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone?: string;
  email?: string;
  loyaltyCardNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyTransaction {
  id: string;
  tenantId: string;
  customerId: string;
  receiptId?: string;
  points: number;
  type: 'earn' | 'redeem';
  externalId?: string;
  createdAt: Date;
}

// Shift
export interface Shift {
  id: string;
  tenantId: string;
  terminalId: string;
  employeeId: string;
  shiftNumber: number;
  openedAt: Date;
  closedAt?: Date;
  openingCash: number;
  closingCash?: number;
  status: 'open' | 'closed';
}

export interface CashOperation {
  id: string;
  tenantId: string;
  shiftId: string;
  type: 'in' | 'out';
  amount: number;
  reason: string;
  createdAt: Date;
}
