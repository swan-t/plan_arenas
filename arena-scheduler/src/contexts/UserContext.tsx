import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, sessionManager } from '@/services/api';
import type { CurrentUser, AuthSession } from '@/types';

interface UserContextType {
  user: CurrentUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  sendCode: (email: string) => Promise<string | undefined>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!session;
  const isAdmin = user?.admin || false;

  // Initialize session on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize session token if available
        sessionManager.initializeSession();
        
        // Try to get current user
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);
        
        // Get session token from localStorage
        const token = sessionManager.getSession();
        if (token) {
          // Create a mock session object (we don't have expires_at from localStorage)
          setSession({ code: token, expires_at: '' });
        }
      } catch (error) {
        // User not authenticated or session expired
        console.log('No valid session found');
        sessionManager.clearSessionToken();
        sessionManager.removeSession();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const sendCode = async (email: string): Promise<string | undefined> => {
    try {
      const response = await authApi.sendCode({ email });
      return response.code; // Only available in development mode
    } catch (error) {
      console.error('Error sending verification code:', error);
      throw error;
    }
  };

  const login = async (email: string, code: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authApi.verifyCode({ email, code });
      
      // Save session
      sessionManager.saveSession(response.session.code);
      sessionManager.setSessionToken(response.session.code);
      setSession(response.session);
      
      // Get current user
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (session) {
        await authApi.logout({ code: session.code });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear local state regardless of API call success
      setUser(null);
      setSession(null);
      sessionManager.clearSessionToken();
      sessionManager.removeSession();
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
      // If refresh fails, user might be logged out
      logout();
    }
  };

  const value: UserContextType = {
    user,
    session,
    isLoading,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    sendCode,
    refreshUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
