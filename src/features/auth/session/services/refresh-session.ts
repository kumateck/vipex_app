import { useAuthStore, type AuthUser } from '@/stores/auth-store';

export type SessionRefreshResult =
  | { status: 'refreshed'; accessToken: string; refreshToken: string; user: AuthUser }
  | { status: 'invalid' }
  | { status: 'unavailable' }
  | { status: 'superseded' };

type RefreshRequest = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type RefreshResponse = {
  tokens?: { accessToken?: unknown; refreshToken?: unknown };
  user?: AuthUser;
};

const inFlightByToken = new Map<string, Promise<SessionRefreshResult>>();

export function refreshAuthSession(
  request: RefreshRequest = fetch,
  timeoutMs = 10_000,
): Promise<SessionRefreshResult> {
  const initial = useAuthStore.getState();
  if (!initial.refreshToken || !initial.user) return Promise.resolve({ status: 'invalid' });
  const originalRefreshToken = initial.refreshToken;
  const originalUserId = initial.user.id;
  const inFlightRefresh = inFlightByToken.get(originalRefreshToken);
  if (inFlightRefresh) return inFlightRefresh;

  const attempt = async (): Promise<SessionRefreshResult> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await request('/v1/auth/refresh', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: originalRefreshToken }),
      });
      const current = useAuthStore.getState();
      if (current.refreshToken !== originalRefreshToken || current.user?.id !== originalUserId) {
        return { status: 'superseded' };
      }
      if ([400, 401, 403].includes(response.status)) return { status: 'invalid' };
      if (!response.ok) return { status: 'unavailable' };

      const data = (await response.json()) as RefreshResponse;
      const accessToken = data.tokens?.accessToken;
      const refreshToken = data.tokens?.refreshToken;
      if (
        typeof accessToken !== 'string' ||
        !accessToken.trim() ||
        typeof refreshToken !== 'string' ||
        !refreshToken.trim()
      ) {
        return { status: 'unavailable' };
      }
      const latest = useAuthStore.getState();
      if (latest.refreshToken !== originalRefreshToken || latest.user?.id !== originalUserId) {
        return { status: 'superseded' };
      }
      const user = data.user?.id === originalUserId ? data.user : latest.user;
      if (!user) return { status: 'superseded' };

      useAuthStore.getState().setAuth({ user, accessToken, refreshToken });
      return { status: 'refreshed', accessToken, refreshToken, user };
    } catch {
      return { status: 'unavailable' };
    } finally {
      clearTimeout(timeout);
    }
  };

  const pending = attempt().finally(() => {
    if (inFlightByToken.get(originalRefreshToken) === pending) {
      inFlightByToken.delete(originalRefreshToken);
    }
  });
  inFlightByToken.set(originalRefreshToken, pending);
  return pending;
}
