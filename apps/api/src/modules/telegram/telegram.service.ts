import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendVerificationMessageRequest {
  phone_number: string;
  code_length?: number;
}

interface SendVerificationMessageResponse {
  request_id: string;
  success: boolean;
}

interface CheckVerificationStatusRequest {
  request_id: string;
  code: string;
}

interface CheckVerificationStatusResponse {
  request_id: string;
  success: boolean;
  verification_status: 'code_valid' | 'code_invalid' | 'expired' | 'code_max_attempts_exceeded';
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly apiToken: string;
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiToken = this.configService.get<string>('TELEGRAM_GATEWAY_API_TOKEN');
    this.apiUrl = this.configService.get<string>('TELEGRAM_GATEWAY_API_URL');

    if (!this.apiToken) {
      this.logger.warn(
        'TELEGRAM_GATEWAY_API_TOKEN is not set. SMS verification will not work.'
      );
    }
  }

  /**
   * Send verification code to phone number via Telegram
   */
  async sendVerificationCode(phoneNumber: string): Promise<string> {
    if (!this.apiToken) {
      this.logger.warn('Telegram Gateway not configured, using mock verification');
      return 'mock-request-id';
    }

    try {
      const payload: SendVerificationMessageRequest = {
        phone_number: `+${phoneNumber}`,
        code_length: 6,
      };

      this.logger.log(`Sending verification code to +${phoneNumber}`);

      const response = await fetch(`${this.apiUrl}/sendVerificationMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Telegram Gateway API error: ${response.status} - ${errorText}`
        );
        throw new Error(`Failed to send verification code: ${response.statusText}`);
      }

      const data: SendVerificationMessageResponse = await response.json();

      if (!data.success) {
        throw new Error('Telegram Gateway returned success=false');
      }

      this.logger.log(
        `Verification code sent successfully. Request ID: ${data.request_id}`
      );

      return data.request_id;
    } catch (error) {
      this.logger.error(`Error sending verification code: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify OTP code
   */
  async verifyCode(requestId: string, code: string): Promise<boolean> {
    if (!this.apiToken) {
      this.logger.warn('Telegram Gateway not configured, using mock verification');
      // Mock verification: accept code "123456" for testing
      return code === '123456';
    }

    try {
      const payload: CheckVerificationStatusRequest = {
        request_id: requestId,
        code,
      };

      this.logger.log(`Verifying code for request ID: ${requestId}`);

      const response = await fetch(`${this.apiUrl}/checkVerificationStatus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Telegram Gateway API error: ${response.status} - ${errorText}`
        );
        throw new Error(`Failed to verify code: ${response.statusText}`);
      }

      const data: CheckVerificationStatusResponse = await response.json();

      const isValid = data.verification_status === 'code_valid';

      this.logger.log(
        `Code verification result: ${data.verification_status} (valid=${isValid})`
      );

      return isValid;
    } catch (error) {
      this.logger.error(`Error verifying code: ${error.message}`, error.stack);
      throw error;
    }
  }
}
