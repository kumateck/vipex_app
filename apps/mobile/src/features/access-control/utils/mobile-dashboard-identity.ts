import { UserType } from '@mobile/constants/user-types';

export type MobileDashboardKind = 'cashier' | 'rider' | 'standard';

function normalizeUserType(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function resolveMobileDashboardKind(userType: unknown): MobileDashboardKind {
  const normalized = normalizeUserType(userType);
  if (normalized === UserType.CASHIER) return 'cashier';
  if (normalized === UserType.RIDER) return 'rider';
  return 'standard';
}
