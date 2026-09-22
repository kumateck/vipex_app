import { CashierType, UserType } from '@/db/schemas/enums';
import { BadRequest } from '@/server/utils/http-error';

export function normalizeCashierTypeByUserType(userType: number, cashierType?: number | null) {
  if (userType !== UserType.CASHIER) return null;
  if (cashierType === null || cashierType === undefined) {
    throw BadRequest('Cashier type is required for cashier users');
  }
  if (cashierType < CashierType.SENDING || cashierType > CashierType.FULL) {
    throw BadRequest('Invalid cashier type');
  }
  return cashierType;
}

export function getCashierTypeUpdate(
  current: { userType: number; cashierType: CashierType | null },
  patch: { userType?: number; cashierType?: CashierType | null },
): { cashierType?: CashierType | null } {
  if (patch.userType === undefined && patch.cashierType === undefined) return {};

  return {
    cashierType: normalizeCashierTypeByUserType(
      patch.userType ?? current.userType,
      patch.cashierType !== undefined ? patch.cashierType : current.cashierType,
    ),
  };
}
