import { createZodDto } from 'nestjs-zod';
import { createCustomerSchema } from '@jowi/validators';

export class CreateCustomerDto extends createZodDto(createCustomerSchema) {}
