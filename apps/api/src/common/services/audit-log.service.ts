import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../modules/database/database.service';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  SEND_OTP = 'SEND_OTP',
  VERIFY_OTP = 'VERIFY_OTP',
  OPEN_SHIFT = 'OPEN_SHIFT',
  CLOSE_SHIFT = 'CLOSE_SHIFT',
  REGISTER_SALE = 'REGISTER_SALE',
  REFUND = 'REFUND',
  ACCESS_DENIED = 'ACCESS_DENIED',
}

export interface AuditLogEntry {
  tenantId: string;
  userId?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * AuditLogService - Centralized audit logging service
 *
 * This service logs all critical operations for compliance and security.
 * Audit logs are immutable and should never be deleted.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Create an audit log entry
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.db.auditLog.create({
        data: {
          tenantId: entry.tenantId,
          userId: entry.userId,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          changes: entry.changes || undefined,
          metadata: entry.metadata || undefined,
        },
      });

      this.logger.log(
        `Audit: ${entry.action} ${entry.entity}${entry.entityId ? ` (${entry.entityId})` : ''} by user ${entry.userId || 'system'}`
      );
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
      // Don't throw - audit logging should not break business operations
    }
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityAuditLogs(tenantId: string, entity: string, entityId: string): Promise<any[]> {
    return this.db.auditLog.findMany({
      where: {
        tenantId,
        entity,
        entityId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(tenantId: string, userId: string, limit = 100): Promise<any[]> {
    return this.db.auditLog.findMany({
      where: {
        tenantId,
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get recent audit logs for tenant
   */
  async getRecentAuditLogs(tenantId: string, limit = 100): Promise<any[]> {
    return this.db.auditLog.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }
}
