import { describe, expect, it } from 'bun:test';
import { UserType } from '@mobile/constants/user-types';
import { resolveMobileDashboardKind } from './mobile-dashboard-identity';

describe('mobile dashboard identity', () => {
  it('reserves the rider dashboard for Rider user type', () => {
    expect(resolveMobileDashboardKind(UserType.RIDER)).toBe('rider');
    expect(resolveMobileDashboardKind(String(UserType.RIDER))).toBe('rider');
  });

  it('keeps staff users, including IT officers, on the standard dashboard', () => {
    expect(resolveMobileDashboardKind(UserType.STAFF)).toBe('standard');
    expect(resolveMobileDashboardKind(String(UserType.STAFF))).toBe('standard');
  });

  it('does not infer rider identity when user type is absent or invalid', () => {
    expect(resolveMobileDashboardKind(null)).toBe('standard');
    expect(resolveMobileDashboardKind(undefined)).toBe('standard');
    expect(resolveMobileDashboardKind('rider')).toBe('standard');
  });

  it('keeps the cashier dashboard limited to Cashier user type', () => {
    expect(resolveMobileDashboardKind(UserType.CASHIER)).toBe('cashier');
  });
});
