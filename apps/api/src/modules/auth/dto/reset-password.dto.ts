import { resetPasswordSchema } from '@jowi/validators';
import { createZodDto } from 'nestjs-zod';

export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
