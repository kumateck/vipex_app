import { describe, expect, test } from 'bun:test';
import { CashierType, UserType } from '@/db/schemas/enums';
import { getCashierTypeUpdate } from '@/server/features/users/cashier-type';

describe('user cashier type updates', () => {
  test('keeps a status-only update independent of a missing legacy cashier type', () => {
    const current = { userType: UserType.CASHIER, cashierType: null };

    expect(getCashierTypeUpdate(current, {})).toEqual({});
    expect(
      getCashierTypeUpdate({ userType: UserType.CASHIER, cashierType: CashierType.FULL }, {}),
    ).toEqual({});
  });

  test('preserves the existing cashier type when another user field changes', () => {
    const current = { userType: UserType.CASHIER, cashierType: CashierType.SENDING };

    expect(getCashierTypeUpdate(current, {})).toEqual({});
    expect(getCashierTypeUpdate(current, { userType: UserType.CASHIER })).toEqual({
      cashierType: CashierType.SENDING,
    });
  });

  test('requires a cashier type when assigning the cashier user type', () => {
    const current = { userType: UserType.STAFF, cashierType: null };

    expect(() => getCashierTypeUpdate(current, { userType: UserType.CASHIER })).toThrow(
      'Cashier type is required for cashier users',
    );
    expect(
      getCashierTypeUpdate(current, {
        userType: UserType.CASHIER,
        cashierType: CashierType.FULL,
      }),
    ).toEqual({ cashierType: CashierType.FULL });
  });

  test('rejects clearing an existing cashier type and clears it on a change to staff', () => {
    const current = { userType: UserType.CASHIER, cashierType: CashierType.SENDING };

    expect(() => getCashierTypeUpdate(current, { cashierType: null })).toThrow(
      'Cashier type is required for cashier users',
    );
    expect(getCashierTypeUpdate(current, { userType: UserType.STAFF })).toEqual({
      cashierType: null,
    });
  });
});
