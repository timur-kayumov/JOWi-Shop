import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly db: DatabaseService) {}

  async create(tenantId: string, createCustomerDto: CreateCustomerDto) {
    try {
      const customer = await this.db.customer.create({
        data: {
          ...createCustomerDto,
          tenantId,
        },
      });

      return customer;
    } catch (error) {
      throw new BadRequestException('Failed to create customer');
    }
  }

  async findAll(
    tenantId: string,
    search?: string,
    gender?: string,
    birthYearFrom?: number,
    birthYearTo?: number,
    page: number = 1,
    limit: number = 20
  ) {
    const where: any = {
      tenantId,
      deletedAt: null,
    };

    // Search by name or phone
    if (search) {
      where.OR = [
        {
          firstName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          phone: {
            contains: search,
          },
        },
      ];
    }

    // Filter by gender
    if (gender) {
      where.gender = gender;
    }

    // Filter by birth year range
    if (birthYearFrom || birthYearTo) {
      where.dateOfBirth = {};
      if (birthYearFrom) {
        where.dateOfBirth.gte = new Date(`${birthYearFrom}-01-01`);
      }
      if (birthYearTo) {
        where.dateOfBirth.lte = new Date(`${birthYearTo}-12-31`);
      }
    }

    const [customers, total] = await Promise.all([
      this.db.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.customer.count({ where }),
    ]);

    return {
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const customer = await this.db.customer.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        receipts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
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
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async update(tenantId: string, id: string, updateCustomerDto: UpdateCustomerDto) {
    // Check if customer exists
    await this.findOne(tenantId, id);

    try {
      const updatedCustomer = await this.db.customer.update({
        where: { id },
        data: updateCustomerDto,
      });

      return updatedCustomer;
    } catch (error) {
      throw new BadRequestException('Failed to update customer');
    }
  }

  async remove(tenantId: string, id: string) {
    // Check if customer exists
    await this.findOne(tenantId, id);

    // Soft delete
    await this.db.customer.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: 'Customer deleted successfully' };
  }
}
