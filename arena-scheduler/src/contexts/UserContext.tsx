import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, sessionManager } from '@/services/api';
import type { CurrentUser, AuthSession, Team } from '@/types';

interface UserContextType {
  user: CurrentUser | null;
  session: AuthSession | null;
  selectedTeam: Team | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasMultipleTeams: boolean;
  login: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  sendCode: (email: string) => Promise<string | undefined>;
  refreshUser: () => Promise<void>;
  selectTeam: (team: Team) => void;
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
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!session;
  const isAdmin = user?.admin || false;
  const hasMultipleTeams = !isAdmin && user?.teams ? user.teams.length > 1 : false;

  // Initialize session on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize session token if available
        sessionManager.initializeSession();
        
        // Try to get current user
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);
        
        // Auto-select team if user has only one team
        if (!currentUser.admin && currentUser.teams && currentUser.teams.length === 1) {
          setSelectedTeam(currentUser.teams[0]);
        }
        
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
      
      // Auto-select team if user has only one team
      if (!currentUser.admin && currentUser.teams && currentUser.teams.length === 1) {
        setSelectedTeam(currentUser.teams[0]);
      }
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
      setSelectedTeam(null);
      sessionManager.clearSessionToken();
      sessionManager.removeSession();
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      
      // Auto-select team if user has only one team
      if (!currentUser.admin && currentUser.teams && currentUser.teams.length === 1) {
        setSelectedTeam(currentUser.teams[0]);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      // If refresh fails, user might be logged out
      logout();
    }
  };

  const selectTeam = (team: Team): void => {
    setSelectedTeam(team);
  };

  const value: UserContextType = {
    user,
    session,
    selectedTeam,
    isLoading,
    isAuthenticated,
    isAdmin,
    hasMultipleTeams,
    login,
    logout,
    sendCode,
    refreshUser,
    selectTeam,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
