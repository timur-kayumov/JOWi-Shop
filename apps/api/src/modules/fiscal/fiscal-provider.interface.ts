/**
 * Fiscal Provider Interface for Uzbekistan Cash Register Integration
 *
 * This interface abstracts fiscal device communication for compliance with
 * Uzbekistan fiscalization requirements. Implementations should support
 * local fiscal devices (Shtrih, ATOL, Payme-POS, etc.)
 */

export interface FiscalReceipt {
  receiptNumber: string;
  fiscalSign: string;
  fiscalDocumentNumber: number;
  fiscalStorageNumber: string;
  dateTime: Date;
  qrCode?: string;
}

export interface FiscalShift {
  shiftNumber: number;
  openedAt: Date;
  closedAt?: Date;
  fiscalDocumentNumber?: number;
}

export interface FiscalReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  taxRate: number;
  barcode?: string;
}

export interface FiscalPayment {
  type: 'cash' | 'card' | 'transfer' | 'installment';
  amount: number;
}

export interface RegisterSaleRequest {
  items: FiscalReceiptItem[];
  payments: FiscalPayment[];
  customerPhone?: string;
  cashierName: string;
  discountAmount?: number;
}

export interface RefundRequest {
  originalReceiptNumber: string;
  items: FiscalReceiptItem[];
  reason: string;
}

export interface XReportData {
  shiftNumber: number;
  salesCount: number;
  totalSales: number;
  totalCash: number;
  totalCard: number;
  refundsCount: number;
  totalRefunds: number;
}

export interface ZReportData extends XReportData {
  closedAt: Date;
  fiscalDocumentNumber: number;
}

export enum FiscalProviderStatus {
  READY = 'ready',
  OFFLINE = 'offline',
  ERROR = 'error',
  BUSY = 'busy',
}

/**
 * FiscalProvider - Abstract interface for fiscal device communication
 */
export interface IFiscalProvider {
  /**
   * Get current status of fiscal device
   */
  getStatus(): Promise<FiscalProviderStatus>;

  /**
   * Open a new shift
   */
  openShift(cashierName: string, openingCash: number): Promise<FiscalShift>;

  /**
   * Register a sale (create fiscal receipt)
   */
  registerSale(request: RegisterSaleRequest): Promise<FiscalReceipt>;

  /**
   * Process a refund
   */
  refund(request: RefundRequest): Promise<FiscalReceipt>;

  /**
   * Print X-Report (shift summary without closing)
   */
  printXReport(): Promise<XReportData>;

  /**
   * Close shift and print Z-Report
   */
  closeShift(): Promise<ZReportData>;

  /**
   * Cancel last fiscal document (if supported)
   */
  cancelLastDocument?(): Promise<void>;

  /**
   * Print duplicate receipt
   */
  printDuplicate?(fiscalDocumentNumber: number): Promise<void>;
}

/**
 * Error codes for fiscal operations
 */
export enum FiscalErrorCode {
  DEVICE_OFFLINE = 'DEVICE_OFFLINE',
  SHIFT_NOT_OPENED = 'SHIFT_NOT_OPENED',
  SHIFT_EXPIRED = 'SHIFT_EXPIRED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  COMMUNICATION_ERROR = 'COMMUNICATION_ERROR',
  FISCAL_MEMORY_FULL = 'FISCAL_MEMORY_FULL',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class FiscalProviderError extends Error {
  constructor(
    public code: FiscalErrorCode,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'FiscalProviderError';
  }
}
