import type { SelfServiceSession } from '../api/self-service-public.api';

export const selfServiceSessionKey = (branchId: string) => `vipex:self-service-session:${branchId}`;

export function readSelfServiceSession(branchId: string): SelfServiceSession | null {
  try {
    const raw = window.sessionStorage.getItem(selfServiceSessionKey(branchId));
    if (!raw) return null;
    const session = JSON.parse(raw) as Partial<SelfServiceSession> | null;
    if (
      !session ||
      session.branchId !== branchId ||
      typeof session.sessionToken !== 'string' ||
      !session.sessionToken ||
      typeof session.branchName !== 'string' ||
      !Number.isFinite(Date.parse(session.issuedAt ?? '')) ||
      !Number.isFinite(Date.parse(session.expiresAt ?? ''))
    )
      return null;
    // Only the server can expire a session; a customer's clock may be wrong.
    return session as SelfServiceSession;
  } catch {
    return null;
  }
}

export function clearSelfServiceSession(branchId: string) {
  try {
    window.sessionStorage.removeItem(selfServiceSessionKey(branchId));
  } catch {
    // Continue in memory when browser storage is blocked.
  }
}

export function saveSelfServiceSession(session: SelfServiceSession) {
  try {
    window.sessionStorage.setItem(selfServiceSessionKey(session.branchId), JSON.stringify(session));
  } catch {
    // Continue in memory when browser storage is blocked.
  }
}

const scanLimitKey = (branchId: string) => `${selfServiceSessionKey(branchId)}:limit`;
export function hasSelfServiceScanLimit(branchId: string) {
  try {
    return window.sessionStorage.getItem(scanLimitKey(branchId)) === '10';
  } catch {
    return false;
  }
}
export function setSelfServiceScanLimit(branchId: string, reached: boolean) {
  try {
    if (reached) window.sessionStorage.setItem(scanLimitKey(branchId), '10');
    else window.sessionStorage.removeItem(scanLimitKey(branchId));
  } catch {
    /* Keep the current page usable when storage is blocked. */
  }
}
