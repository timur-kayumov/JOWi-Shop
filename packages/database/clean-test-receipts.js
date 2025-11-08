const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanReceipts() {
  const tenantId = '424af838-23a4-40ae-bb7c-a7243106026e';
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  console.log(`🗑️  Deleting all receipts with date pattern ${today}...`);

  const result = await prisma.receipt.deleteMany({
    where: {
      tenantId,
      receiptNumber: {
        contains: today,
      },
    },
  });

  console.log(`✅ Deleted ${result.count} receipts`);
  await prisma.$disconnect();
}

cleanReceipts();
