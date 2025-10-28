import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../features/users/types';
import { generateUsers } from '../services/embedded_dataset/users';
import { authService, type ApiUserProfile } from '../services/api/auth';
import { setAccessToken } from '../services/api/http';

interface UserWithInitials extends User {
  initials: string;
}

interface AuthContextType {
  user: UserWithInitials | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  availableUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Convert API profile to internal User format
 */
function apiProfileToUser(profile: ApiUserProfile): User {
  const name = `${profile.first_name} ${profile.last_name}`;
  
  return {
    id: profile.userid,
    name,
    email: profile.email,
    role: 'Editor', // Default role - backend should provide this if needed
    status: 'Active',
    permissions: {
      form_generate: true,
      form_modify_templates: false,
      form_upload_templates: false,
      form_batch_process: true,
      user_management: false,
      audit_logs: false,
      settings: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    department: 'Parks Department', // Default - backend should provide this
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithInitials | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const availableUsers = generateUsers().users;

  // Attempt to restore session on mount
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    console.log('🔐 AuthContext: Attempting to restore session...');
    setIsLoading(true);
    
    try {
      // Try to refresh the access token using the refresh token cookie
      await authService.refresh();
      
      // Session is valid, but we don't have user profile yet
      // Options:
      // 1. Backend could include profile in refresh response
      // 2. Frontend could call GET /auth/me to fetch profile
      // 3. Store profile in sessionStorage (for this page session only)
      
      // For now, check if we have profile in sessionStorage
      const storedProfile = sessionStorage.getItem('user_profile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile) as ApiUserProfile;
        const user = apiProfileToUser(profile);
        const fullName = `${profile.first_name} ${profile.last_name}`;
        setUser({ ...user, initials: getInitials(fullName) });
        console.log('🔐 AuthContext: ✅ Session restored from sessionStorage');
      } else {
        console.log('🔐 AuthContext: ⚠️ Session valid but no user profile - login required');
      }
    } catch (error) {
      console.log('🔐 AuthContext: ⚠️ No valid session found');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    console.log('🔐 AuthContext: Starting login process for:', username);
    
    try {
      // First attempt: HTTP API login (JWT + CSRF)
      console.log('🔐 AuthContext: Attempting HTTP API login...');
      const response = await authService.login({ username, password });
      
      if (response.profile) {
        console.log('🔐 AuthContext: ✅ HTTP API login successful for user:', response.profile.email);
        console.log('🔐 AuthContext: User ID:', response.profile.userid);
        console.log('🔐 AuthContext: Username:', response.profile.username);
        console.log('🔐 AuthContext: Access token stored in memory');
        console.log('🔐 AuthContext: Refresh token stored in HttpOnly cookie (automatic)');
        console.log('🔐 AuthContext: XSRF token stored in cookie for CSRF protection');
        
        // Store profile in sessionStorage for session restoration
        sessionStorage.setItem('user_profile', JSON.stringify(response.profile));
        
        // Convert API profile to internal User format
        const user = apiProfileToUser(response.profile);
        const fullName = `${response.profile.first_name} ${response.profile.last_name}`;
        
        setUser({ 
          ...user, 
          initials: getInitials(fullName) 
        });
        return true;
      }
    } catch (error) {
      console.log('🔐 AuthContext: ❌ HTTP API login failed, trying embedded dataset fallback:', error);
    }
    
    // Second attempt: Embedded dataset fallback (development/demo mode)
    console.log('🔐 AuthContext: Attempting embedded dataset login...');
    const foundUser = availableUsers.find(u => 
      u.email.toLowerCase().includes(username.toLowerCase()) ||
      u.name.toLowerCase().includes(username.toLowerCase())
    );
    
    if (foundUser) {
      console.log('🔐 AuthContext: ✅ Embedded dataset login successful for user:', foundUser.email);
      // Password is ignored - any password works for demo purposes
      setUser({ ...foundUser, initials: getInitials(foundUser.name) });
      // Set a mock access token for embedded mode
      setAccessToken('MOCK_ACCESS_TOKEN_EMBEDDED_MODE');
      return true;
    }
    
    console.log('🔐 AuthContext: ❌ Login failed - user not found in any source');
    return false;
  };

  const logout = async () => {
    console.log('🔐 AuthContext: Starting logout process...');
    
    try {
      // Attempt HTTP API logout
      // This will:
      // 1. Send CSRF token in header (X-CSRF-Token)
      // 2. Send Authorization header with access token
      // 3. Backend will revoke refresh token (remove from whitelist)
      // 4. Backend will clear RT and XSRF cookies
      await authService.logout();
      console.log('🔐 AuthContext: ✅ Server logout successful');
    } catch (error) {
      console.log('🔐 AuthContext: ⚠️ Server logout failed, continuing with local logout:', error);
    }
    
    // Always clear local state regardless of server response
    console.log('🔐 AuthContext: Clearing local user state');
    setUser(null);
    
    // Clear profile from sessionStorage
    sessionStorage.removeItem('user_profile');
    
    // Access token is already cleared by authService.logout()
    console.log('🔐 AuthContext: ✅ Logout completed');
  };

  const value = {
    user,
    isLoggedIn: !!user,
    isLoading,
    login,
    logout,
    availableUsers
  };

  // Show loading state while checking session
  if (isLoading) {
    return (
      <AuthContext.Provider value={value}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}