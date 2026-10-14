import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import * as api from '../api/client';

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => api.getToken());

  const login = useCallback((newToken: string) => {
    api.setToken(newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    // Best-effort server-side logout (ignore failures)
    api.logout().catch(() => {});
    api.clearToken();
    setToken(null);
    window.location.href = '/';
  }, []);

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}