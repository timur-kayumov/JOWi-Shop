import { createZodDto } from 'nestjs-zod';
import { updateCustomerSchema } from '@jowi/validators';

export class UpdateCustomerDto extends createZodDto(updateCustomerSchema) {}
