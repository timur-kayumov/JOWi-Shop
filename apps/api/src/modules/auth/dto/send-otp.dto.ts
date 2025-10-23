import { sendOtpSchema } from '@jowi/validators';
import { createZodDto } from 'nestjs-zod';

export class SendOtpDto extends createZodDto(sendOtpSchema) {}
