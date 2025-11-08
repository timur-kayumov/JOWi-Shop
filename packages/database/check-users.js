const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: 'user-benchmark-test' },
    select: {
      id: true,
      email: true,
      tenantId: true,
      role: true,
      isActive: true,
      firstName: true,
      lastName: true,
    },
  });

  console.log('Benchmark user:', JSON.stringify(user, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
