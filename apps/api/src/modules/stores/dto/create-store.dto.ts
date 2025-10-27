import { createZodDto } from 'nestjs-zod';
import { createStoreSchema } from '@jowi/validators';

export class CreateStoreDto extends createZodDto(createStoreSchema) {}
