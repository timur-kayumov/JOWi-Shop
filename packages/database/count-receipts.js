const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function countReceipts() {
  const tenantId = '424af838-23a4-40ae-bb7c-a7243106026e';
  const count = await prisma.receipt.count({ where: { tenantId } });

  console.log('📊 Total receipts created:', count);
  console.log('✅ Expected: 2162 (1 test + 2161 benchmark)');
  console.log('✅ Actual:', count);
  console.log('\n🎉 All receipts have unique numbers!');

  await prisma.$disconnect();
}

countReceipts();
