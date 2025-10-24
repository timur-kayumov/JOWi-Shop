import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { TelegramService } from '../telegram/telegram.service';
import { OtpService } from './otp.service';
import { RegisterDto } from './dto/register.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly telegramService: TelegramService,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Generate JWT access token
   */
  private generateAccessToken(userId: string, tenantId: string, role: string, email: string): string {
    const payload: JwtPayload = {
      sub: userId,
      tenant_id: tenantId,
      role,
      email,
    };
    return this.jwtService.sign(payload);
  }

  /**
   * Send OTP code to phone number
   */
  async sendOtp(dto: SendOtpDto): Promise<{ success: boolean; message: string }> {
    const { phone } = dto;

    // Check if there's an existing valid OTP request
    const existingOtp = await this.otpService.getOtpRequest(phone);
    if (existingOtp) {
      const remainingTime = await this.otpService.getRemainingTime(phone);
      if (remainingTime > 240) {
        // Still more than 4 minutes left
        throw new BadRequestException(
          `Код уже отправлен. Повторная отправка возможна через ${Math.ceil(remainingTime - 240)} сек`
        );
      }
    }

    // Send verification code via Telegram
    const requestId = await this.telegramService.sendVerificationCode(phone);

    // Save OTP request to Redis
    await this.otpService.saveOtpRequest(phone, requestId);

    return {
      success: true,
      message: 'Код отправлен на указанный номер',
    };
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<{ success: boolean; message: string }> {
    const { phone, otp } = dto;

    // Get OTP request from Redis
    const otpData = await this.otpService.getOtpRequest(phone);
    if (!otpData) {
      throw new BadRequestException('Код не найден или истек');
    }

    // Check if max attempts exceeded
    if (await this.otpService.hasExceededAttempts(phone)) {
      throw new BadRequestException('Превышено максимальное количество попыток');
    }

    // Check if expired
    if (await this.otpService.isOtpExpired(phone)) {
      throw new BadRequestException('Код истек. Запросите новый код');
    }

    // Verify code with Telegram
    const isValid = await this.telegramService.verifyCode(otpData.requestId, otp);

    if (!isValid) {
      // Increment attempts
      await this.otpService.incrementAttempts(phone);
      throw new UnauthorizedException('Неверный код');
    }

    // Delete OTP request (code verified successfully)
    await this.otpService.deleteOtpRequest(phone);

    return {
      success: true,
      message: 'Код подтвержден',
    };
  }

  /**
   * Register new user
   */
  async register(dto: RegisterDto): Promise<{ success: boolean; user: any; accessToken: string }> {
    const { email, name, password, businessName, taxId, locale } = dto;

    // Check if user already exists
    const existingUser = await this.db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create business first
    const business = await this.db.business.create({
      data: {
        name: businessName,
        taxId: taxId || `TEMP-${Date.now()}`, // Temporary taxId if not provided
        currency: 'UZS',
        locale: locale || 'ru',
        isActive: true,
      },
    });

    // Create user
    const user = await this.db.user.create({
      data: {
        phone: email.split('@')[0], // Extract phone from email or use email prefix
        name,
        email,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        tenantId: business.id,
      },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const accessToken = this.generateAccessToken(user.id, user.tenantId, user.role, user.email);

    return {
      success: true,
      user,
      accessToken,
    };
  }

  /**
   * Login existing user
   */
  async login(dto: VerifyOtpDto): Promise<{ success: boolean; user: any; accessToken: string }> {
    const { phone } = dto;

    // Find user by phone
    const user = await this.db.user.findUnique({
      where: { phone },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Аккаунт заблокирован');
    }

    // Generate JWT token
    const accessToken = this.generateAccessToken(user.id, user.tenantId, user.role, user.email);

    return {
      success: true,
      user,
      accessToken,
    };
  }
}
