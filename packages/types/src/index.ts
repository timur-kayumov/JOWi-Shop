/**
 * @jowi/types - Shared TypeScript types for JOWi Shop
 */

// Common types
export type Currency = 'UZS';
export type Locale = 'ru' | 'uz';

// Multi-tenancy
export interface TenantContext {
  tenantId: string;
  businessId: string;
  storeId?: string;
  terminalId?: string;
}

// Authentication
export interface UserClaims {
  userId: string;
  tenantId: string;
  role: UserRole;
  permissions: string[];
}

export type UserRole = 'admin' | 'manager' | 'cashier' | 'warehouse';

// Common API response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  timestamp: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Fiscal
export type FiscalOperation = 'sale' | 'refund' | 'openShift' | 'closeShift';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'installment';

// Sync (for offline POS)
export interface SyncQueueItem {
  id: string;
  operation: string;
  data: Record<string, unknown>;
  createdAt: Date;
  retryCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// Inventory
export type MovementType = 'receipt' | 'transfer' | 'return' | 'writeoff' | 'count';
export type CostingMethod = 'FIFO';

// Export all types
export * from './entities';
