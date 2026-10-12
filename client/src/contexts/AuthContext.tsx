import React, { createContext, useContext, useState } from 'react';
import { type UserRole } from '../types';

interface AuthContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Pull initial state from local storage so it persists across refreshes
  const [role, setRoleState] = useState<UserRole>(() => {
    return (localStorage.getItem('eveo_role') as UserRole) || 'bdc';
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('eveo_role', newRole);
  };

  return (
    <AuthContext.Provider value={{ role, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};