import { Controller, Get } from '@nestjs/common';
import { CacheService } from './modules/cache/cache.module';
import { Public } from './common/decorators/public.decorator';

@Controller('health')
@Public() // Health check should be accessible without authentication
export class HealthController {
  constructor(private readonly cacheService: CacheService) {}

  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'jowi-shop-api',
      version: '0.1.0',
    };
  }

  @Get('cache')
  async checkCache() {
    try {
      const isHealthy = await this.cacheService.healthCheck();
      const stats = await this.cacheService.getStats();

      return {
        status: isHealthy ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        cache: {
          connected: stats.connected,
          totalKeys: stats.totalKeys,
          memoryUsed: stats.memoryUsed,
          uptime: stats.uptime,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
