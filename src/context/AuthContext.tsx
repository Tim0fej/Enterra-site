import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, clearToken, getToken, onSessionRevoked } from '../api/client';
import type { AuthResponse, LoginResponse, User } from '../types/auth';
import { isLoginVerificationResponse } from '../types/auth';
import type { BotFormPayload } from '../hooks/useBotFormFields';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (login: string, password: string, bot: BotFormPayload) => Promise<LoginResponse>;
  verifyLogin: (
    challengeToken: string,
    emailCode: string,
    login: string,
    bot: BotFormPayload,
  ) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    emailCode: string,
    acceptTerms: boolean,
    bot: BotFormPayload,
  ) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUserData: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const legacyToken = getToken();
    if (!legacyToken) {
      try {
        const data = await api<User>('/auth/me');
        setUser(data);
        return;
      } catch {
        setUser(null);
        return;
      }
    }

    try {
      const data = await api<User>('/auth/me');
      clearToken();
      setUser(data);
    } catch {
      clearToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  useEffect(() => onSessionRevoked(() => setUser(null)), []);

  const login = useCallback(async (loginValue: string, password: string, bot: BotFormPayload) => {
    const data = await api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login: loginValue, password, ...bot }),
    });
    if (isLoginVerificationResponse(data)) {
      return data;
    }
    clearToken();
    setUser(data.user);
    return data;
  }, []);

  const verifyLogin = useCallback(
    async (challengeToken: string, emailCode: string, loginValue: string, bot: BotFormPayload) => {
      const data = await api<AuthResponse>('/auth/login/verify', {
        method: 'POST',
        body: JSON.stringify({ challengeToken, emailCode, login: loginValue, ...bot }),
      });
      clearToken();
      setUser(data.user);
    },
    [],
  );

  const register = useCallback(
    async (
      username: string,
      email: string,
      password: string,
      emailCode: string,
      acceptTerms: boolean,
      bot: BotFormPayload,
    ) => {
      const data = await api<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, emailCode, acceptTerms, ...bot }),
      });
      clearToken();
      setUser(data.user);
      return data.user;
    },
    [],
  );

  const logout = useCallback(() => {
    void api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    clearToken();
    setUser(null);
  }, []);

  const setUserData = useCallback((next: User) => setUser(next), []);

  const value = useMemo(
    () => ({ user, loading, login, verifyLogin, register, logout, refreshUser, setUserData }),
    [user, loading, login, verifyLogin, register, logout, refreshUser, setUserData],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
