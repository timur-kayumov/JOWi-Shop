import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SalesModule } from './modules/sales/sales.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ReportsModule } from './modules/reports/reports.module';
import { StoresModule } from './modules/stores/stores.module';
import { DatabaseModule } from './modules/database/database.module';
import { CacheModule } from './modules/cache/cache.module';
import { SearchModule } from './modules/search/search.module';
import { HealthController } from './health.controller';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from './common/guards/tenant.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    CacheModule,
    AuthModule,
    StoresModule,
    ProductsModule,
    InventoryModule,
    SalesModule,
    CustomersModule,
    ReportsModule,
    SearchModule,
  ],
  controllers: [HealthController],
  providers: [
    // Apply JwtAuthGuard globally (all routes require authentication by default)
    // TEMPORARY: Disabled for load testing race condition fix
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
    // Apply TenantGuard globally (all routes require tenant_id validation)
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
})
export class AppModule {}
