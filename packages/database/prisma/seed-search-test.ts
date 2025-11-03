import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_ID = 'mock-tenant-id';

async function main() {
  console.log('🌱 Seeding database with test data for search...');

  // 1. Create Business (Tenant)
  const business = await prisma.business.upsert({
    where: { id: TENANT_ID },
    update: {},
    create: {
      id: TENANT_ID,
      name: 'Тестовая компания',
      taxId: '123456789',
      currency: 'UZS',
      locale: 'ru',
    },
  });
  console.log('✅ Business created:', business.name);

  // 2. Create Stores
  const store1 = await prisma.store.upsert({
    where: { id: 'store-1' },
    update: {},
    create: {
      id: 'store-1',
      tenantId: TENANT_ID,
      name: 'Магазин "Центральный"',
      address: 'ул. Амира Темура, 15',
      phone: '+998901234567',
      city: 'Ташкент',
      country: 'Uzbekistan',
    },
  });

  const store2 = await prisma.store.upsert({
    where: { id: 'store-2' },
    update: {},
    create: {
      id: 'store-2',
      tenantId: TENANT_ID,
      name: 'Магазин "Чиланзар"',
      address: 'Чиланзарский район, 12 квартал',
      phone: '+998907654321',
      city: 'Ташкент',
      country: 'Uzbekistan',
    },
  });
  console.log('✅ Stores created:', store1.name, store2.name);

  // 3. Create Users and Employees
  const user1 = await prisma.user.upsert({
    where: { phone: '+998901111111' },
    update: {},
    create: {
      tenantId: TENANT_ID,
      phone: '+998901111111',
      email: 'alisher.karimov@example.com',
      firstName: 'Алишер',
      lastName: 'Каримов',
      role: 'CASHIER',
    },
  });

  const employee1 = await prisma.employee.upsert({
    where: { id: 'employee-1' },
    update: {},
    create: {
      id: 'employee-1',
      tenantId: TENANT_ID,
      userId: user1.id,
      storeId: store1.id,
      citizenship: 'Uzbekistan',
      passportSeries: 'AA',
      passportNumber: '1234567',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { phone: '+998902222222' },
    update: {},
    create: {
      tenantId: TENANT_ID,
      phone: '+998902222222',
      email: 'nodira.salimova@example.com',
      firstName: 'Нодира',
      lastName: 'Салимова',
      role: 'MANAGER',
    },
  });

  const employee2 = await prisma.employee.upsert({
    where: { id: 'employee-2' },
    update: {},
    create: {
      id: 'employee-2',
      tenantId: TENANT_ID,
      userId: user2.id,
      storeId: store2.id,
      citizenship: 'Uzbekistan',
      passportSeries: 'AB',
      passportNumber: '7654321',
    },
  });
  console.log('✅ Employees created:', user1.firstName, user2.firstName);

  // 4. Create Customers
  const customer1 = await prisma.customer.upsert({
    where: { id: 'customer-1' },
    update: {},
    create: {
      id: 'customer-1',
      tenantId: TENANT_ID,
      firstName: 'Фарход',
      lastName: 'Усманов',
      phone: '+998903333333',
      email: 'farhod.usmanov@example.com',
      loyaltyCardNumber: 'CARD-001',
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: 'customer-2' },
    update: {},
    create: {
      id: 'customer-2',
      tenantId: TENANT_ID,
      firstName: 'Малика',
      lastName: 'Ибрагимова',
      phone: '+998904444444',
      loyaltyCardNumber: 'CARD-002',
    },
  });
  console.log('✅ Customers created:', customer1.firstName, customer2.firstName);

  // 5. Create Categories
  const category1 = await prisma.category.upsert({
    where: { id: 'category-1' },
    update: {},
    create: {
      id: 'category-1',
      tenantId: TENANT_ID,
      name: 'Напитки',
      icon: 'Coffee',
      color: '#3B82F6',
      sortOrder: 1,
    },
  });

  const category2 = await prisma.category.upsert({
    where: { id: 'category-2' },
    update: {},
    create: {
      id: 'category-2',
      tenantId: TENANT_ID,
      name: 'Снеки',
      icon: 'Cookie',
      color: '#F59E0B',
      sortOrder: 2,
    },
  });

  const category3 = await prisma.category.upsert({
    where: { id: 'category-3' },
    update: {},
    create: {
      id: 'category-3',
      tenantId: TENANT_ID,
      name: 'Молочные продукты',
      icon: 'Milk',
      color: '#10B981',
      sortOrder: 3,
    },
  });
  console.log('✅ Categories created:', category1.name, category2.name, category3.name);

  // 6. Create Products and Variants
  const product1 = await prisma.product.upsert({
    where: { id: 'product-1' },
    update: {},
    create: {
      id: 'product-1',
      tenantId: TENANT_ID,
      name: 'Coca-Cola',
      categoryId: category1.id,
      description: 'Газированный напиток',
      hasVariants: true,
    },
  });

  const variant1 = await prisma.productVariant.upsert({
    where: { id: 'variant-1' },
    update: {},
    create: {
      id: 'variant-1',
      tenantId: TENANT_ID,
      productId: product1.id,
      name: 'Coca-Cola 0.5л',
      sku: 'COCA-500',
      barcode: '4820024700016',
      price: 8000,
      cost: 5000,
    },
  });

  const variant2 = await prisma.productVariant.upsert({
    where: { id: 'variant-2' },
    update: {},
    create: {
      id: 'variant-2',
      tenantId: TENANT_ID,
      productId: product1.id,
      name: 'Coca-Cola 1.5л',
      sku: 'COCA-1500',
      barcode: '4820024700023',
      price: 15000,
      cost: 10000,
    },
  });

  const product2 = await prisma.product.upsert({
    where: { id: 'product-2' },
    update: {},
    create: {
      id: 'product-2',
      tenantId: TENANT_ID,
      name: 'Lays',
      categoryId: category2.id,
      description: 'Картофельные чипсы',
      hasVariants: true,
    },
  });

  const variant3 = await prisma.productVariant.upsert({
    where: { id: 'variant-3' },
    update: {},
    create: {
      id: 'variant-3',
      tenantId: TENANT_ID,
      productId: product2.id,
      name: 'Lays сметана-лук 80г',
      sku: 'LAYS-80',
      barcode: '4820024710016',
      price: 6000,
      cost: 4000,
    },
  });

  const product3 = await prisma.product.upsert({
    where: { id: 'product-3' },
    update: {},
    create: {
      id: 'product-3',
      tenantId: TENANT_ID,
      name: 'Молоко "Тошкент Сути"',
      categoryId: category3.id,
      description: 'Пастеризованное молоко',
      hasVariants: true,
    },
  });

  const variant4 = await prisma.productVariant.upsert({
    where: { id: 'variant-4' },
    update: {},
    create: {
      id: 'variant-4',
      tenantId: TENANT_ID,
      productId: product3.id,
      name: 'Молоко "Тошкент Сути" 1л 2.5%',
      sku: 'MILK-1L',
      barcode: '4870024700016',
      price: 12000,
      cost: 8000,
    },
  });
  console.log('✅ Products created:', product1.name, product2.name, product3.name);

  // 7. Create Stock Levels
  await prisma.stockLevel.upsert({
    where: { id: 'stock-1' },
    update: {},
    create: {
      id: 'stock-1',
      tenantId: TENANT_ID,
      storeId: store1.id,
      variantId: variant1.id,
      quantity: 50,
      reservedQuantity: 0,
    },
  });

  await prisma.stockLevel.upsert({
    where: { id: 'stock-2' },
    update: {},
    create: {
      id: 'stock-2',
      tenantId: TENANT_ID,
      storeId: store1.id,
      variantId: variant3.id,
      quantity: 30,
      reservedQuantity: 0,
    },
  });
  console.log('✅ Stock levels created');

  // 8. Create Terminal
  const terminal = await prisma.terminal.upsert({
    where: { deviceId: 'TERM-001' },
    update: {},
    create: {
      id: 'terminal-1',
      tenantId: TENANT_ID,
      storeId: store1.id,
      name: 'Касса 1',
      deviceId: 'TERM-001',
    },
  });
  console.log('✅ Terminal created:', terminal.name);

  // 9. Create Receipt
  const receipt = await prisma.receipt.upsert({
    where: { id: 'receipt-1' },
    update: {},
    create: {
      id: 'receipt-1',
      tenantId: TENANT_ID,
      storeId: store1.id,
      terminalId: terminal.id,
      employeeId: employee1.id,
      customerId: customer1.id,
      receiptNumber: 'R-2024-001',
      status: 'COMPLETED',
      subtotal: 14000,
      discountAmount: 0,
      taxAmount: 1680,
      total: 15680,
    },
  });
  console.log('✅ Receipt created:', receipt.receiptNumber);

  // 10. Create Movement Document
  const document = await prisma.movementDocument.upsert({
    where: { id: 'doc-1' },
    update: {},
    create: {
      id: 'doc-1',
      tenantId: TENANT_ID,
      storeId: store1.id,
      documentNumber: 'DOC-2024-001',
      type: 'receipt',
      status: 'DRAFT',
      notes: 'Приход товара от поставщика',
    },
  });
  console.log('✅ Movement document created:', document.documentNumber);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
