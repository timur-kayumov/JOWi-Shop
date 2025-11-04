'use server';

import { prisma } from '@jowi/database';
import { getCustomerReceiptsSchema } from '@jowi/validators';

export async function getCustomerReceipts(params: {
  customerId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  storeId?: string;
  paymentMethod?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  // Validate input
  const validated = getCustomerReceiptsSchema.parse({
    ...params,
    page: params.page || 1,
    pageSize: params.pageSize || 10,
  });

  const {
    customerId,
    page,
    pageSize,
    search,
    storeId,
    paymentMethod,
    dateFrom,
    dateTo,
  } = validated;

  // Build where clause
  const where: any = {
    customerId,
    status: {
      in: ['completed', 'refunded', 'partially_refunded'],
    },
  };

  if (search) {
    where.receiptNumber = {
      contains: search,
      mode: 'insensitive',
    };
  }

  if (storeId) {
    where.storeId = storeId;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) {
      where.createdAt.gte = dateFrom;
    }
    if (dateTo) {
      where.createdAt.lte = dateTo;
    }
  }

  if (paymentMethod) {
    where.payments = {
      some: {
        method: paymentMethod,
      },
    };
  }

  // Get total count
  const total = await prisma.receipt.count({ where });

  // Get paginated receipts
  const receipts = await prisma.receipt.findMany({
    where,
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      },
      payments: true,
      store: {
        select: {
          id: true,
          name: true,
        },
      },
      employee: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      terminal: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    receipts,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
