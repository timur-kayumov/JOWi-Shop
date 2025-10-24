import { SetMetadata } from '@nestjs/common';

/**
 * @Public decorator
 * Use this decorator to mark routes that don't require authentication
 * Example: @Public() on auth endpoints (login, register, sendOtp)
 */
export const Public = () => SetMetadata('isPublic', true);
