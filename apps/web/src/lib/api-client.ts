/**
 * Centralized API client for making HTTP requests to the backend
 * Handles authentication, error handling, and provides type-safe request methods
 */

import Cookies from 'js-cookie';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_PREFIX = '/api/v1';

// Token cookie name
const TOKEN_COOKIE_NAME = 'auth_token';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

/**
 * Get authentication token from cookies
 */
function getAuthToken(): string | undefined {
  // Server-side rendering: cookies not available
  if (typeof window === 'undefined') {
    return undefined;
  }

  return Cookies.get(TOKEN_COOKIE_NAME);
}

/**
 * Make HTTP request with automatic token injection and error handling
 */
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`;

  // Get auth token
  const token = getAuthToken();

  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Make request
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle non-OK responses
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }

      throw new ApiError(response.status, response.statusText, errorData);
    }

    // Parse JSON response
    const data = await response.json();
    return data as T;
  } catch (error) {
    // Re-throw ApiError as is
    if (error instanceof ApiError) {
      throw error;
    }

    // Network errors or other errors
    throw new Error(
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
}

/**
 * API client with typed methods
 */
export const apiClient = {
  /**
   * GET request
   */
  get: <T = any>(endpoint: string, options?: RequestInit) => {
    return request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  },

  /**
   * POST request
   */
  post: <T = any>(endpoint: string, data?: any, options?: RequestInit) => {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PUT request
   */
  put: <T = any>(endpoint: string, data?: any, options?: RequestInit) => {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PATCH request
   */
  patch: <T = any>(endpoint: string, data?: any, options?: RequestInit) => {
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * DELETE request
   */
  delete: <T = any>(endpoint: string, options?: RequestInit) => {
    return request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  },

  /**
   * Set authentication token
   */
  setToken: (token: string, expiresInDays: number = 7) => {
    Cookies.set(TOKEN_COOKIE_NAME, token, { expires: expiresInDays });
  },

  /**
   * Remove authentication token
   */
  removeToken: () => {
    Cookies.remove(TOKEN_COOKIE_NAME);
  },

  /**
   * Get current authentication token
   */
  getToken: () => {
    return getAuthToken();
  },
};

/**
 * Auth API endpoints
 */
export const authApi = {
  /**
   * Send OTP code to phone
   */
  sendOtp: (phone: string) => {
    return apiClient.post('/auth/send-otp', { phone });
  },

  /**
   * Verify OTP code
   */
  verifyOtp: (phone: string, otp: string) => {
    return apiClient.post('/auth/verify-otp', { phone, otp });
  },

  /**
   * Register new user
   */
  register: (data: {
    phone: string;
    name: string;
    password: string;
    businessType: string;
    businessName: string;
  }) => {
    return apiClient.post<{
      success: boolean;
      user: any;
      accessToken: string;
    }>('/auth/register', data);
  },

  /**
   * Login with phone and password
   */
  login: (phone: string, password: string) => {
    return apiClient.post<{
      success: boolean;
      user: any;
      accessToken: string;
    }>('/auth/login', { phone, password });
  },

  /**
   * Send password reset OTP
   */
  forgotPassword: (phone: string) => {
    return apiClient.post('/auth/forgot-password', { phone });
  },

  /**
   * Verify password reset OTP
   */
  verifyResetOtp: (phone: string, otp: string) => {
    return apiClient.post('/auth/verify-reset-otp', { phone, otp });
  },

  /**
   * Reset password
   */
  resetPassword: (phone: string, otp: string, newPassword: string) => {
    return apiClient.post('/auth/reset-password', {
      phone,
      otp,
      newPassword,
    });
  },
};
