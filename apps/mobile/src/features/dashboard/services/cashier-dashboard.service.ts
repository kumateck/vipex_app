import { mobileApiGet, mobileApiPost } from '@mobile/lib/api';
import type {
  CashierDashboardAccess,
  CashierDashboardData,
  CashierSession,
  CashierSessionSummary,
  CashierSessionType,
} from '../types';

export async function getCashierDashboard(input: {
  access: CashierDashboardAccess;
  accessToken: string;
  summaryMode: 'sender' | 'receiver' | 'delivery' | 'full';
}): Promise<CashierDashboardData> {
  const [activeSession, activeSummary] = await Promise.all([
    input.access.sessions
      ? mobileApiGet<CashierSession | null>({
          path: '/cashiers/sessions/active/current',
          token: input.accessToken,
        })
      : Promise.resolve(null),
    input.access.sessions
      ? mobileApiGet<CashierSessionSummary | null>({
          path: '/cashiers/sessions/active/current/summary',
          token: input.accessToken,
          query: { mode: input.summaryMode },
        })
      : Promise.resolve(null),
  ]);

  return { activeSession, activeSummary };
}

export function listCashierSessionTypes(accessToken: string) {
  return mobileApiGet<CashierSessionType[]>({
    path: '/cashiers/session-types',
    token: accessToken,
  });
}

export function openCashierSession(
  accessToken: string,
  input: { sessionTypeId: string; openingBalanceCedis: number },
) {
  return mobileApiPost<{ id: string }>({
    path: '/cashiers/sessions',
    token: accessToken,
    body: { ...input, startTime: new Date().toISOString() },
  });
}

export function closeCashierSession(
  accessToken: string,
  input: { sessionId: string; closingBalanceCedis: number },
) {
  return mobileApiPost<{ id: string }>({
    path: `/cashiers/sessions/${input.sessionId}/close`,
    token: accessToken,
    body: {
      endTime: new Date().toISOString(),
      closingBalanceCedis: input.closingBalanceCedis,
    },
  });
}
