'use client';

/**
 * Authentication provider for managing user authentication state
 * Provides login, logout, register, and current user functionality
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, authApi } from '../lib/api-client';

/**
 * User type from JWT payload
 */
export interface User {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  tenantId: string;
  createdAt: string;
}

/**
 * Authentication context type
 */
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication provider component
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  /**
   * Check if user is authenticated on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = apiClient.getToken();

        if (token) {
          // Decode JWT to get user data
          // JWT format: header.payload.signature
          const payloadBase64 = token.split('.')[1];
          if (payloadBase64) {
            const payloadJson = atob(payloadBase64);
            const payload = JSON.parse(payloadJson);

            // Check if token is expired
            if (payload.exp && payload.exp * 1000 < Date.now()) {
              // Token expired, remove it
              apiClient.removeToken();
              setUser(null);
            } else {
              // Token valid, fetch user data from payload
              // Note: In production, you might want to fetch fresh user data from API
              setUser({
                id: payload.sub,
                phone: '', // Not in JWT payload
                firstName: '', // Not in JWT payload
                lastName: '', // Not in JWT payload
                email: payload.email,
                role: payload.role,
                tenantId: payload.tenant_id,
                createdAt: '', // Not in JWT payload
              });
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        apiClient.removeToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login with phone and password
   */
  const login = async (phone: string, password: string) => {
    try {
      const response = await authApi.login(phone, password);

      if (response.success && response.accessToken) {
        // Save token
        apiClient.setToken(response.accessToken, 7); // 7 days

        // Set user
        setUser(response.user);

        // Redirect to intranet
        router.push('/intranet/stores');
      }
    } catch (error) {
      // Re-throw error to be handled by caller
      throw error;
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    // Remove token
    apiClient.removeToken();

    // Clear user
    setUser(null);

    // Redirect to login
    router.push('/login');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
