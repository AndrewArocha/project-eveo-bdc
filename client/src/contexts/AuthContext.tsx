import { clearConversations } from '../services/eveoAgent/conversations';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { type UserRole } from '../types';
import { apiRequest, type ApiUser } from '../services/apiClient';

interface AuthContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  user: ApiUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<ApiUser>;
  signUp: (input: { name: string; businessName: string; phone: string; email: string; password: string; promotionalConsent: boolean }) => Promise<{ verificationRequired: boolean }>;
  verifyEmail: (token: string) => Promise<void>;
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
  const [role, setRoleState] = useState<UserRole>(() => localStorage.getItem('eveo_token') ? ((localStorage.getItem('eveo_role') as UserRole) || 'bdc') : 'owner');
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(() => localStorage.getItem('eveo_token') !== null);

  const acceptSession = useCallback((session: SessionResponse) => {
    localStorage.setItem('eveo_token', session.token);
    localStorage.setItem('eveo_role', session.user.role);
    setRoleState(session.user.role);
    setUser(session.user);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('eveo_token');
    if (!token) return;
    let active = true;
    apiRequest<ApiUser>('/users/me')
      .then((profile) => {
        if (!active || localStorage.getItem('eveo_token') !== token) return;
        setUser(profile);
        setRoleState(profile.role);
        localStorage.setItem('eveo_role', profile.role);
      })
      .catch(() => {
        if (!active || localStorage.getItem('eveo_token') !== token) return;
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
    return session.user;
  }, [acceptSession]);

  const signUp = useCallback(async (input: { name: string; businessName: string; phone: string; email: string; password: string; promotionalConsent: boolean }) => {
    const response = await apiRequest<{ verificationRequired: boolean; email: string; session?: SessionResponse }>('/auth/signup', {
      method: 'POST', body: JSON.stringify(input),
    });
    if (response.session) acceptSession(response.session);
    return { verificationRequired: response.verificationRequired };
  }, [acceptSession]);

  const verifyEmail = useCallback(async (token: string) => {
    const session = await apiRequest<SessionResponse>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) });
    acceptSession(session);
  }, [acceptSession]);

  const acceptInvitation = useCallback(async (input: { token: string; name: string; password: string }) => {
    const session = await apiRequest<SessionResponse>('/auth/accept-invitation', {
      method: 'POST', body: JSON.stringify(input),
    });
    acceptSession(session);
  }, [acceptSession]);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('eveo_token');
    const profile = await apiRequest<ApiUser>('/users/me');
    if (localStorage.getItem('eveo_token') !== token) return profile;
    setUser(profile);
    setRoleState(profile.role);
    localStorage.setItem('eveo_role', profile.role);
    return profile;
  }, []);

  useEffect(() => {
    if (!user) return;
    const refreshMembership = () => {
      if (user.role === 'owner') void refreshUser().catch(() => {});
    };
    window.addEventListener('focus', refreshMembership);
    return () => window.removeEventListener('focus', refreshMembership);
  }, [refreshUser, user]);

  const setRole = useCallback((newRole: UserRole) => {
    setRoleState(newRole);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('eveo_token');
    localStorage.removeItem('eveo_role');
    clearConversations();
    setUser(null);
    setRoleState('owner');
  }, []);

  const value = useMemo(
    () => ({ role, setRole, user, isLoading, signIn, signUp, verifyEmail, acceptInvitation, refreshUser, signOut }),
    [role, setRole, user, isLoading, signIn, signUp, verifyEmail, acceptInvitation, refreshUser, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
