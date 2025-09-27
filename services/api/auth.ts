import { httpPost } from './http';
import type { User } from '../../features/users/types';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token?: string;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log('🔐 AuthService: Attempting HTTP API login for:', credentials.username);
    
    try {
      const response = await httpPost<LoginResponse>('/authenticate', credentials);
      console.log('🔐 AuthService: ✅ HTTP login successful');
      return response;
    } catch (error) {
      console.log('🔐 AuthService: ❌ HTTP login failed:', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    console.log('🔐 AuthService: Attempting HTTP API logout');
    
    try {
      await httpPost<void>('/auth/logout');
      console.log('🔐 AuthService: ✅ HTTP logout successful');
    } catch (error) {
      console.log('🔐 AuthService: ❌ HTTP logout failed, continuing anyway:', error);
      // Don't throw - logout should always succeed locally
    }
  },

  async validateToken(token: string): Promise<User> {
    console.log('🔐 AuthService: Validating token');
    
    try {
      const response = await httpPost<{ user: User }>('/auth/validate', { token });
      console.log('🔐 AuthService: ✅ Token validation successful');
      return response.user;
    } catch (error) {
      console.log('🔐 AuthService: ❌ Token validation failed:', error);
      throw error;
    }
  }
};