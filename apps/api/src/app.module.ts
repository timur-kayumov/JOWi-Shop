import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SalesModule } from './modules/sales/sales.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DatabaseModule } from './modules/database/database.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    AuthModule,
    ProductsModule,
    InventoryModule,
    SalesModule,
    CustomersModule,
    ReportsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
