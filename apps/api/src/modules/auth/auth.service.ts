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
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
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
    const { phone, name, password, businessType, businessName } = dto;

    // Check if user already exists
    const existingUser = await this.db.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с таким номером телефона уже существует');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Split name into firstName and lastName
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create business first
    const business = await this.db.business.create({
      data: {
        name: businessName,
        taxId: `TEMP-${Date.now()}`, // Temporary taxId until user provides real one
        currency: 'UZS',
        locale: 'ru', // Default to Russian, can be changed in settings
        isActive: true,
      },
    });

    // Generate email from phone for now (can be updated later by user)
    const email = `${phone}@jowi.uz`;

    // Create user
    const user = await this.db.user.create({
      data: {
        phone,
        firstName,
        lastName,
        email, // Generated email from phone
        password: hashedPassword,
        role: 'admin', // First user in business is always admin
        isActive: true,
        tenantId: business.id,
      },
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true,
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
   * Login existing user with password
   */
  async login(dto: LoginDto): Promise<{ success: boolean; user: any; accessToken: string }> {
    const { phone, password } = dto;

    // Find user by phone (include password for verification)
    const user = await this.db.user.findUnique({
      where: { phone },
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true, // Need password for verification
        role: true,
        tenantId: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Неверный номер телефона или пароль');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Аккаунт заблокирован');
    }

    // Verify password
    if (!user.password) {
      throw new UnauthorizedException('Пользователь не имеет пароля. Обратитесь к администратору.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный номер телефона или пароль');
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Generate JWT token
    const accessToken = this.generateAccessToken(user.id, user.tenantId, user.role, user.email);

    return {
      success: true,
      user: userWithoutPassword,
      accessToken,
    };
  }

  /**
   * Send OTP code for password reset
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ success: boolean; message: string }> {
    const { phone } = dto;

    // Check if user exists
    const user = await this.db.user.findUnique({
      where: { phone },
      select: { id: true, isActive: true },
    });

    if (!user) {
      throw new BadRequestException('Пользователь с таким номером не найден');
    }

    if (!user.isActive) {
      throw new BadRequestException('Аккаунт заблокирован');
    }

    // Check if there's an existing valid OTP request
    const existingOtp = await this.otpService.getPasswordResetRequest(phone);
    if (existingOtp) {
      const key = `password-reset:${phone}`;
      const ttl = await this.otpService['redis'].ttl(key);
      if (ttl > 240) {
        // Still more than 4 minutes left
        throw new BadRequestException(
          `Код уже отправлен. Повторная отправка возможна через ${Math.ceil(ttl - 240)} сек`
        );
      }
    }

    // Send verification code via Telegram
    const requestId = await this.telegramService.sendVerificationCode(phone);

    // Save password reset OTP request to Redis
    await this.otpService.savePasswordResetRequest(phone, requestId);

    return {
      success: true,
      message: 'Код для восстановления пароля отправлен на указанный номер',
    };
  }

  /**
   * Verify OTP code for password reset
   */
  async verifyPasswordResetOtp(dto: VerifyOtpDto): Promise<{ success: boolean; message: string }> {
    const { phone, otp } = dto;

    // Get password reset OTP request from Redis
    const otpData = await this.otpService.getPasswordResetRequest(phone);
    if (!otpData) {
      throw new BadRequestException('Код не найден или истек');
    }

    // Check if max attempts exceeded
    if (await this.otpService.hasExceededPasswordResetAttempts(phone)) {
      throw new BadRequestException('Превышено максимальное количество попыток');
    }

    // Check if expired
    if (await this.otpService.isPasswordResetOtpExpired(phone)) {
      throw new BadRequestException('Код истек. Запросите новый код');
    }

    // Verify code with Telegram
    const isValid = await this.telegramService.verifyCode(otpData.requestId, otp);

    if (!isValid) {
      // Increment attempts
      await this.otpService.incrementPasswordResetAttempts(phone);
      throw new UnauthorizedException('Неверный код');
    }

    return {
      success: true,
      message: 'Код подтвержден. Вы можете установить новый пароль',
    };
  }

  /**
   * Reset password with new password
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean; message: string }> {
    const { phone, otp, newPassword } = dto;

    // Verify OTP one more time
    const otpData = await this.otpService.getPasswordResetRequest(phone);
    if (!otpData) {
      throw new BadRequestException('Код не найден или истек');
    }

    // Verify code with Telegram
    const isValid = await this.telegramService.verifyCode(otpData.requestId, otp);
    if (!isValid) {
      throw new UnauthorizedException('Неверный код');
    }

    // Find user
    const user = await this.db.user.findUnique({
      where: { phone },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await this.db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete password reset OTP request
    await this.otpService.deletePasswordResetRequest(phone);

    return {
      success: true,
      message: 'Пароль успешно изменён',
    };
  }
}
