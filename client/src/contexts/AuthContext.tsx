import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { type UserRole } from '../types';
import { apiRequest, type ApiUser } from '../services/apiClient';

interface AuthContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  user: ApiUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { name: string; businessName: string; phone: string; email: string; password: string }) => Promise<void>;
  acceptInvitation: (input: { token: string; name: string; password: string }) => Promise<void>;
  refreshUser: () => Promise<ApiUser>;
  signOut: () => void;
}

interface SessionResponse {
  token: string;
  user: ApiUser;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => (localStorage.getItem('eveo_role') as UserRole) || 'bdc');
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(() => localStorage.getItem('eveo_token') !== null);

  const acceptSession = useCallback((session: SessionResponse) => {
    localStorage.setItem('eveo_token', session.token);
    localStorage.setItem('eveo_role', session.user.role);
    setRoleState(session.user.role);
    setUser(session.user);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('eveo_token');
    if (!token) return;
    let active = true;
    apiRequest<ApiUser>('/users/me')
      .then((profile) => {
        if (!active) return;
        setUser(profile);
        setRoleState(profile.role);
        localStorage.setItem('eveo_role', profile.role);
      })
      .catch(() => {
        if (!active) return;
        localStorage.removeItem('eveo_token');
        localStorage.removeItem('eveo_role');
        setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await apiRequest<SessionResponse>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    acceptSession(session);
  }, [acceptSession]);

  const signUp = useCallback(async (input: { name: string; businessName: string; phone: string; email: string; password: string }) => {
    const session = await apiRequest<SessionResponse>('/auth/signup', {
      method: 'POST', body: JSON.stringify(input),
    });
    acceptSession(session);
  }, [acceptSession]);

  const acceptInvitation = useCallback(async (input: { token: string; name: string; password: string }) => {
    const session = await apiRequest<SessionResponse>('/auth/accept-invitation', {
      method: 'POST', body: JSON.stringify(input),
    });
    acceptSession(session);
  }, [acceptSession]);

  const refreshUser = useCallback(async () => {
    const profile = await apiRequest<ApiUser>('/users/me');
    setUser(profile);
    setRoleState(profile.role);
    localStorage.setItem('eveo_role', profile.role);
    return profile;
  }, []);

  const setRole = useCallback((newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('eveo_role', newRole);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('eveo_token');
    localStorage.removeItem('eveo_role');
    setUser(null);
    setRoleState('bdc');
  }, []);

  const value = useMemo(
    () => ({ role, setRole, user, isLoading, signIn, signUp, acceptInvitation, refreshUser, signOut }),
    [role, setRole, user, isLoading, signIn, signUp, acceptInvitation, refreshUser, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
