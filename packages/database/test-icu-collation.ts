import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const searchTerm = 'фарход';

  console.log('🔍 Testing with ICU collation...\n');

  // Test LOWER with ICU collation
  console.log('=== Test: LOWER() with proper locale ===');
  const test1 = await prisma.$queryRaw<any[]>`
    SELECT
      first_name,
      LOWER(first_name::text COLLATE "ru-RU-x-icu") as lower_name
    FROM customers
    WHERE tenant_id = 'mock-tenant-id'
  `;
  console.log('Results:');
  test1.forEach(c => {
    console.log(`  Original: ${c.first_name}`);
    console.log(`  LOWER with ICU: ${c.lower_name}`);
    console.log('');
  });

  // Test search with ICU
  console.log('=== Test: Search with ICU collation ===');
  const test2 = await prisma.$queryRaw<any[]>`
    SELECT id, first_name, last_name
    FROM customers
    WHERE tenant_id = 'mock-tenant-id'
      AND LOWER(first_name::text COLLATE "ru-RU-x-icu") LIKE LOWER(${`%${searchTerm}%`}::text COLLATE "ru-RU-x-icu")
  `;
  console.log(`Found ${test2.length} customers:`);
  test2.forEach(c => console.log(`  - ${c.first_name} ${c.last_name}`));
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
