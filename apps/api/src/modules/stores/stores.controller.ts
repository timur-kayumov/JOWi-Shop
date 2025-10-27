import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('stores')
@Controller('stores')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @ApiOperation({ summary: 'Create new store' })
  @ApiResponse({ status: 201, description: 'Store created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@TenantId() tenantId: string, @Body() createStoreDto: CreateStoreDto) {
    return this.storesService.create(tenantId, createStoreDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all stores with pagination and search' })
  @ApiResponse({ status: 200, description: 'Stores retrieved successfully' })
  findAll(
    @TenantId() tenantId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.storesService.findAll(tenantId, search, pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store by ID' })
  @ApiResponse({ status: 200, description: 'Store retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.storesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update store' })
  @ApiResponse({ status: 200, description: 'Store updated successfully' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateStoreDto
  ) {
    return this.storesService.update(tenantId, id, updateStoreDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete store (soft delete)' })
  @ApiResponse({ status: 200, description: 'Store deleted successfully' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.storesService.remove(tenantId, id);
  }
}
