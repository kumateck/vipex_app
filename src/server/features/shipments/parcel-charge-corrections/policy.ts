import { assertParcelCanAccrueCharge } from '../charge-exemption';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  customers,
  parcels,
  payments,
  customerCreditTransactions,
  parcelReconciliationCases,
} from '@/db/schemas';
import { CustomerCreditSourceType, PaymentMethod } from '@/db/schemas/enums';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import { parsePositiveCedis } from '@/shared/customers/credit-settlement';
import { getParcelChargeValidationError } from '@/shared/shipments/parcel-charge-policy';

export type CorrectionTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export function correctionAmount(value: string | number) {
  const psw = parsePositiveCedis(value);
  if (psw === null) throw BadRequest('Enter a positive charge with at most two decimal places');
  const error = getParcelChargeValidationError({ chargeCedis: psw / 100, plannedToBePaidCedis: 0 });
  if (error) throw BadRequest(error);
  return psw;
}
export async function lockZeroChargeParcel(
  tx: CorrectionTx,
  companyId: string,
  parcelId: string,
  customerId: string,
) {
  // Same account-first order as credit settlement; approval cannot race debt collection.
  const [customer] = await tx
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.id, customerId),
        eq(customers.companyId, companyId),
        eq(customers.isDeleted, false),
      ),
    )
    .for('update');
  const [parcel] = await tx
    .select()
    .from(parcels)
    .where(
      and(eq(parcels.id, parcelId), eq(parcels.companyId, companyId), eq(parcels.isDeleted, false)),
    )
    .for('update');
  if (!parcel || !customer) throw NotFound('Parcel or sender credit account not found');
  assertParcelCanAccrueCharge(parcel, 1);
  if (parcel.senderId !== customerId)
    throw Conflict('Parcel sender changed. Reject this request and submit a new correction.');
  if (parcel.chargePsw !== 0 || parcel.plannedToBePaidPsw !== 0)
    throw Conflict(
      'Only parcels with a zero charge and zero receiver balance can be corrected here',
    );
  if ([6, 10, 11, 13, 14, 17, 18, 19].includes(parcel.status))
    throw Conflict('Delivered, returned, cancelled or disposed parcels require Accounts review');
  if (![PaymentMethod.CASH, PaymentMethod.CREDIT].includes(parcel.method))
    throw Conflict('Electronic-payment parcels require Accounts review');
  if (!customer.creditEligible)
    throw Conflict(
      'The sender must have approved customer credit before requesting a CREDIT charge',
    );
  const [payment] = await tx
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.companyId, companyId),
        eq(payments.parcelId, parcelId),
        eq(payments.component, 0),
        isNull(payments.voidedAt),
      ),
    )
    .limit(1);
  if (payment) throw Conflict('A principal payment exists. Accounts must review this parcel.');
  const [reconciliation] = await tx
    .select({ id: parcelReconciliationCases.id })
    .from(parcelReconciliationCases)
    .where(
      and(
        eq(parcelReconciliationCases.companyId, companyId),
        eq(parcelReconciliationCases.parcelId, parcelId),
        inArray(parcelReconciliationCases.status, [0, 1]),
      ),
    )
    .limit(1);
  if (reconciliation)
    throw Conflict('Resolve the open parcel reconciliation case before requesting a credit charge');
  const [credit] = await tx
    .select({ id: customerCreditTransactions.id })
    .from(customerCreditTransactions)
    .where(
      and(
        eq(customerCreditTransactions.companyId, companyId),
        eq(customerCreditTransactions.referenceId, parcelId),
        eq(customerCreditTransactions.sourceType, CustomerCreditSourceType.PARCEL),
      ),
    )
    .limit(1);
  if (credit)
    throw Conflict('A parcel credit entry already exists. Accounts must reconcile it first.');
  return { parcel, customer };
}
export async function assertAvailableCredit(
  tx: CorrectionTx,
  companyId: string,
  customerId: string,
  limitPsw: number,
  chargePsw: number,
) {
  const [balance] = await tx
    .select({ value: sql<number>`coalesce(sum(${customerCreditTransactions.signedAmountPsw}), 0)` })
    .from(customerCreditTransactions)
    .where(
      and(
        eq(customerCreditTransactions.companyId, companyId),
        eq(customerCreditTransactions.customerId, customerId),
      ),
    );
  if (limitPsw > 0 && Number(balance?.value) + chargePsw > limitPsw)
    throw Conflict('The proposed charge exceeds the sender’s available approved credit');
}
