import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CacheService } from '../cache/cache.module';
import { Cacheable, CacheEvict, injectCacheService } from '@jowi/cache';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService implements OnModuleInit {
  constructor(
    private readonly db: DatabaseService,
    private readonly cacheService: CacheService,
  ) {}

  onModuleInit() {
    injectCacheService(this, this.cacheService);
  }

  @CacheEvict({ pattern: 'customers:*' })
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

  @Cacheable({
    keyPrefix: 'customers:list',
    ttl: 300, // 5 minutes cache for customer list
    keyGenerator: (
      tenantId: string,
      search?: string,
      gender?: string,
      birthYearFrom?: number,
      birthYearTo?: number,
      page: number = 1,
      limit: number = 20
    ) => {
      return `${tenantId}:${search || 'all'}:${gender || 'all'}:${birthYearFrom || 'any'}:${birthYearTo || 'any'}:${page}:${limit}`;
    },
  })
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

  @Cacheable({
    keyPrefix: 'customers:one',
    ttl: 1800, // 30 minutes cache for single customer
    keyGenerator: (tenantId: string, id: string) => `${tenantId}:${id}`,
  })
  async findOne(tenantId: string, id: string): Promise<any> {
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

  @CacheEvict({ pattern: 'customers:*' })
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

  @CacheEvict({ pattern: 'customers:*' })
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
