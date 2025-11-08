const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkReceipts() {
  const tenantId = '424af838-23a4-40ae-bb7c-a7243106026e';

  console.log('🔍 Checking existing receipts...\n');

  // Check receipts with today's date pattern
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  console.log('Today date pattern:', today);

  const receipts = await prisma.receipt.findMany({
    where: {
      tenantId,
      receiptNumber: {
        contains: today,
      },
    },
    orderBy: {
      receiptNumber: 'desc',
    },
    take: 20,
  });

  console.log(`\nFound ${receipts.length} receipts with today's date:\n`);
  receipts.forEach((r) => {
    console.log(`  ${r.receiptNumber} (created at ${r.createdAt})`);
  });

  // Check sequence value
  const terminal = await prisma.terminal.findFirst({
    where: {
      store: { tenantId },
    },
  });

  if (terminal) {
    console.log(`\n📊 Checking sequence for terminal ${terminal.id}...\n`);

    const sequenceName = `receipt_seq_${tenantId.replace(/-/g, '_')}_${terminal.store.id.replace(/-/g, '_')}_${terminal.id.replace(/-/g, '_')}_${today}`;
    console.log('Expected sequence name:', sequenceName);

    try {
      const seqResult = await prisma.$queryRawUnsafe(`
        SELECT currval('${sequenceName}') as current_value
      `);
      console.log('Current sequence value:', seqResult[0]?.current_value);
    } catch (e) {
      console.log('Sequence not initialized yet or does not exist');
    }
  }

  await prisma.$disconnect();
}

checkReceipts();
