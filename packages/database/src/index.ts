/**
 * @jowi/database - Prisma client and database utilities
 */

import { PrismaClient } from '@prisma/client';

// Singleton Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Soft Delete Extension - Automatically filter out deleted records
// Note: In Prisma 5.x, middleware ($use) is deprecated. Use Client Extensions instead.
// For now, we'll keep the base client without soft delete middleware.
// Soft delete logic should be handled at the application level or via Prisma Client Extensions.
export const prisma = globalForPrisma.prisma ?? basePrisma;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Export Prisma types
export * from '@prisma/client';

/**
 * Execute a database operation with tenant isolation using Row-Level Security (RLS)
 *
 * This function:
 * 1. Sets the PostgreSQL session variable `app.tenant_id` to the provided tenantId
 * 2. Executes the operation within a transaction
 * 3. The RLS policies automatically filter all queries by this tenant_id
 *
 * Usage:
 * ```typescript
 * const products = await withTenant(tenantId, async (db) => {
 *   return db.product.findMany(); // Automatically filtered by tenant_id
 * });
 * ```
 *
 * @param tenantId - The UUID of the tenant to isolate data for
 * @param operation - The database operation to execute with tenant context
 * @returns Promise resolving to the operation result
 */
export async function withTenant<T>(
  tenantId: string,
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  // Validate tenant ID format (should be UUID)
  if (!tenantId || typeof tenantId !== 'string') {
    throw new Error('Invalid tenant ID: must be a non-empty string');
  }

  // Execute operation within a transaction to ensure session variable is scoped
  return prisma.$transaction(async (tx) => {
    // Set the PostgreSQL session variable for RLS
    // This variable is read by the current_tenant_id() function in RLS policies
    await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`);

    // Execute the operation with the tenant context set
    return operation(tx as PrismaClient);
  });
}

export async function disconnect() {
  await prisma.$disconnect();
}
