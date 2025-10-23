/**
 * @jowi/database - Prisma client and database utilities
 */

import { PrismaClient } from '@prisma/client';

// Singleton Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Export Prisma types
export * from '@prisma/client';

// Utility functions for multi-tenancy
export function withTenant<T>(tenantId: string, operation: (prisma: PrismaClient) => Promise<T>): Promise<T> {
  // In production, this would set RLS context
  // For now, we rely on application-level filtering
  return operation(prisma);
}

export async function disconnect() {
  await prisma.$disconnect();
}
