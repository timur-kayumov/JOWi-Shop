import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @TenantId decorator
 * Extracts tenant_id from request (set by TenantGuard)
 *
 * Usage in controller:
 * @Get()
 * async getData(@TenantId() tenantId: string) {
 *   // tenantId is automatically extracted from JWT
 * }
 */
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId || request.user?.tenantId;
  },
);
