import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { clearSession, loadSession, saveSession } from '@mobile/lib/storage';
import { authorizedRequestWithRefresh, login as loginRequest } from '@mobile/lib/api';
import type { SessionState } from '@mobile/types/auth';

type AuthContextValue = {
  bootstrapped: boolean;
  session: SessionState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  withAuth: <T>(run: (accessToken: string) => Promise<T>) => Promise<T>;
  setSession: (next: SessionState) => Promise<void>;
};

const EMPTY_SESSION: SessionState = {
  user: null,
  accessToken: null,
  refreshToken: null,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [session, setSessionState] = useState<SessionState>(EMPTY_SESSION);

  useEffect(() => {
    loadSession()
      .then((stored) => {
        setSessionState(stored);
      })
      .finally(() => setBootstrapped(true));
  }, []);

  const setSession = useCallback(async (next: SessionState) => {
    setSessionState(next);
    await saveSession(next);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const next = await loginRequest(email, password);
      await setSession(next);
    },
    [setSession],
  );

  const logout = useCallback(async () => {
    setSessionState(EMPTY_SESSION);
    await clearSession();
  }, []);

  const withAuth = useCallback(
    async <T,>(run: (accessToken: string) => Promise<T>): Promise<T> => {
      return authorizedRequestWithRefresh<T>(session, run, setSession);
    },
    [session, setSession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      bootstrapped,
      session,
      login,
      logout,
      withAuth,
      setSession,
    }),
    [bootstrapped, login, logout, session, setSession, withAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
