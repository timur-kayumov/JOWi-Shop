import { verifyOtpSchema } from '@jowi/validators';
import { createZodDto } from 'nestjs-zod';

export class VerifyOtpDto extends createZodDto(verifyOtpSchema) {}
