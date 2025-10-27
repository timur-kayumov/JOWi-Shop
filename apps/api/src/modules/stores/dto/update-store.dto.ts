import { createZodDto } from 'nestjs-zod';
import { updateStoreSchema } from '@jowi/validators';

export class UpdateStoreDto extends createZodDto(updateStoreSchema) {}
