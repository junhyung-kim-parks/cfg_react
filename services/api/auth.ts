import { httpPost, setAccessToken } from './http';
import type { User } from '../../features/users/types';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;           // JWT access token (short-lived)
  profile: User;           // User profile data
  xsrfHeader?: string;     // CSRF header name (e.g., "X-CSRF-Token")
}

export interface RefreshResponse {
  access: string;          // New JWT access token
}

export const authService = {
  /**
   * Login with username and password
   * Backend will:
   * - Validate credentials via LDAP
   * - Return access token in response body
   * - Set refresh token as HttpOnly cookie
   * - Set XSRF token cookie
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log('🔐 AuthService: Attempting HTTP API login for:', credentials.username);
    
    try {
      // Login endpoint doesn't require CSRF protection
      const response = await httpPost<LoginResponse>(
        '/auth/login', 
        credentials,
        {},
        true,  // skipAuth - no Authorization header needed for login
        true   // skipCsrf - no CSRF protection for login endpoint
      );
      
      console.log('🔐 AuthService: ✅ HTTP login successful');
      console.log('🔐 AuthService: Setting access token in memory');
      
      // Store access token in memory
      setAccessToken(response.access);
      
      return response;
    } catch (error) {
      console.log('🔐 AuthService: ❌ HTTP login failed:', error);
      throw error;
    }
  },

  /**
   * Logout - clears server-side refresh token and client-side access token
   * Requires CSRF protection
   */
  async logout(): Promise<void> {
    console.log('🔐 AuthService: Attempting HTTP API logout');
    
    try {
      // Logout requires CSRF token
      await httpPost<void>(
        '/auth/logout',
        undefined,
        {},
        false,  // Don't skip auth - send Authorization header
        false   // Don't skip CSRF - send X-CSRF-Token header
      );
      
      console.log('🔐 AuthService: ✅ HTTP logout successful');
    } catch (error) {
      console.log('🔐 AuthService: ⚠️ HTTP logout failed, continuing anyway:', error);
      // Don't throw - logout should always succeed locally
    } finally {
      // Always clear access token from memory
      console.log('🔐 AuthService: Clearing access token from memory');
      setAccessToken(null);
    }
  },

  /**
   * Refresh access token using refresh token cookie
   * Requires CSRF protection
   * Backend will:
   * - Validate refresh token from HttpOnly cookie
   * - Rotate refresh token (revoke old, issue new)
   * - Return new access token
   * - Set new refresh token and XSRF cookies
   */
  async refresh(): Promise<RefreshResponse> {
    console.log('🔐 AuthService: Attempting to refresh access token');
    
    try {
      // Refresh requires CSRF but not Authorization (uses RT cookie)
      const response = await httpPost<RefreshResponse>(
        '/auth/refresh',
        undefined,
        {},
        true,  // skipAuth - no Authorization header (using RT cookie)
        false  // Don't skip CSRF - send X-CSRF-Token header
      );
      
      console.log('🔐 AuthService: ✅ Token refresh successful');
      
      // Update access token in memory
      setAccessToken(response.access);
      
      return response;
    } catch (error) {
      console.log('🔐 AuthService: ❌ Token refresh failed:', error);
      // Clear access token on refresh failure
      setAccessToken(null);
      throw error;
    }
  },

  /**
   * Validate current session (optional - for page reload)
   * This can be used to restore session on app initialization
   */
  async validateSession(): Promise<User | null> {
    console.log('🔐 AuthService: Validating session');
    
    try {
      // Try to refresh token to validate session
      await this.refresh();
      
      // If refresh succeeds, we need to get user profile
      // This could be a separate endpoint like GET /auth/me
      // For now, we'll return null and let the app handle it
      console.log('🔐 AuthService: ✅ Session is valid');
      return null;
    } catch (error) {
      console.log('🔐 AuthService: ❌ Session validation failed:', error);
      return null;
    }
  }
};