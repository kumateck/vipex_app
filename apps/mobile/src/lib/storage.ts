import * as SecureStore from 'expo-secure-store';
import type { SessionState } from '@mobile/types/auth';

const SESSION_KEY = 'vipex_mobile_session_v1';
const APPEARANCE_KEY = 'vipex_mobile_appearance_v1';

export type AppearanceMode = 'system' | 'light' | 'dark';

export async function loadSession(): Promise<SessionState> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return { user: null, accessToken: null, refreshToken: null };

  try {
    const parsed = JSON.parse(raw) as SessionState;
    return {
      user: parsed.user ?? null,
      accessToken: parsed.accessToken ?? null,
      refreshToken: parsed.refreshToken ?? null,
    };
  } catch {
    return { user: null, accessToken: null, refreshToken: null };
  }
}

export async function saveSession(session: SessionState): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export async function loadAppearanceMode(): Promise<AppearanceMode> {
  const raw = await SecureStore.getItemAsync(APPEARANCE_KEY);
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  return 'system';
}

export async function saveAppearanceMode(mode: AppearanceMode): Promise<void> {
  await SecureStore.setItemAsync(APPEARANCE_KEY, mode);
}
