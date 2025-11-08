import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CacheService } from '../cache/cache.module';
import { Cacheable, CacheEvict, injectCacheService } from '@jowi/cache';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService implements OnModuleInit {
  constructor(
    private readonly db: DatabaseService,
    private readonly cacheService: CacheService,
  ) {}

  onModuleInit() {
    injectCacheService(this, this.cacheService);
  }

  @CacheEvict({ pattern: 'stores:*' })
  async create(tenantId: string, createStoreDto: CreateStoreDto) {
    try {
      const store = await this.db.store.create({
        data: {
          ...createStoreDto,
          tenantId,
        },
      });

      return store;
    } catch (error) {
      throw new BadRequestException('Failed to create store');
    }
  }

  @Cacheable({
    keyPrefix: 'stores:list',
    ttl: 300, // 5 minutes cache for store list
    keyGenerator: (tenantId: string, search?: string, page: number = 1, limit: number = 20) => {
      return `${tenantId}:${search || 'all'}:${page}:${limit}`;
    },
  })
  async findAll(
    tenantId: string,
    search?: string,
    page: number = 1,
    limit: number = 20
  ) {
    const where = {
      tenantId,
      deletedAt: null,
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }),
    };

    const [stores, total] = await Promise.all([
      this.db.store.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.store.count({ where }),
    ]);

    return {
      data: stores,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Cacheable({
    keyPrefix: 'stores:one',
    ttl: 3600, // 1 hour cache for single store
    keyGenerator: (tenantId: string, id: string) => `${tenantId}:${id}`,
  })
  async findOne(tenantId: string, id: string) {
    const store = await this.db.store.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }

    return store;
  }

  @CacheEvict({ pattern: 'stores:*' })
  async update(tenantId: string, id: string, updateStoreDto: UpdateStoreDto) {
    // Check if store exists
    await this.findOne(tenantId, id);

    try {
      const updatedStore = await this.db.store.update({
        where: { id },
        data: updateStoreDto,
      });

      return updatedStore;
    } catch (error) {
      throw new BadRequestException('Failed to update store');
    }
  }

  @CacheEvict({ pattern: 'stores:*' })
  async remove(tenantId: string, id: string) {
    // Check if store exists
    await this.findOne(tenantId, id);

    // Soft delete
    await this.db.store.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return { message: 'Store deleted successfully' };
  }
}
