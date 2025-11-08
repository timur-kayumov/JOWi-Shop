import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { Prisma } from '@jowi/database';

@Injectable()
export class ReceiptsService {
  constructor(private prisma: DatabaseService) {}

  async create(tenantId: string, createReceiptDto: CreateReceiptDto) {
    // Calculate totals
    let subtotal = new Prisma.Decimal(0);
    let taxAmount = new Prisma.Decimal(0);

    const items = createReceiptDto.items.map((item) => {
      const itemSubtotal = new Prisma.Decimal(item.price).mul(item.quantity);
      const itemDiscount = new Prisma.Decimal(item.discountAmount || 0);
      const itemTaxableAmount = itemSubtotal.minus(itemDiscount);
      const itemTax = itemTaxableAmount.mul(item.taxRate).div(100);
      const itemTotal = itemTaxableAmount.plus(itemTax);

      subtotal = subtotal.plus(itemSubtotal);
      taxAmount = taxAmount.plus(itemTax);

      return {
        variantId: item.variantId,
        quantity: new Prisma.Decimal(item.quantity),
        price: new Prisma.Decimal(item.price),
        discountAmount: itemDiscount,
        taxRate: new Prisma.Decimal(item.taxRate),
        total: itemTotal,
      };
    });

    const discountAmount = createReceiptDto.items.reduce(
      (sum, item) => sum.plus(item.discountAmount || 0),
      new Prisma.Decimal(0)
    );

    const total = subtotal.minus(discountAmount).plus(taxAmount);

    // Per-terminal sequences eliminate race conditions
    // Each terminal has its own sequence - no competition between terminals
    // Using default READ COMMITTED isolation for maximum performance
    const receipt = await this.prisma.$transaction(async (tx) => {
      // Generate receipt number using per-terminal database sequence
      // This is atomic and fast - no contention between terminals
      const result = await tx.$queryRaw<[{ generate_receipt_number: string }]>`
        SELECT generate_receipt_number(
          ${tenantId}::uuid,
          ${createReceiptDto.storeId}::uuid,
          ${createReceiptDto.terminalId}::uuid
        )
      `;
      const receiptNumber = result[0].generate_receipt_number;

      // Create receipt with generated number
      // No retry logic needed - per-terminal sequences guarantee uniqueness
      return await tx.receipt.create({
        data: {
          tenantId,
          storeId: createReceiptDto.storeId,
          terminalId: createReceiptDto.terminalId,
          receiptNumber,
          customerId: createReceiptDto.customerId,
          employeeId: createReceiptDto.employeeId,
          subtotal,
          discountAmount,
          taxAmount,
          total,
          status: 'completed',
          completedAt: new Date(),
          comment: createReceiptDto.comment,
          items: {
            create: items,
          },
          payments: {
            create: createReceiptDto.payments.map((p) => ({
              method: p.method,
              amount: new Prisma.Decimal(p.amount),
              reference: p.reference,
            })),
          },
        },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
          payments: true,
        },
      });
    });

    return receipt;
  }

  async findAll(tenantId: string, storeId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (storeId) {
      where.storeId = storeId;
    }

    const [receipts, total] = await Promise.all([
      this.prisma.receipt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          store: { select: { name: true } },
          terminal: { select: { name: true } },
          customer: { select: { firstName: true, lastName: true } },
          employee: { select: { user: { select: { firstName: true, lastName: true } } } },
          items: {
            include: {
              variant: {
                include: {
                  product: { select: { name: true } },
                },
              },
            },
          },
          payments: true,
        },
      }),
      this.prisma.receipt.count({ where }),
    ]);

    return {
      data: receipts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.receipt.findFirst({
      where: { id, tenantId },
      include: {
        store: true,
        terminal: true,
        customer: true,
        employee: {
          include: {
            user: true,
          },
        },
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        payments: true,
      },
    });
  }
}
