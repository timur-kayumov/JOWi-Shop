import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * TenantGuard - Multi-tenancy guard for all API endpoints
 *
 * This guard:
 * 1. Extracts tenant_id from JWT payload (set by JwtStrategy)
 * 2. Validates that tenant_id exists
 * 3. Attaches tenant_id to the request object for use in controllers
 *
 * Usage:
 * - Apply globally in app.module.ts
 * - Can be skipped on specific routes using @Public() decorator
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is marked as public (skip tenant check for auth endpoints)
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by JwtStrategy

    // TEMPORARY: For load testing, also accept x-tenant-id header
    const headerTenantId = request.headers['x-tenant-id'];

    if (!user || !user.tenantId) {
      // Fallback to header for testing (when JWT guard is disabled)
      if (headerTenantId) {
        request.tenantId = headerTenantId;
        return true;
      }
      throw new ForbiddenException('TENANT_MISSING');
    }

    // Attach tenant_id to request for easy access in controllers
    request.tenantId = user.tenantId;

    return true;
  }
}
