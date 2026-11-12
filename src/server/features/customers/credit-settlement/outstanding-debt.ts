import { db } from '@/db/config';
import type { OutstandingDebtStatement } from '@/shared/customers/outstanding-debt';
import { getCustomerCreditBalancePswRepo } from '../customer-repositories/customer-credit.repository';
import { assertActiveCreditCustomer, listDetailedCreditParcels } from './list-credit-parcels';

export function getOutstandingDebtStatement(input: {
  companyId: string;
  customerId: string;
}): Promise<OutstandingDebtStatement> {
  return db.transaction(
    async (tx) => {
      const generatedAt = new Date().toISOString();
      await assertActiveCreditCustomer(input, tx);
      const [parcels, accountBalancePsw] = await Promise.all([
        listDetailedCreditParcels(input, tx),
        getCustomerCreditBalancePswRepo({ ...input, executor: tx }),
      ]);
      const parcelOutstandingPsw = parcels.reduce(
        (total, parcel) => total + parcel.outstandingAmountPsw,
        0,
      );
      return {
        generatedAt,
        parcels,
        summary: {
          parcelCount: parcels.length,
          oldestParcelCreatedAt: parcels[0]?.createdAt ?? null,
          parcelOutstandingPsw,
          otherCreditActivityPsw: accountBalancePsw - parcelOutstandingPsw,
          accountBalancePsw,
        },
      };
    },
    { isolationLevel: 'repeatable read', accessMode: 'read only' },
  );
}
