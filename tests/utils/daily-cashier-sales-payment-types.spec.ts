import { describe, expect, test } from 'bun:test';
import { CashierType } from '@/db/schemas/enums';
import { getDailyCashierSalesPaymentTypes } from '@/server/features/reporting/daily-cashier-sales-filter';

describe('daily cashier sales payment type scope', () => {
  test('full cashier includes sender, receiver, and delivery modules', () => {
    expect(getDailyCashierSalesPaymentTypes(CashierType.FULL)).toEqual([
      CashierType.SENDING,
      CashierType.TOBEPAID,
      CashierType.DELIVERY,
    ]);
  });

  test('specific and unfiltered scopes remain unchanged', () => {
    expect(getDailyCashierSalesPaymentTypes(CashierType.SENDING)).toEqual([CashierType.SENDING]);
    expect(getDailyCashierSalesPaymentTypes(null)).toBeNull();
  });
});
