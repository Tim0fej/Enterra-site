import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, clearToken, getToken, setToken } from '../api/client';
import type { AuthResponse, User } from '../types/auth';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUserData: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function applyAuth(data: AuthResponse) {
  setToken(data.token);
  return data.user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const data = await api<User>('/auth/me');
      setUser(data);
    } catch {
      clearToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (loginValue: string, password: string) => {
    const data = await api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login: loginValue, password }),
    });
    setUser(applyAuth(data));
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const data = await api<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    const newUser = applyAuth(data);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const setUserData = useCallback((next: User) => setUser(next), []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser, setUserData }),
    [user, loading, login, register, logout, refreshUser, setUserData],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
