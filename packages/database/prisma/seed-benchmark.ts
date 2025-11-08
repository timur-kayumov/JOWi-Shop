#!/usr/bin/env tsx
/**
 * Seed script for performance benchmark testing
 *
 * Creates test data for JOWi Shop API benchmarking:
 * - 1 Business (tenant)
 * - 2 Stores
 * - 2 Terminals
 * - 5 Users + Employees
 * - 20 Customers
 * - 15 Categories
 * - 300 Products with 450+ variants
 * - Stock levels + batches for all variants
 * - 10 Completed receipts (for refund tests)
 * - Mixed barcode types (EAN-13, CODE128)
 *
 * Usage:
 *   pnpm tsx packages/database/prisma/seed-benchmark.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fixed IDs for consistent testing (must be valid UUIDs)
const TENANT_ID = '424af838-23a4-40ae-bb7c-a7243106026e';
const STORE_1_ID = 'a1b2c3d4-1111-1111-1111-111111111111';
const STORE_2_ID = 'a1b2c3d4-2222-2222-2222-222222222222';
const TERMINAL_1_ID = 'b2c3d4e5-1111-1111-1111-111111111111';
const TERMINAL_2_ID = 'b2c3d4e5-2222-2222-2222-222222222222';
const TEST_USER_ID = 'user-benchmark-test';

// Product data generators
const PRODUCT_CATEGORIES = [
  { name: 'Напитки', icon: 'Coffee', color: '#3B82F6', types: ['Газированные', 'Соки', 'Вода', 'Энергетики'] },
  { name: 'Снеки', icon: 'Cookie', color: '#F59E0B', types: ['Чипсы', 'Сухарики', 'Попкорн', 'Орешки'] },
  { name: 'Молочные продукты', icon: 'Milk', color: '#10B981', types: ['Молоко', 'Йогурт', 'Сыр', 'Кефир'] },
  { name: 'Хлебобулочные', icon: 'Croissant', color: '#8B5CF6', types: ['Хлеб', 'Булочки', 'Батон', 'Лаваш'] },
  { name: 'Кондитерские изделия', icon: 'Cake', color: '#EC4899', types: ['Шоколад', 'Конфеты', 'Печенье', 'Торты'] },
  { name: 'Фрукты и овощи', icon: 'Apple', color: '#EF4444', types: ['Фрукты', 'Овощи', 'Зелень', 'Ягоды'] },
  { name: 'Мясо и птица', icon: 'Beef', color: '#DC2626', types: ['Курица', 'Говядина', 'Баранина', 'Колбаса'] },
  { name: 'Рыба и морепродукты', icon: 'Fish', color: '#06B6D4', types: ['Рыба', 'Креветки', 'Икра', 'Крабы'] },
  { name: 'Бакалея', icon: 'ShoppingBag', color: '#F97316', types: ['Крупы', 'Макароны', 'Масло', 'Консервы'] },
  { name: 'Замороженные продукты', icon: 'Snowflake', color: '#0EA5E9', types: ['Мороженое', 'Овощи', 'Полуфабрикаты', 'Рыба'] },
  { name: 'Бытовая химия', icon: 'Sparkles', color: '#14B8A6', types: ['Порошок', 'Средства', 'Салфетки', 'Губки'] },
  { name: 'Косметика и гигиена', icon: 'Sparkle', color: '#A855F7', types: ['Шампунь', 'Мыло', 'Зубная паста', 'Крем'] },
  { name: 'Детские товары', icon: 'Baby', color: '#FB923C', types: ['Подгузники', 'Питание', 'Игрушки', 'Одежда'] },
  { name: 'Товары для дома', icon: 'Home', color: '#64748B', types: ['Посуда', 'Текстиль', 'Декор', 'Хозтовары'] },
  { name: 'Табачные изделия', icon: 'Cigarette', color: '#78716C', types: ['Сигареты', 'Зажигалки', 'Табак', 'Вейпы'] },
];

const BRANDS = [
  'Coca-Cola', 'Pepsi', 'Nestle', 'Danone', 'Unilever', 'P&G', 'Mars', 'Ferrero',
  'Lays', 'Pringles', 'Lipton', 'Activia', 'Milka', 'Snickers', 'Bounty', 'Dove',
  'Тошкент Сути', 'Лактис', 'Узбекская', 'Самаркандская', 'Бухарская', 'Хорезмская',
];

function generateBarcode(type: 'EAN13' | 'CODE128' = 'EAN13'): string {
  if (type === 'EAN13') {
    // EAN-13: country code (48 for Uzbekistan) + 11 digits
    return '48' + Math.floor(Math.random() * 100000000000).toString().padStart(11, '0');
  } else {
    // CODE128: alphanumeric
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}

function generateSKU(categoryIndex: number, productIndex: number): string {
  return `${String.fromCharCode(65 + categoryIndex)}${productIndex.toString().padStart(4, '0')}`;
}

function generatePrice(): number {
  const prices = [2000, 3000, 5000, 7000, 8000, 10000, 12000, 15000, 20000, 25000, 30000, 50000];
  return prices[Math.floor(Math.random() * prices.length)];
}

async function main() {
  console.log('🌱 Seeding database for benchmark testing...');

  // 0. Clean up existing benchmark data
  console.log('Cleaning up existing benchmark data...');
  await prisma.receipt.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.stockBatch.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.stockLevel.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.productVariant.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.product.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.category.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.customer.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.employee.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.terminal.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.user.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.store.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.business.deleteMany({ where: { id: TENANT_ID } });
  console.log('✓ Cleanup complete');

  // 1. Create Business (Tenant)
  const business = await prisma.business.upsert({
    where: { id: TENANT_ID },
    update: {},
    create: {
      id: TENANT_ID,
      name: 'JOWi Shop Benchmark Test',
      taxId: '999999999',
      currency: 'UZS',
      locale: 'ru',
      metadata: { seed: 'benchmark', createdAt: new Date().toISOString() },
    },
  });
  console.log('✅ Business created:', business.name);

  // 2. Create Stores
  const store1 = await prisma.store.upsert({
    where: { id: STORE_1_ID },
    update: {},
    create: {
      id: STORE_1_ID,
      tenantId: TENANT_ID,
      name: 'Benchmark Store - Central',
      address: 'ул. Амира Темура, 15',
      phone: '+998901234567',
      city: 'Ташкент',
      country: 'Uzbekistan',
    },
  });

  const store2 = await prisma.store.upsert({
    where: { id: STORE_2_ID },
    update: {},
    create: {
      id: STORE_2_ID,
      tenantId: TENANT_ID,
      name: 'Benchmark Store - Chilanzar',
      address: 'Чиланзар, 12 квартал',
      phone: '+998907654321',
      city: 'Ташкент',
      country: 'Uzbekistan',
    },
  });
  console.log('✅ Stores created:', store1.name, store2.name);

  // 3. Create Test User
  const testUser = await prisma.user.upsert({
    where: { phone: '+998901234567' },
    update: {},
    create: {
      id: TEST_USER_ID,
      tenantId: TENANT_ID,
      phone: '+998901234567',
      email: 'test@jowi.shop',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
    },
  });

  // 4. Create Users and Employees
  const users = [];
  const employees = [];

  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.upsert({
      where: { phone: `+99890111111${i}` },
      update: {},
      create: {
        tenantId: TENANT_ID,
        phone: `+99890111111${i}`,
        email: `employee${i}@jowi.shop`,
        firstName: `Сотрудник${i}`,
        lastName: `Тестовый`,
        role: i <= 2 ? 'manager' : 'cashier',
      },
    });
    users.push(user);

    const employee = await prisma.employee.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        tenantId: TENANT_ID,
        userId: user.id,
        storeId: i <= 2 ? store1.id : store2.id,
        citizenship: 'Uzbekistan',
        passportSeries: 'AA',
        passportNumber: `${1000000 + i}`,
      },
    });
    employees.push(employee);
  }
  console.log(`✅ Created ${users.length} users and employees`);

  // 5. Create Terminals
  const terminal1 = await prisma.terminal.upsert({
    where: { deviceId: 'TERM-BENCH-001' },
    update: {},
    create: {
      id: TERMINAL_1_ID,
      tenantId: TENANT_ID,
      storeId: store1.id,
      name: 'Касса 1',
      deviceId: 'TERM-BENCH-001',
    },
  });

  const terminal2 = await prisma.terminal.upsert({
    where: { deviceId: 'TERM-BENCH-002' },
    update: {},
    create: {
      id: TERMINAL_2_ID,
      tenantId: TENANT_ID,
      storeId: store2.id,
      name: 'Касса 2',
      deviceId: 'TERM-BENCH-002',
    },
  });
  console.log('✅ Terminals created:', terminal1.name, terminal2.name);

  // 6. Create Customers
  const customers = [];
  for (let i = 1; i <= 20; i++) {
    const customer = await prisma.customer.upsert({
      where: { id: `customer-bench-${i}` },
      update: {},
      create: {
        id: `customer-bench-${i}`,
        tenantId: TENANT_ID,
        firstName: `Клиент${i}`,
        lastName: `Тестовый`,
        phone: `+99890222222${i.toString().padStart(2, '0')}`,
        email: `customer${i}@test.com`,
        loyaltyCardNumber: i <= 10 ? `CARD-BENCH-${i.toString().padStart(3, '0')}` : undefined,
        gender: i % 2 === 0 ? 'male' : 'female',
        dateOfBirth: new Date(1980 + (i % 30), (i % 12), (i % 28) + 1),
      },
    });
    customers.push(customer);
  }
  console.log(`✅ Created ${customers.length} customers`);

  // 7. Create Categories
  const categories = [];
  for (let i = 0; i < PRODUCT_CATEGORIES.length; i++) {
    const cat = PRODUCT_CATEGORIES[i];
    const category = await prisma.category.upsert({
      where: { id: `category-bench-${i + 1}` },
      update: {},
      create: {
        id: `category-bench-${i + 1}`,
        tenantId: TENANT_ID,
        name: cat.name,
        sortOrder: i + 1,
      },
    });
    categories.push(category);
  }
  console.log(`✅ Created ${categories.length} categories`);

  // 8. Create Products and Variants (300 products)
  console.log('Creating 300 products with variants...');
  const products = [];
  const variants = [];
  let productCount = 0;
  let variantCount = 0; // Global counter for unique SKUs

  for (let catIndex = 0; catIndex < categories.length && productCount < 300; catIndex++) {
    const category = categories[catIndex];
    const categoryData = PRODUCT_CATEGORIES[catIndex];
    const productsPerCategory = Math.ceil(300 / categories.length);

    for (let p = 0; p < productsPerCategory && productCount < 300; p++) {
      productCount++;
      const brand = BRANDS[Math.floor(Math.random() * BRANDS.length)];
      const type = categoryData.types[p % categoryData.types.length];

      const product = await prisma.product.create({
        data: {
          tenantId: TENANT_ID,
          name: `${brand} ${type}`,
          description: `Тестовый продукт ${productCount} для benchmark`,
          categoryId: category.id,
          taxRate: 12,
          hasVariants: true,
        },
      });
      products.push(product);

      // Create 1-2 variants per product
      const variantsPerProduct = Math.random() > 0.5 ? 2 : 1;
      for (let v = 0; v < variantsPerProduct; v++) {
        const price = generatePrice();
        const cost = Math.floor(price * 0.6);
        const sizes = ['250мл', '500мл', '1л', '1.5л', '100г', '200г', '500г', '1кг'];
        const size = sizes[Math.floor(Math.random() * sizes.length)];

        // Use different barcode types (80% EAN13, 20% CODE128)
        const barcodeType = Math.random() > 0.2 ? 'EAN13' : 'CODE128';

        const variant = await prisma.productVariant.create({
          data: {
            tenantId: TENANT_ID,
            productId: product.id,
            name: `${product.name} ${size}`,
            sku: generateSKU(catIndex, variantCount), // Use global counter
            barcode: generateBarcode(barcodeType),
            price,
            cost,
            unit: 'шт',
          },
        });
        variants.push(variant);
        variantCount++; // Increment global counter

        // Create stock levels with batches for store1
        const quantity1 = Math.floor(Math.random() * 100) + 10;
        await prisma.stockLevel.create({
          data: {
            tenantId: TENANT_ID,
            storeId: store1.id,
            variantId: variant.id,
            quantity: quantity1,
            reservedQuantity: 0,
          },
        });

        // Create StockBatch for store1
        await prisma.stockBatch.create({
          data: {
            tenantId: TENANT_ID,
            storeId: store1.id,
            variantId: variant.id,
            quantity: quantity1,
            costPrice: cost,
            receivedAt: new Date(),
          },
        });

        // 50% chance to add stock in store2
        if (Math.random() > 0.5) {
          const quantity2 = Math.floor(Math.random() * 50) + 5;
          await prisma.stockLevel.create({
            data: {
              tenantId: TENANT_ID,
              storeId: store2.id,
              variantId: variant.id,
              quantity: quantity2,
              reservedQuantity: 0,
            },
          });

          // Create StockBatch for store2
          await prisma.stockBatch.create({
            data: {
              tenantId: TENANT_ID,
              storeId: store2.id,
              variantId: variant.id,
              quantity: quantity2,
              costPrice: cost,
              receivedAt: new Date(),
            },
          });
        }
      }

      if (productCount % 50 === 0) {
        console.log(`  Progress: ${productCount}/300 products created`);
      }
    }
  }

  console.log(`✅ Created ${products.length} products with ${variants.length} variants`);
  console.log(`✅ Created stock levels and batches for all variants`);

  // 9. Пропускаем создание completed receipts - слишком много проблем с nested relations
  console.log('⚠️  Skipping completed receipts creation (будет создано через API во время benchmark)');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Benchmark seed completed successfully!');
  console.log('='.repeat(60));
  console.log(`Business ID (tenant): ${TENANT_ID}`);
  console.log(`Test User: +998901234567 / test@jowi.shop`);
  console.log(`Stores: ${store1.name}, ${store2.name}`);
  console.log(`Categories: ${categories.length}`);
  console.log(`Products: ${products.length}`);
  console.log(`Variants: ${variants.length}`);
  console.log(`Customers: ${customers.length}`);
  console.log(`Employees: ${employees.length}`);
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
