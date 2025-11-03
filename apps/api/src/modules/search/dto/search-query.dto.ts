import { IsString, IsOptional, IsArray, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchQueryDto {
  @IsString()
  @MinLength(2, { message: 'Search query must be at least 2 characters long' })
  query!: string;

  @IsOptional()
  @IsArray()
  @Type(() => String)
  types?: string[]; // Filter by entity types: 'store', 'employee', 'customer', 'product', 'category', 'receipt', 'document'

  @IsOptional()
  @IsString()
  tenantId?: string; // Filter by tenant (for super admin)
}
