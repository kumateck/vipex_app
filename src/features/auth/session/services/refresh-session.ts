import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import type { BranchSwitchChoice } from '@/shared/auth/branch-switch';
import { AUTH_STORAGE_KEY, useAuthStore, type AuthUser } from '@/stores/auth-store';

export type SessionRefreshResult =
  | { status: 'refreshed'; accessToken: string; refreshToken: string; user: AuthUser }
  | { status: 'invalid' }
  | { status: 'unavailable' }
  | { status: 'switch-rejected'; message: string }
  | { status: 'superseded' };

type RefreshRequest = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type RefreshResponse = {
  tokens?: { accessToken?: unknown; refreshToken?: unknown };
  user?: AuthUser;
};

const inFlightByToken = new Map<string, Promise<SessionRefreshResult>>();

async function restoreNewerBrowserSession(userId: string, previousToken: string) {
  if (typeof window === 'undefined') return false;
  try {
    const persisted = JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY) ?? 'null') as {
      state?: { user?: AuthUser; refreshToken?: string };
    } | null;
    const saved = persisted?.state;
    if (saved?.user?.id !== userId || !saved.refreshToken || saved.refreshToken === previousToken) {
      return false;
    }
    await useAuthStore.persist.rehydrate();
    return useAuthStore.getState().refreshToken === saved.refreshToken;
  } catch {
    return false;
  }
}

export function refreshAuthSession(
  request: RefreshRequest = fetch,
  timeoutMs = 10_000,
  switchBranch?: BranchSwitchChoice,
): Promise<SessionRefreshResult> {
  const initial = useAuthStore.getState();
  if (!initial.refreshToken || !initial.user) return Promise.resolve({ status: 'invalid' });
  const originalRefreshToken = initial.refreshToken;
  const originalUserId = initial.user.id;
  const inFlightRefresh = inFlightByToken.get(originalRefreshToken);
  if (inFlightRefresh) {
    return switchBranch
      ? Promise.resolve({
          status: 'switch-rejected',
          message: 'Your session is renewing. Try again.',
        })
      : inFlightRefresh;
  }

  const attempt = async (): Promise<SessionRefreshResult> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await request('/v1/auth/refresh', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: originalRefreshToken, switchBranch }),
      });
      const current = useAuthStore.getState();
      if (current.refreshToken !== originalRefreshToken || current.user?.id !== originalUserId) {
        return { status: 'superseded' };
      }
      if (!response.ok) {
        const restored = await restoreNewerBrowserSession(originalUserId, originalRefreshToken);
        const latest = useAuthStore.getState();
        if (
          restored ||
          latest.refreshToken !== originalRefreshToken ||
          latest.user?.id !== originalUserId
        ) {
          return { status: 'superseded' };
        }
      }
      if (switchBranch && !response.ok) {
        const body: unknown = await response.json().catch(() => null);
        return {
          status: 'switch-rejected',
          message: getErrorMessage(body, 'Unable to switch branch.'),
        };
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
      if (
        switchBranch &&
        (data.user?.id !== originalUserId ||
          data.user.branch?.id !== switchBranch.branchId ||
          (data.user.locationId ?? null) !== switchBranch.locationId)
      )
        return { status: 'unavailable' };
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

export function switchAuthSessionBranch(choice: BranchSwitchChoice) {
  return refreshAuthSession(fetch, 10_000, choice);
}
