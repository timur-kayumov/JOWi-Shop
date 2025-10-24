import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller('health')
@Public() // Health check should be accessible without authentication
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'jowi-shop-api',
      version: '0.1.0',
    };
  }
}
