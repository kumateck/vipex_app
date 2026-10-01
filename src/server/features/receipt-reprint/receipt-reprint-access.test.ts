import { describe, expect, test } from 'bun:test';
import { BranchType } from '@/db/schemas/enums';
import type { AuthUser } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { canReadReceiptReprintTax } from './receipt-reprint-access';

const sourceParcel = { companyId: 'company-a', sourceId: 'source-a' };
const user: AuthUser = {
  sub: 'user-a',
  email: 'cashier@example.com',
  companyId: 'company-a',
  branchId: 'source-a',
  branchType: BranchType.AGENCY,
  permissions: [PermissionKeys.CanReadConsignments],
};

describe('receipt reprint tax access', () => {
  test('allows the source branch and same-company head office', () => {
    expect(canReadReceiptReprintTax(user, sourceParcel)).toBe(true);
    expect(
      canReadReceiptReprintTax(
        { ...user, branchId: 'head-office', branchType: BranchType.HEADOFFICE },
        sourceParcel,
      ),
    ).toBe(true);
  });

  test('rejects other companies and unrelated branches', () => {
    expect(canReadReceiptReprintTax(user, { ...sourceParcel, companyId: 'company-b' })).toBe(false);
    expect(canReadReceiptReprintTax({ ...user, branchId: 'destination-a' }, sourceParcel)).toBe(
      false,
    );
  });

  test('allows company-wide parcel readers', () => {
    expect(
      canReadReceiptReprintTax(
        { ...user, branchId: 'another-branch', permissions: [PermissionKeys.CanReadParcels] },
        sourceParcel,
      ),
    ).toBe(true);
  });
});
