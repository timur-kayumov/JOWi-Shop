import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface OTPData {
  phone: string;
  requestId: string;
  attempts: number;
  createdAt: number;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly redis: Redis;
  private readonly OTP_TTL = 300; // 5 minutes
  private readonly MAX_ATTEMPTS = 3;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);

    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });
  }

  /**
   * Save OTP request data to Redis
   */
  async saveOtpRequest(phone: string, requestId: string): Promise<void> {
    const key = this.getOtpKey(phone);
    const data: OTPData = {
      phone,
      requestId,
      attempts: 0,
      createdAt: Date.now(),
    };

    await this.redis.setex(key, this.OTP_TTL, JSON.stringify(data));
    this.logger.log(`OTP request saved for phone: +${phone}`);
  }

  /**
   * Get OTP request data from Redis
   */
  async getOtpRequest(phone: string): Promise<OTPData | null> {
    const key = this.getOtpKey(phone);
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  /**
   * Increment verification attempts
   */
  async incrementAttempts(phone: string): Promise<number> {
    const otpData = await this.getOtpRequest(phone);

    if (!otpData) {
      throw new Error('OTP request not found');
    }

    otpData.attempts += 1;

    const key = this.getOtpKey(phone);
    const ttl = await this.redis.ttl(key);
    await this.redis.setex(key, ttl, JSON.stringify(otpData));

    this.logger.log(`OTP attempts for +${phone}: ${otpData.attempts}/${this.MAX_ATTEMPTS}`);

    return otpData.attempts;
  }

  /**
   * Check if max attempts exceeded
   */
  async hasExceededAttempts(phone: string): Promise<boolean> {
    const otpData = await this.getOtpRequest(phone);
    return otpData ? otpData.attempts >= this.MAX_ATTEMPTS : false;
  }

  /**
   * Delete OTP request from Redis
   */
  async deleteOtpRequest(phone: string): Promise<void> {
    const key = this.getOtpKey(phone);
    await this.redis.del(key);
    this.logger.log(`OTP request deleted for phone: +${phone}`);
  }

  /**
   * Get Redis key for OTP
   */
  private getOtpKey(phone: string): string {
    return `otp:${phone}`;
  }

  /**
   * Check if OTP is expired
   */
  async isOtpExpired(phone: string): Promise<boolean> {
    const key = this.getOtpKey(phone);
    const ttl = await this.redis.ttl(key);
    return ttl <= 0;
  }

  /**
   * Get remaining time for OTP
   */
  async getRemainingTime(phone: string): Promise<number> {
    const key = this.getOtpKey(phone);
    const ttl = await this.redis.ttl(key);
    return Math.max(0, ttl);
  }
}
