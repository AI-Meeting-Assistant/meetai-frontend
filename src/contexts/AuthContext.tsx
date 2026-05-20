import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '../types';
import * as authService from '../services/auth.service';

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: authService.RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const rawUser = localStorage.getItem('user');
    return rawUser ? (JSON.parse(rawUser) as AuthUser) : null;
  });

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    setToken(result.token);
    setUser(result.user);
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
  };

  const register = async (payload: authService.RegisterPayload) => {
    const result = await authService.register(payload);
    setToken(result.token);
    setUser(result.user);
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
  };

  const value = useMemo(
    () => ({ token, user, login, register, logout }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
