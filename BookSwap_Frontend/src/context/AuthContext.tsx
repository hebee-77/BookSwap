import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/auth';
import { authService } from '../services/authService';
import { chatSocket } from '../services/websocket/chatSocket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to decode JWT payload locally without external libraries
const decodeToken = (token: string): { sub: string; exp: number; roles?: string[] } | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    chatSocket.disconnect();
    authService.removeToken();
    setToken(null);
    setUser(null);
    setIsLoading(false);
  };

  const fetchProfileAndSetState = async (authToken: string) => {
    const decoded = decodeToken(authToken);
    if (!decoded || !decoded.sub) {
      logout();
      return;
    }

    // Check expiration (exp is in seconds, Date.now() in ms)
    if (decoded.exp * 1000 < Date.now()) {
      logout();
      return;
    }

    try {
      // Set token state so that the Axios interceptor adds it
      setToken(authToken);
      authService.setToken(authToken);

      const users = await authService.getUsers();
      const currentUser = users.find((u) => u.email === decoded.sub);
      
      if (currentUser) {
        setUser({
          ...currentUser,
          roles: decoded.roles || [],
        });
        chatSocket.connect(authToken);
      } else {
        throw new Error('User not found in user list');
      }
    } catch (error) {
      console.error('Session restoration failed:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (authToken: string) => {
    setIsLoading(true);
    await fetchProfileAndSetState(authToken);
  };

  const refreshUser = async () => {
    const storedToken = token || authService.getToken();
    if (storedToken) {
      await fetchProfileAndSetState(storedToken);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = authService.getToken();
      if (storedToken) {
        await fetchProfileAndSetState(storedToken);
      } else {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
