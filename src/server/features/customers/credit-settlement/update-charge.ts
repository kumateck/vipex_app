import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  auditLogs,
  customerCreditAllocations,
  customerCreditTransactions,
  customers,
  parcels,
  payments,
} from '@/db/schemas';
import {
  CustomerCreditSourceType,
  CustomerCreditTransactionType,
  ParcelStatus,
  PaymentComponent,
  PaymentMethod,
} from '@/db/schemas/enums';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import { parsePositiveCedis } from '@/shared/customers/credit-settlement';
import { getParcelChargeValidationError } from '@/shared/shipments/parcel-charge-policy';
import { effectiveChargeAmountSql } from './charge-amount';

export async function updateCreditParcelChargeSvc(input: {
  companyId: string;
  parcelId: string;
  actorUserId: string;
  chargeCedis: string | number;
  expectedChargePsw: number;
  reason: string;
}) {
  const newChargePsw = parsePositiveCedis(input.chargeCedis);
  if (newChargePsw === null)
    throw BadRequest('Enter a positive charge with at most two decimal places');
  const error = getParcelChargeValidationError({
    chargeCedis: newChargePsw / 100,
    plannedToBePaidCedis: 0,
  });
  if (error) throw BadRequest(error);
  const reason = input.reason.trim();
  if (reason.length < 3 || reason.length > 500)
    throw BadRequest('Provide a reason between 3 and 500 characters');
  const [initial] = await db
    .select({ senderId: parcels.senderId })
    .from(parcels)
    .where(
      and(
        eq(parcels.id, input.parcelId),
        eq(parcels.companyId, input.companyId),
        eq(parcels.isDeleted, false),
      ),
    );
  if (!initial) throw NotFound('Parcel not found');
  return db.transaction(async (tx) => {
    const [customer] = await tx
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.id, initial.senderId),
          eq(customers.companyId, input.companyId),
          eq(customers.isDeleted, false),
        ),
      )
      .for('update');
    const [parcel] = await tx
      .select()
      .from(parcels)
      .where(
        and(
          eq(parcels.id, input.parcelId),
          eq(parcels.companyId, input.companyId),
          eq(parcels.isDeleted, false),
        ),
      )
      .for('update');
    if (!customer || !parcel) throw NotFound('Customer or parcel not found');
    if (
      parcel.senderId !== customer.id ||
      parcel.method !== PaymentMethod.CREDIT ||
      parcel.status === ParcelStatus.CANCELLED ||
      parcel.plannedToBePaidPsw !== 0
    ) {
      throw Conflict('Only an active, fully credit parcel can have its credit charge updated');
    }
    if (parcel.chargePsw !== input.expectedChargePsw)
      throw Conflict('The charge changed. Refresh the parcel before editing.');
    const charges = await tx
      .select()
      .from(customerCreditTransactions)
      .where(
        and(
          eq(customerCreditTransactions.companyId, input.companyId),
          eq(customerCreditTransactions.customerId, customer.id),
          eq(customerCreditTransactions.referenceId, parcel.id),
          eq(customerCreditTransactions.sourceType, CustomerCreditSourceType.PARCEL),
          eq(customerCreditTransactions.transactionType, CustomerCreditTransactionType.CHARGE),
        ),
      )
      .for('update');
    if (charges.length !== 1)
      throw Conflict('Credit ledger is missing or ambiguous. Finance must review this parcel.');
    const charge = charges[0]!;
    const [allocation] = await tx
      .select({ id: customerCreditAllocations.id })
      .from(customerCreditAllocations)
      .where(eq(customerCreditAllocations.chargeTransactionId, charge.id))
      .limit(1);
    const [payment] = await tx
      .select({ id: payments.id })
      .from(payments)
      .where(
        and(
          eq(payments.parcelId, parcel.id),
          eq(payments.companyId, input.companyId),
          eq(payments.component, PaymentComponent.PRINCIPAL),
          isNull(payments.voidedAt),
        ),
      )
      .limit(1);
    if (allocation || payment)
      throw Conflict(
        'This parcel already has a payment or credit allocation. Its charge cannot be changed.',
      );
    const [effective] = await tx.execute(
      sql`SELECT ${effectiveChargeAmountSql()} AS amount FROM customer_credit_transactions cct WHERE cct.id = ${charge.id}`,
    );
    if (Number(effective?.amount) !== parcel.chargePsw)
      throw Conflict('Parcel and credit ledger amounts differ. Finance must review this parcel.');
    const delta = newChargePsw - parcel.chargePsw;
    if (delta === 0) throw BadRequest('Enter a different charge');
    const [balance] = await tx
      .select({
        value: sql<number>`COALESCE(SUM(${customerCreditTransactions.signedAmountPsw}), 0)`,
      })
      .from(customerCreditTransactions)
      .where(
        and(
          eq(customerCreditTransactions.companyId, input.companyId),
          eq(customerCreditTransactions.customerId, customer.id),
        ),
      );
    if (
      delta > 0 &&
      (!customer.creditEligible ||
        (customer.creditLimitPsw > 0 && Number(balance?.value) + delta > customer.creditLimitPsw))
    ) {
      throw Conflict('The increased charge requires available approved customer credit');
    }
    const [adjustment] = await tx
      .insert(customerCreditTransactions)
      .values({
        companyId: input.companyId,
        customerId: customer.id,
        sourceType: CustomerCreditSourceType.PARCEL,
        transactionType: CustomerCreditTransactionType.ADJUSTMENT,
        referenceId: charge.id,
        signedAmountPsw: delta,
        notes: `Credit charge updated for ${parcel.bookingCode}: ${reason}`,
        createdBy: input.actorUserId,
      })
      .returning({ id: customerCreditTransactions.id });
    await tx
      .update(parcels)
      .set({ chargePsw: newChargePsw, updatedAt: new Date() })
      .where(eq(parcels.id, parcel.id));
    await tx.insert(auditLogs).values({
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'parcel',
      entityId: parcel.id,
      action: 'CREDIT_PARCEL_CHARGE_UPDATED',
      metadata: {
        previousChargePsw: parcel.chargePsw,
        chargePsw: newChargePsw,
        chargeTransactionId: charge.id,
        adjustmentTransactionId: adjustment!.id,
        reason,
      },
    });
    return { id: parcel.id, chargePsw: newChargePsw };
  });
}
