import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for development
  app.enableCors({
    origin: process.env.NODE_ENV === 'development' ? '*' : process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true,
  });

  // Global Zod validation pipe
  app.useGlobalPipes(new ZodValidationPipe());

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('JOWi Shop API')
      .setDescription('Multi-tenant retail management system API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('products', 'Product management')
      .addTag('inventory', 'Inventory management')
      .addTag('sales', 'Sales and receipts')
      .addTag('customers', 'Customer management')
      .addTag('reports', 'Reports and analytics')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 JOWi Shop API running on http://localhost:${port}`);
  if (process.env.NODE_ENV === 'development') {
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
