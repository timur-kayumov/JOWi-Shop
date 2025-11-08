const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanAllReceipts() {
  const tenantId = '424af838-23a4-40ae-bb7c-a7243106026e';

  console.log('🗑️  Deleting ALL receipts...\n');

  try {
    // Using Prisma ORM methods to avoid type casting issues
    const receipts = await prisma.receipt.findMany({
      where: { tenantId },
      select: { id: true }
    });

    console.log(`Found ${receipts.length} receipts to delete`);

    // Delete using Prisma deleteMany (handles cascade)
    const result = await prisma.receipt.deleteMany({
      where: { tenantId }
    });

    console.log(`  ✓ Deleted ${result.count} receipts (with items and payments)`);

    // Drop all receipt sequences
    console.log('\n🗑️  Dropping all receipt sequences...\n');

    const dropSeq = await prisma.$executeRaw`
      DO $$
      DECLARE
        seq RECORD;
      BEGIN
        FOR seq IN
          SELECT sequencename
          FROM pg_sequences
          WHERE sequencename LIKE 'receipt_seq_%'
        LOOP
          EXECUTE format('DROP SEQUENCE IF EXISTS %I', seq.sequencename);
          RAISE NOTICE 'Dropped sequence: %', seq.sequencename;
        END LOOP;
      END $$
    `;

    console.log('  ✓ All sequences dropped\n');
    console.log('✅ Database cleaned successfully!');
    console.log('🎯 Ready for fresh testing');
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanAllReceipts();
