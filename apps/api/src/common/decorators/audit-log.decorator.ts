import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '../services/audit-log.service';

export interface AuditLogOptions {
  action: AuditAction;
  entity: string;
  getEntityId?: (result: any) => string; // Function to extract entity ID from result
}

/**
 * @AuditLog decorator
 *
 * Marks a controller method for automatic audit logging.
 *
 * Usage:
 * @AuditLog({ action: AuditAction.CREATE, entity: 'Product' })
 * async createProduct(@Body() dto: CreateProductDto) {
 *   // ... implementation
 * }
 */
export const AuditLog = (options: AuditLogOptions) =>
  SetMetadata('auditLog', options);
