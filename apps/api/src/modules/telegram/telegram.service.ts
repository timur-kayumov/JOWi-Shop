import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendVerificationMessageRequest {
  phone_number: string;
  code_length?: number;
}

interface DeliveryStatus {
  status: 'sent' | 'delivered' | 'read' | 'expired' | 'revoked';
  updated_at: number;
}

interface VerificationStatus {
  status: 'code_valid' | 'code_invalid' | 'code_max_attempts_exceeded' | 'expired';
  updated_at: number;
  code_entered?: string;
}

interface RequestStatus {
  request_id: string;
  phone_number: string;
  request_cost: number;
  remaining_balance?: number;
  delivery_status?: DeliveryStatus;
  verification_status?: VerificationStatus;
  payload?: string;
}

interface TelegramGatewayResponse<T = any> {
  ok: boolean;
  result?: T;
  error?: string;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly apiToken: string;
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiToken = this.configService.get<string>('TELEGRAM_GATEWAY_API_TOKEN') || '';
    this.apiUrl = this.configService.get<string>('TELEGRAM_GATEWAY_API_URL') || 'https://gatewayapi.telegram.org';

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

      const data = (await response.json()) as TelegramGatewayResponse<RequestStatus>;

      if (!data.ok || !data.result) {
        this.logger.error(`Telegram Gateway returned error: ${data.error || 'Unknown error'}`);
        throw new Error(data.error || 'Failed to send verification code');
      }

      this.logger.log(
        `Verification code sent successfully. Request ID: ${data.result.request_id}, Cost: ${data.result.request_cost}`
      );

      return data.result.request_id;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error sending verification code: ${err.message}`, err.stack);
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
      const payload = {
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

      const data = (await response.json()) as TelegramGatewayResponse<RequestStatus>;

      if (!data.ok || !data.result) {
        this.logger.error(`Telegram Gateway returned error: ${data.error || 'Unknown error'}`);
        throw new Error(data.error || 'Failed to verify code');
      }

      const verificationStatus = data.result.verification_status?.status;
      const isValid = verificationStatus === 'code_valid';

      this.logger.log(
        `Code verification result: ${verificationStatus} (valid=${isValid})`
      );

      return isValid;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error verifying code: ${err.message}`, err.stack);
      throw error;
    }
  }
}
