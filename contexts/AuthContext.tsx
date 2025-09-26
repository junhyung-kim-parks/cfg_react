import { createContext, useContext, useState, ReactNode } from 'react';
import type { User } from '../features/users/types';
import { generateUsers } from '../services/embedded_dataset/users';
import { authService } from '../services/api/auth';

interface UserWithInitials extends User {
  initials: string;
}

interface AuthContextType {
  user: UserWithInitials | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  availableUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithInitials | null>(null);
  const availableUsers = generateUsers().users;

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
      // First attempt: HTTP API login
      console.log('🔐 AuthContext: Attempting HTTP API login...');
      const response = await authService.login({ username, password });
      
      if (response.user) {
        console.log('🔐 AuthContext: ✅ HTTP API login successful for user:', response.user.email);
        setUser({ ...response.user, initials: getInitials(response.user.name) });
        return true;
      }
    } catch (error) {
      console.log('🔐 AuthContext: ❌ HTTP API login failed, trying embedded dataset fallback:', error);
    }
    
    // Second attempt: Embedded dataset fallback
    console.log('🔐 AuthContext: Attempting embedded dataset login...');
    const foundUser = availableUsers.find(u => 
      u.email.toLowerCase().includes(username.toLowerCase()) ||
      u.name.toLowerCase().includes(username.toLowerCase())
    );
    
    if (foundUser) {
      console.log('🔐 AuthContext: ✅ Embedded dataset login successful for user:', foundUser.email);
      // Password is ignored - any password works for demo purposes
      setUser({ ...foundUser, initials: getInitials(foundUser.name) });
      return true;
    }
    
    console.log('🔐 AuthContext: ❌ Login failed - user not found in any source');
    return false;
  };

  const logout = async () => {
    console.log('🔐 AuthContext: Starting logout process...');
    
    try {
      // Attempt HTTP API logout (doesn't matter if it fails)
      await authService.logout();
    } catch (error) {
      console.log('🔐 AuthContext: HTTP logout failed, continuing with local logout:', error);
    }
    
    console.log('🔐 AuthContext: ✅ Logout completed');
    setUser(null);
  };

  const value = {
    user,
    isLoggedIn: !!user,
    login,
    logout,
    availableUsers
  };

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