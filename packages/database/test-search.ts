import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const searchTerm = 'фарход';
  const normalizedTerm = searchTerm.replace(/[-.\s]/g, '');
  const searchPattern = `%${normalizedTerm}%`;

  console.log('🔍 Testing search...\n');
  console.log('Search term:', searchTerm);
  console.log('Normalized:', normalizedTerm);
  console.log('Pattern:', searchPattern);
  console.log('');

  // Test 1: Direct ILIKE without REPLACE
  console.log('=== Test 1: Direct ILIKE ===');
  const test1 = await prisma.$queryRaw<any[]>`
    SELECT id, first_name, last_name
    FROM customers
    WHERE tenant_id = 'mock-tenant-id'
      AND first_name ILIKE ${searchPattern}
  `;
  console.log('Results:', test1.length);
  test1.forEach(c => console.log(`  - ${c.first_name} ${c.last_name}`));
  console.log('');

  // Test 2: With REPLACE
  console.log('=== Test 2: With REPLACE (current implementation) ===');
  const test2 = await prisma.$queryRaw<any[]>`
    SELECT id, first_name, last_name
    FROM customers
    WHERE tenant_id = 'mock-tenant-id'
      AND REPLACE(REPLACE(REPLACE(first_name, '-', ''), '.', ''), ' ', '') ILIKE ${searchPattern}
  `;
  console.log('Results:', test2.length);
  test2.forEach(c => console.log(`  - ${c.first_name} ${c.last_name}`));
  console.log('');

  // Test 3: LOWER + LIKE
  console.log('=== Test 3: LOWER + LIKE ===');
  const test3 = await prisma.$queryRaw<any[]>`
    SELECT id, first_name, last_name
    FROM customers
    WHERE tenant_id = 'mock-tenant-id'
      AND LOWER(first_name) LIKE LOWER(${searchPattern})
  `;
  console.log('Results:', test3.length);
  test3.forEach(c => console.log(`  - ${c.first_name} ${c.last_name}`));
  console.log('');

  // Test 4: Check database collation
  console.log('=== Test 4: Check database encoding ===');
  const encoding = await prisma.$queryRaw<any[]>`
    SHOW SERVER_ENCODING;
  `;
  console.log('Server encoding:', encoding);

  const collation = await prisma.$queryRaw<any[]>`
    SHOW LC_COLLATE;
  `;
  console.log('LC_COLLATE:', collation);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
