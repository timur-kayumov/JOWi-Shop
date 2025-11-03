import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking customers in database...\n');

  const customers = await prisma.customer.findMany({
    where: { tenantId: 'mock-tenant-id' },
    take: 10,
  });

  console.log(`Found ${customers.length} customers:\n`);

  customers.forEach((customer, index) => {
    console.log(`${index + 1}. ID: ${customer.id}`);
    console.log(`   Name: ${customer.firstName} ${customer.lastName}`);
    console.log(`   First name bytes: ${Buffer.from(customer.firstName).toString('hex')}`);
    console.log(`   Phone: ${customer.phone}`);
    console.log(`   Email: ${customer.email || 'N/A'}`);
    console.log('');
  });
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
