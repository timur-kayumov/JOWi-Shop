import { forgotPasswordSchema } from '@jowi/validators';
import { createZodDto } from 'nestjs-zod';

export class ForgotPasswordDto extends createZodDto(forgotPasswordSchema) {}
