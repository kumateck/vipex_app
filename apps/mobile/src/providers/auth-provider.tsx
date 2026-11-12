import { sessionBranchKey, type BranchSwitchChoice } from '@/shared/auth/branch-switch';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import { clearSession, loadSession, saveSession } from '@mobile/lib/storage';
import {
  authorizedRequestWithRefresh,
  getMobileDeviceAccess,
  login as loginRequest,
  switchMobileSessionBranch,
} from '@mobile/lib/api';
import type { SessionState } from '@mobile/types/auth';

type AuthContextValue = {
  bootstrapped: boolean;
  session: SessionState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  withAuth: <T>(run: (accessToken: string) => Promise<T>) => Promise<T>;
  setSession: (next: SessionState) => Promise<void>;
  switchBranch: (choice: BranchSwitchChoice) => Promise<void>;
};

const EMPTY_SESSION: SessionState = {
  user: null,
  accessToken: null,
  refreshToken: null,
};

function isSessionExpiredError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('token revoked') ||
    message.includes('invalid refresh token') ||
    message.includes('session expired') ||
    message.includes('device blocked') ||
    message.includes('device revoked') ||
    message.includes('device permanently denied') ||
    message.includes('unauthorized') ||
    message.includes('(401)')
  );
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [session, setSessionState] = useState<SessionState>(EMPTY_SESSION);
  const currentSession = useRef(EMPTY_SESSION);

  const setSession = useCallback(async (next: SessionState) => {
    currentSession.current = next;
    setSessionState(next);
    await saveSession(next);
  }, []);

  useEffect(() => {
    loadSession()
      .then(async (stored) => {
        let restored = stored;
        if (stored.accessToken || stored.refreshToken || stored.user) {
          const allowed = await authorizedRequestWithRefresh(
            stored,
            getMobileDeviceAccess,
            async (next) => {
              restored = next;
              await saveSession(next);
            },
          ).catch(() => false);
          if (!allowed) {
            await clearSession();
            return;
          }
        }
        currentSession.current = restored;
        setSessionState(restored);
      })
      .catch(() => setSessionState(EMPTY_SESSION))
      .finally(() => setBootstrapped(true));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const next = await loginRequest(email, password);
      await setSession(next);
    },
    [setSession],
  );

  const logout = useCallback(async () => {
    currentSession.current = EMPTY_SESSION;
    setSessionState(EMPTY_SESSION);
    await clearSession();
  }, []);

  const activeBranchKey = sessionBranchKey(session.user);
  const withAuth = useCallback(
    async <T,>(run: (accessToken: string) => Promise<T>): Promise<T> => {
      const started = currentSession.current;
      if (sessionBranchKey(started.user) !== activeBranchKey) {
        throw new Error('Session changed. Reopen the screen and try again.');
      }
      try {
        const result = await authorizedRequestWithRefresh<T>(started, run, async (next) => {
          if (currentSession.current.refreshToken === started.refreshToken) {
            await setSession(next);
          } else if (currentSession.current.accessToken !== next.accessToken) {
            throw new Error('Session changed. Reopen the screen and try again.');
          }
        });
        return result;
      } catch (error) {
        if (
          started.refreshToken &&
          currentSession.current.refreshToken === started.refreshToken &&
          isSessionExpiredError(error)
        ) {
          await logout();
          throw new Error('Session expired. Please sign in again.');
        }
        throw error;
      }
    },
    [activeBranchKey, logout, setSession],
  );

  const switchBranch = useCallback(
    async (choice: BranchSwitchChoice) => {
      const previous = currentSession.current;
      if (!previous.refreshToken || !previous.user)
        throw new Error('Sign in again to switch branches.');
      const next = await switchMobileSessionBranch(previous.refreshToken, choice);
      if (
        currentSession.current.refreshToken !== previous.refreshToken ||
        next.user?.id !== previous.user.id ||
        next.user.branch?.id !== choice.branchId ||
        (next.user.location?.id ?? next.user.locationId ?? null) !== choice.locationId
      )
        throw new Error('Session changed. Reopen the screen and try again.');
      await setSession({ ...next, user: next.user });
    },
    [setSession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      bootstrapped,
      session,
      login,
      logout,
      withAuth,
      setSession,
      switchBranch,
    }),
    [bootstrapped, login, logout, session, setSession, switchBranch, withAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
