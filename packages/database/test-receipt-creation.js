const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testReceiptCreation() {
  const tenantId = '424af838-23a4-40ae-bb7c-a7243106026e';

  console.log('🔍 Checking database data...\n');

  // Get test data
  const store = await prisma.store.findFirst({
    where: { tenantId },
  });
  console.log('Store:', store ? `${store.id} (${store.name})` : 'NOT FOUND');

  if (!store) {
    console.log('❌ No store found');
    return;
  }

  const terminal = await prisma.terminal.findFirst({
    where: { storeId: store.id },
  });
  console.log('Terminal:', terminal ? `${terminal.id} (${terminal.name})` : 'NOT FOUND');

  const employee = await prisma.employee.findFirst({
    where: { tenantId },
  });
  console.log('Employee:', employee ? `${employee.id}` : 'NOT FOUND');

  const variants = await prisma.productVariant.findMany({
    where: {
      product: { tenantId }
    },
    take: 2,
  });
  console.log('Variants:', variants.length, 'found');

  if (!terminal || !employee || variants.length < 2) {
    console.log('❌ Missing required data');
    return;
  }

  console.log('\n🚀 Attempting to create receipt...\n');

  try {
    // Test receipt creation
    const result = await prisma.$transaction(async (tx) => {
      // Generate receipt number
      const numberResult = await tx.$queryRaw`
        SELECT generate_receipt_number(
          ${tenantId}::uuid,
          ${store.id}::uuid,
          ${terminal.id}::uuid
        )
      `;
      console.log('Receipt number generated:', numberResult[0].generate_receipt_number);

      // Try to create receipt
      const receipt = await tx.receipt.create({
        data: {
          tenantId,
          storeId: store.id,
          terminalId: terminal.id,
          receiptNumber: numberResult[0].generate_receipt_number,
          employeeId: employee.id,
          subtotal: 14000,
          discountAmount: 1000,
          taxAmount: 1560,
          total: 14560,
          status: 'completed',
          completedAt: new Date(),
          comment: 'Test receipt',
          items: {
            create: [
              {
                variantId: variants[0].id,
                quantity: 1,
                price: 15000,
                discountAmount: 1000,
                taxRate: 12,
                total: 14560,
              }
            ],
          },
          payments: {
            create: [
              {
                method: 'cash',
                amount: 70000,
              }
            ],
          },
        },
      });

      return receipt;
    });

    console.log('✅ Receipt created successfully!', result.id);
  } catch (error) {
    console.log('❌ Error creating receipt:');
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    console.log('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testReceiptCreation();
