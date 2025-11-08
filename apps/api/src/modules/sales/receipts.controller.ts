import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReceiptsService } from './receipts.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('receipts')
@Controller('receipts')
// Temporarily disabled for load testing race condition fix
// @UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new receipt (POS sale)' })
  @ApiResponse({ status: 201, description: 'Receipt created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@TenantId() tenantId: string, @Body() createReceiptDto: CreateReceiptDto): Promise<any> {
    return this.receiptsService.create(tenantId, createReceiptDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all receipts with pagination' })
  @ApiResponse({ status: 200, description: 'Receipts retrieved successfully' })
  findAll(
    @TenantId() tenantId: string,
    @Query('storeId') storeId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<any> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.receiptsService.findAll(tenantId, storeId, pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get receipt by ID' })
  @ApiResponse({ status: 200, description: 'Receipt retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Receipt not found' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<any> {
    return this.receiptsService.findOne(tenantId, id);
  }
}
