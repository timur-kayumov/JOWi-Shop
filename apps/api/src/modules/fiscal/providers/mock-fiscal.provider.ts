import { Injectable, Logger } from '@nestjs/common';
import {
  IFiscalProvider,
  FiscalReceipt,
  FiscalShift,
  RegisterSaleRequest,
  RefundRequest,
  XReportData,
  ZReportData,
  FiscalProviderStatus,
  FiscalProviderError,
  FiscalErrorCode,
} from '../fiscal-provider.interface';

/**
 * MockFiscalProvider - Mock implementation for development and testing
 *
 * This provider simulates fiscal device behavior without requiring actual hardware.
 * It generates fake fiscal numbers and always returns success.
 *
 * DO NOT USE IN PRODUCTION - Replace with real fiscal device provider.
 */
@Injectable()
export class MockFiscalProvider implements IFiscalProvider {
  private readonly logger = new Logger(MockFiscalProvider.name);
  private currentShift: FiscalShift | null = null;
  private receiptCounter = 1000;
  private fiscalDocumentCounter = 5000;
  private shiftSales: number[] = [];
  private shiftRefunds: number[] = [];

  async getStatus(): Promise<FiscalProviderStatus> {
    this.logger.log('Mock: Getting fiscal device status');
    return FiscalProviderStatus.READY;
  }

  async openShift(cashierName: string, openingCash: number): Promise<FiscalShift> {
    this.logger.log(`Mock: Opening shift for ${cashierName}, opening cash: ${openingCash}`);

    if (this.currentShift && !this.currentShift.closedAt) {
      throw new FiscalProviderError(
        FiscalErrorCode.INVALID_REQUEST,
        'Shift already opened. Close current shift before opening a new one.'
      );
    }

    const shiftNumber = this.currentShift ? this.currentShift.shiftNumber + 1 : 1;

    this.currentShift = {
      shiftNumber,
      openedAt: new Date(),
      fiscalDocumentNumber: this.fiscalDocumentCounter++,
    };

    this.shiftSales = [];
    this.shiftRefunds = [];

    return this.currentShift;
  }

  async registerSale(request: RegisterSaleRequest): Promise<FiscalReceipt> {
    this.logger.log(`Mock: Registering sale with ${request.items.length} items`);

    if (!this.currentShift || this.currentShift.closedAt) {
      throw new FiscalProviderError(
        FiscalErrorCode.SHIFT_NOT_OPENED,
        'No open shift. Please open a shift before registering sales.'
      );
    }

    const totalAmount = request.items.reduce((sum, item) => sum + item.total, 0);
    this.shiftSales.push(totalAmount);

    const receiptNumber = `MOCK-${this.receiptCounter++}`;
    const fiscalDocumentNumber = this.fiscalDocumentCounter++;

    const receipt: FiscalReceipt = {
      receiptNumber,
      fiscalSign: this.generateMockFiscalSign(),
      fiscalDocumentNumber,
      fiscalStorageNumber: 'MOCK-FS-123456789',
      dateTime: new Date(),
      qrCode: this.generateMockQRCode(receiptNumber, totalAmount),
    };

    this.logger.log(`Mock: Sale registered - Receipt: ${receiptNumber}, Fiscal Doc: ${fiscalDocumentNumber}`);

    return receipt;
  }

  async refund(request: RefundRequest): Promise<FiscalReceipt> {
    this.logger.log(`Mock: Processing refund for receipt ${request.originalReceiptNumber}`);

    if (!this.currentShift || this.currentShift.closedAt) {
      throw new FiscalProviderError(
        FiscalErrorCode.SHIFT_NOT_OPENED,
        'No open shift. Please open a shift before processing refunds.'
      );
    }

    const totalAmount = request.items.reduce((sum, item) => sum + item.total, 0);
    this.shiftRefunds.push(totalAmount);

    const receiptNumber = `MOCK-RFD-${this.receiptCounter++}`;
    const fiscalDocumentNumber = this.fiscalDocumentCounter++;

    const receipt: FiscalReceipt = {
      receiptNumber,
      fiscalSign: this.generateMockFiscalSign(),
      fiscalDocumentNumber,
      fiscalStorageNumber: 'MOCK-FS-123456789',
      dateTime: new Date(),
      qrCode: this.generateMockQRCode(receiptNumber, -totalAmount),
    };

    this.logger.log(`Mock: Refund processed - Receipt: ${receiptNumber}, Fiscal Doc: ${fiscalDocumentNumber}`);

    return receipt;
  }

  async printXReport(): Promise<XReportData> {
    this.logger.log('Mock: Generating X-Report (shift summary)');

    if (!this.currentShift || this.currentShift.closedAt) {
      throw new FiscalProviderError(
        FiscalErrorCode.SHIFT_NOT_OPENED,
        'No open shift to generate report for.'
      );
    }

    const totalSales = this.shiftSales.reduce((sum, amount) => sum + amount, 0);
    const totalRefunds = this.shiftRefunds.reduce((sum, amount) => sum + amount, 0);

    const report: XReportData = {
      shiftNumber: this.currentShift.shiftNumber,
      salesCount: this.shiftSales.length,
      totalSales,
      totalCash: totalSales * 0.6, // Mock: 60% cash
      totalCard: totalSales * 0.4, // Mock: 40% card
      refundsCount: this.shiftRefunds.length,
      totalRefunds,
    };

    this.logger.log(`Mock: X-Report generated - Sales: ${report.salesCount}, Total: ${totalSales}`);

    return report;
  }

  async closeShift(): Promise<ZReportData> {
    this.logger.log('Mock: Closing shift and generating Z-Report');

    if (!this.currentShift || this.currentShift.closedAt) {
      throw new FiscalProviderError(
        FiscalErrorCode.SHIFT_NOT_OPENED,
        'No open shift to close.'
      );
    }

    const xReport = await this.printXReport();
    const fiscalDocumentNumber = this.fiscalDocumentCounter++;

    this.currentShift.closedAt = new Date();

    const zReport: ZReportData = {
      ...xReport,
      closedAt: this.currentShift.closedAt,
      fiscalDocumentNumber,
    };

    this.logger.log(`Mock: Shift closed - Z-Report Fiscal Doc: ${fiscalDocumentNumber}`);

    return zReport;
  }

  async cancelLastDocument(): Promise<void> {
    this.logger.log('Mock: Cancelling last fiscal document');
    // Mock implementation - do nothing
  }

  async printDuplicate(fiscalDocumentNumber: number): Promise<void> {
    this.logger.log(`Mock: Printing duplicate for fiscal document ${fiscalDocumentNumber}`);
    // Mock implementation - do nothing
  }

  // Helper methods for mock data generation

  private generateMockFiscalSign(): string {
    return Math.random().toString(36).substring(2, 12).toUpperCase();
  }

  private generateMockQRCode(receiptNumber: string, amount: number): string {
    // In real implementation, this would be a base64-encoded QR code image
    // For mock, return a fake QR data string
    const qrData = {
      receipt: receiptNumber,
      amount,
      date: new Date().toISOString(),
      fs: 'MOCK-FS-123456789',
    };
    return Buffer.from(JSON.stringify(qrData)).toString('base64');
  }
}
