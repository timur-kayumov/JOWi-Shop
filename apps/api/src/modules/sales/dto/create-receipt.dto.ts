import { IsString, IsUUID, IsOptional, IsArray, ValidateNested, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReceiptItemDto {
  @ApiProperty({ description: 'Product variant ID' })
  @IsString()
  variantId!: string;

  @ApiProperty({ description: 'Quantity', example: 2 })
  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @ApiProperty({ description: 'Price per unit (UZS)', example: 15000 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ description: 'Discount amount (UZS)', example: 1000, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountAmount?: number;

  @ApiProperty({ description: 'Tax rate (%)', example: 12 })
  @IsNumber()
  @Min(0)
  taxRate!: number;
}

export class CreatePaymentDto {
  @ApiProperty({ description: 'Payment method', enum: ['cash', 'card', 'transfer', 'installment'] })
  @IsEnum(['cash', 'card', 'transfer', 'installment'])
  method!: string;

  @ApiProperty({ description: 'Payment amount (UZS)', example: 50000 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ description: 'Payment reference (e.g., card transaction ID)', required: false })
  @IsString()
  @IsOptional()
  reference?: string;
}

export class CreateReceiptDto {
  @ApiProperty({ description: 'Store ID' })
  @IsString()
  storeId!: string;

  @ApiProperty({ description: 'Terminal ID' })
  @IsString()
  terminalId!: string;

  @ApiProperty({ description: 'Customer ID (optional)', required: false })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ description: 'Employee ID' })
  @IsString()
  employeeId!: string;

  @ApiProperty({ description: 'Receipt items', type: [CreateReceiptItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReceiptItemDto)
  items!: CreateReceiptItemDto[];

  @ApiProperty({ description: 'Payment methods', type: [CreatePaymentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentDto)
  payments!: CreatePaymentDto[];

  @ApiProperty({ description: 'Comment (optional)', required: false })
  @IsString()
  @IsOptional()
  comment?: string;
}
