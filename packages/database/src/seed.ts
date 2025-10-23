/**
 * Database seed script for development
 */

import { prisma } from './index';

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo business
  const business = await prisma.business.upsert({
    where: { taxId: '123456789' },
    update: {},
    create: {
      name: 'Demo Store Group',
      taxId: '123456789',
      currency: 'UZS',
      locale: 'ru',
    },
  });

  console.log('✅ Created business:', business.name);

  // Create demo store
  const store = await prisma.store.upsert({
    where: { id: 'demo-store-1' },
    update: {},
    create: {
      id: 'demo-store-1',
      tenantId: business.id,
      name: 'Central Store',
      address: 'Tashkent, Amir Temur Ave, 1',
      phone: '+998901234567',
    },
  });

  console.log('✅ Created store:', store.name);

  // Create demo admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@jowi.shop' },
    update: {},
    create: {
      tenantId: business.id,
      email: 'admin@jowi.shop',
      name: 'Admin User',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNw8QD.qC', // password: admin123
      role: 'admin',
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create demo terminal
  const terminal = await prisma.terminal.upsert({
    where: { deviceId: 'TERMINAL-001' },
    update: {},
    create: {
      tenantId: business.id,
      storeId: store.id,
      name: 'Cashier Terminal 1',
      deviceId: 'TERMINAL-001',
      settings: {
        printerConfig: {
          type: 'escpos',
          width: 48,
          encoding: 'utf8',
        },
        scannerEnabled: true,
        touchMode: true,
        hotkeysEnabled: true,
      },
    },
  });

  console.log('✅ Created terminal:', terminal.name);

  // Create demo employee
  const employee = await prisma.employee.create({
    data: {
      tenantId: business.id,
      userId: adminUser.id,
      storeId: store.id,
      pin: '1234',
    },
  });

  console.log('✅ Created employee for admin user');

  // Create demo categories
  const electronics = await prisma.category.create({
    data: {
      tenantId: business.id,
      name: 'Electronics',
      sortOrder: 1,
    },
  });

  const food = await prisma.category.create({
    data: {
      tenantId: business.id,
      name: 'Food & Beverages',
      sortOrder: 2,
    },
  });

  console.log('✅ Created categories');

  // Create demo products
  const laptop = await prisma.product.create({
    data: {
      tenantId: business.id,
      name: 'Laptop Dell Inspiron',
      categoryId: electronics.id,
      taxRate: 12,
      hasVariants: false,
      variants: {
        create: {
          tenantId: business.id,
          sku: 'LAPTOP-001',
          name: 'Dell Inspiron 15',
          barcode: '1234567890123',
          price: 8500000, // 8,500,000 UZS
          cost: 7000000,
          unit: 'шт',
        },
      },
    },
  });

  const water = await prisma.product.create({
    data: {
      tenantId: business.id,
      name: 'Mineral Water',
      categoryId: food.id,
      taxRate: 0,
      hasVariants: true,
      variants: {
        create: [
          {
            tenantId: business.id,
            sku: 'WATER-05L',
            name: 'Water 0.5L',
            barcode: '2000000000001',
            price: 3000,
            cost: 2000,
            unit: 'шт',
            attributes: { volume: '0.5L' },
          },
          {
            tenantId: business.id,
            sku: 'WATER-1L',
            name: 'Water 1L',
            barcode: '2000000000002',
            price: 5000,
            cost: 3500,
            unit: 'шт',
            attributes: { volume: '1L' },
          },
        ],
      },
    },
  });

  console.log('✅ Created products');

  // Create demo stock levels
  const laptopVariant = await prisma.productVariant.findFirst({
    where: { sku: 'LAPTOP-001' },
  });

  const waterVariants = await prisma.productVariant.findMany({
    where: { productId: water.id },
  });

  if (laptopVariant) {
    await prisma.stockLevel.create({
      data: {
        tenantId: business.id,
        storeId: store.id,
        variantId: laptopVariant.id,
        quantity: 10,
        reservedQuantity: 0,
      },
    });

    await prisma.stockBatch.create({
      data: {
        tenantId: business.id,
        storeId: store.id,
        variantId: laptopVariant.id,
        quantity: 10,
        costPrice: 7000000,
      },
    });
  }

  for (const variant of waterVariants) {
    await prisma.stockLevel.create({
      data: {
        tenantId: business.id,
        storeId: store.id,
        variantId: variant.id,
        quantity: 100,
        reservedQuantity: 0,
      },
    });

    await prisma.stockBatch.create({
      data: {
        tenantId: business.id,
        storeId: store.id,
        variantId: variant.id,
        quantity: 100,
        costPrice: variant.cost || 0,
      },
    });
  }

  console.log('✅ Created stock levels');

  console.log('🎉 Seeding completed!');
  console.log('\nDemo credentials:');
  console.log('  Email: admin@jowi.shop');
  console.log('  Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
