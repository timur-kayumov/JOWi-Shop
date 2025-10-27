import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(private readonly db: DatabaseService) {}

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
