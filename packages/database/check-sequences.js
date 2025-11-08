const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSequences() {
  console.log('🔍 Checking all receipt sequences...\n');

  // Get all sequences that start with receipt_seq_
  const sequences = await prisma.$queryRaw`
    SELECT schemaname, sequencename, last_value
    FROM pg_sequences
    WHERE sequencename LIKE 'receipt_seq_%'
    ORDER BY sequencename
  `;

  if (sequences.length === 0) {
    console.log('❌ No receipt sequences found');
  } else {
    console.log(`Found ${sequences.length} receipt sequences:\n`);
    sequences.forEach(seq => {
      console.log(`  ${seq.sequencename}`);
      console.log(`    Schema: ${seq.schemaname}`);
      console.log(`    Last value: ${seq.last_value}`);
      console.log('');
    });
  }

  // Check if function exists
  const functionExists = await prisma.$queryRaw`
    SELECT EXISTS(
      SELECT 1 FROM pg_proc WHERE proname = 'generate_receipt_number'
    ) as exists
  `;

  console.log(`\n✅ Function generate_receipt_number exists: ${functionExists[0].exists}`);

  await prisma.$disconnect();
}

checkSequences().catch(error => {
  console.error('Error:', error.message);
  prisma.$disconnect();
  process.exit(1);
});
