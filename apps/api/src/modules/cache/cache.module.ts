import { Module, Global, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService as BaseCacheService } from '@jowi/cache';
import { Injectable } from '@nestjs/common';

// Wrapper to add NestJS lifecycle hooks
@Injectable()
class CacheService extends BaseCacheService implements OnModuleDestroy {
  async onModuleDestroy() {
    await this.disconnect();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: CacheService,
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
        const redisPort = configService.get<number>('REDIS_PORT', 6379);
        const redisPassword = configService.get<string>('REDIS_PASSWORD');

        return new CacheService({
          url: redisUrl,
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          keyPrefix: 'jowi:',
          maxRetriesPerRequest: 3,
          connectTimeout: 10000,
          commandTimeout: 5000,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [CacheService],
})
export class CacheModule {}

export { CacheService };
