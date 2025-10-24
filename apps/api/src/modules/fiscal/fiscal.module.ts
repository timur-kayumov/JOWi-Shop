import { Module } from '@nestjs/common';
import { MockFiscalProvider } from './providers/mock-fiscal.provider';
import { IFiscalProvider } from './fiscal-provider.interface';

/**
 * FiscalModule - Fiscal device integration module
 *
 * Provides fiscal device communication for Uzbekistan compliance.
 * Currently uses MockFiscalProvider for development.
 *
 * To use a real fiscal device:
 * 1. Create a new provider class implementing IFiscalProvider
 * 2. Replace MockFiscalProvider in the providers array
 * 3. Configure device connection settings via environment variables
 */
@Module({
  providers: [
    {
      provide: 'FISCAL_PROVIDER',
      useClass: MockFiscalProvider, // Replace with real provider in production
    },
  ],
  exports: ['FISCAL_PROVIDER'],
})
export class FiscalModule {}
