import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const searchTerm = 'фарход';
  const normalizedTerm = searchTerm.replace(/[-.\s]/g, '');
  const searchPattern = `%${normalizedTerm}%`;

  console.log('🔍 Testing collation solutions...\n');

  // Test with explicit COLLATE
  console.log('=== Test with COLLATE "ru_RU.utf8" ===');
  try {
    const test1 = await prisma.$queryRaw<any[]>`
      SELECT id, first_name, last_name
      FROM customers
      WHERE tenant_id = 'mock-tenant-id'
        AND LOWER(first_name) COLLATE "ru_RU.utf8" LIKE LOWER(${searchPattern}) COLLATE "ru_RU.utf8"
    `;
    console.log('Results:', test1.length);
    test1.forEach(c => console.log(`  - ${c.first_name} ${c.last_name}`));
  } catch (e: any) {
    console.log('Error:', e.message);
  }
  console.log('');

  // Test with C collation
  console.log('=== Test with COLLATE "C" ===');
  try {
    const test2 = await prisma.$queryRaw<any[]>`
      SELECT id, first_name, last_name
      FROM customers
      WHERE tenant_id = 'mock-tenant-id'
        AND LOWER(first_name) COLLATE "C" LIKE LOWER(${searchPattern}) COLLATE "C"
    `;
    console.log('Results:', test2.length);
    test2.forEach(c => console.log(`  - ${c.first_name} ${c.last_name}`));
  } catch (e: any) {
    console.log('Error:', e.message);
  }
  console.log('');

  // Test comparing bytes
  console.log('=== Test: Check LOWER() with Cyrillic ===');
  const test3 = await prisma.$queryRaw<any[]>`
    SELECT
      first_name,
      LOWER(first_name) as lower_name,
      first_name = 'Фарход' as exact_match,
      LOWER(first_name) = 'фарход' as lower_match,
      LOWER(first_name) LIKE '%фарход%' as like_match
    FROM customers
    WHERE tenant_id = 'mock-tenant-id'
  `;
  console.log('Results:');
  test3.forEach(c => {
    console.log(`  Name: ${c.first_name}`);
    console.log(`  LOWER: ${c.lower_name}`);
    console.log(`  Exact match: ${c.exact_match}`);
    console.log(`  Lower match: ${c.lower_match}`);
    console.log(`  LIKE match: ${c.like_match}`);
    console.log('');
  });

  // List available collations
  console.log('=== Available collations ===');
  const collations = await prisma.$queryRaw<any[]>`
    SELECT collname FROM pg_collation WHERE collname LIKE '%ru%' OR collname LIKE '%utf%' LIMIT 10;
  `;
  console.log('Collations:', collations.map(c => c.collname).join(', '));
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
