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
      city: 'Tashkent',
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
      firstName: 'Admin',
      lastName: 'User',
      phone: '+998901234567',
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
      citizenship: 'UZ',
      passportSeries: 'AA',
      passportNumber: '1234567',
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

  // Create demo customers
  const customer1 = await prisma.customer.create({
    data: {
      tenantId: business.id,
      firstName: 'Aziz',
      lastName: 'Karimov',
      phone: '+998901111111',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      tenantId: business.id,
      firstName: 'Dilnoza',
      lastName: 'Saidova',
      phone: '+998902222222',
      email: 'dilnoza@example.uz',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      tenantId: business.id,
      firstName: 'Rustam',
      lastName: 'Tashkentov',
      phone: '+998903333333',
    },
  });

  console.log('✅ Created customers');

  // Create demo shift
  const shift = await prisma.shift.create({
    data: {
      tenantId: business.id,
      terminalId: terminal.id,
      employeeId: employee.id,
      shiftNumber: 1,
      openingCash: 500000, // 500,000 UZS starting cash
    },
  });

  console.log('✅ Created shift');

  // Create demo receipts
  const receipt1 = await prisma.receipt.create({
    data: {
      tenantId: business.id,
      storeId: store.id,
      terminalId: terminal.id,
      employeeId: employee.id,
      customerId: customer1.id,
      receiptNumber: 'RCP-001',
      subtotal: 8500000,
      discountAmount: 0,
      taxAmount: 1020000,
      total: 9520000,
      status: 'completed',
      items: {
        create: {
          variantId: laptopVariant!.id,
          quantity: 1,
          price: 8500000,
          discountAmount: 0,
          taxRate: 12,
          total: 9520000,
        },
      },
      payments: {
        create: {
          method: 'card',
          amount: 9520000,
        },
      },
    },
  });

  const waterVariant1 = waterVariants[0];
  const waterVariant2 = waterVariants[1];

  const receipt2 = await prisma.receipt.create({
    data: {
      tenantId: business.id,
      storeId: store.id,
      terminalId: terminal.id,
      employeeId: employee.id,
      customerId: customer2.id,
      receiptNumber: 'RCP-002',
      subtotal: 23000,
      discountAmount: 0,
      taxAmount: 0,
      total: 23000,
      status: 'completed',
      items: {
        create: [
          {
            variantId: waterVariant1.id,
            quantity: 4,
            price: 3000,
            discountAmount: 0,
            taxRate: 0,
            total: 12000,
          },
          {
            variantId: waterVariant2.id,
            quantity: 2,
            price: 5000,
            discountAmount: 0,
            taxRate: 0,
            total: 10000,
          },
        ],
      },
      payments: {
        create: {
          method: 'cash',
          amount: 23000,
        },
      },
    },
  });

  const receipt3 = await prisma.receipt.create({
    data: {
      tenantId: business.id,
      storeId: store.id,
      terminalId: terminal.id,
      employeeId: employee.id,
      customerId: customer3.id,
      receiptNumber: 'RCP-003',
      subtotal: 15000,
      discountAmount: 0,
      taxAmount: 0,
      total: 15000,
      status: 'completed',
      items: {
        create: {
          variantId: waterVariant2.id,
          quantity: 3,
          price: 5000,
          discountAmount: 0,
          taxRate: 0,
          total: 15000,
        },
      },
      payments: {
        create: {
          method: 'cash',
          amount: 15000,
        },
      },
    },
  });

  console.log('✅ Created receipts');

  console.log('🎉 Seeding completed!');
  console.log('\nDemo credentials:');
  console.log('  Email: admin@jowi.shop');
  console.log('  Password: admin123');
  console.log('\nDemo data:');
  console.log('  - 1 business, 1 store, 1 terminal');
  console.log('  - 2 categories, 2 products (3 variants)');
  console.log('  - 3 customers');
  console.log('  - 1 active shift');
  console.log('  - 3 receipts (total: 9,558,000 UZS)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
