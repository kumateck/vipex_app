import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';
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
  PaymentComponent,
} from '@/db/schemas/enums';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import {
  parsePositiveCedis,
  type CreditParcel,
  type CreditSettlementInput,
} from '@/shared/customers/credit-settlement';
import { listOpenParcelCharges } from './repository';

export async function listCreditParcelsSvc(input: { companyId: string; customerId: string }) {
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(
      and(
        eq(customers.id, input.customerId),
        eq(customers.companyId, input.companyId),
        eq(customers.isDeleted, false),
      ),
    );
  if (!customer) throw NotFound('Customer not found');
  const charges = await listOpenParcelCharges(input.companyId, input.customerId);
  const grouped = new Map<string, CreditParcel>();
  for (const charge of charges) {
    const item = grouped.get(charge.parcelId) ?? {
      parcelId: charge.parcelId,
      bookingCode: charge.bookingCode,
      trackingCode: charge.trackingCode,
      createdAt: charge.createdAt,
      chargeAmountPsw: 0,
      allocatedAmountPsw: 0,
      outstandingAmountPsw: 0,
    };
    item.chargeAmountPsw += charge.chargeAmountPsw;
    item.allocatedAmountPsw += charge.allocatedAmountPsw;
    item.outstandingAmountPsw += charge.outstandingAmountPsw;
    grouped.set(charge.parcelId, item);
  }
  return [...grouped.values()];
}

export async function postCustomerCreditPaymentSvc(
  input: CreditSettlementInput & {
    companyId: string;
    customerId: string;
    createdBy: string;
  },
) {
  const amountPsw = parsePositiveCedis(input.amountCedis);
  const ids = input.parcelIds;
  if (amountPsw === null)
    throw BadRequest('Enter a positive payment with at most two decimal places');
  if (!Array.isArray(ids) || !ids.length || ids.length > 200 || new Set(ids).size !== ids.length) {
    throw BadRequest('Select between 1 and 200 distinct parcels to settle');
  }
  const selectedIds = new Set(ids);
  return db.transaction(async (tx) => {
    // Serialize repayments and charge changes for this account, then lock parcels in ID order.
    const [customer] = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.id, input.customerId),
          eq(customers.companyId, input.companyId),
          eq(customers.isDeleted, false),
        ),
      )
      .for('update');
    if (!customer) throw NotFound('Customer not found');
    await tx
      .select({ id: parcels.id })
      .from(parcels)
      .where(and(eq(parcels.companyId, input.companyId), inArray(parcels.id, [...ids].sort())))
      .orderBy(asc(parcels.id))
      .for('update');
    await tx
      .select({ id: customerCreditTransactions.id })
      .from(customerCreditTransactions)
      .where(
        and(
          eq(customerCreditTransactions.companyId, input.companyId),
          eq(customerCreditTransactions.customerId, input.customerId),
          inArray(customerCreditTransactions.referenceId, ids),
        ),
      )
      .orderBy(asc(customerCreditTransactions.id))
      .for('update');
    const selected = (await listOpenParcelCharges(input.companyId, input.customerId, tx)).filter(
      (charge) => selectedIds.has(charge.parcelId),
    );
    if (new Set(selected.map((charge) => charge.parcelId)).size !== ids.length) {
      throw Conflict('A selected parcel has no payable debt for this customer. Refresh the list.');
    }
    const [unallocated] = await tx.execute(sql`
      SELECT COALESCE(SUM(GREATEST(-credit.signed_amount_psw - COALESCE(allocated.amount_psw, 0), 0)), 0) AS amount
      FROM customer_credit_transactions credit
      LEFT JOIN LATERAL (
        SELECT SUM(cca.amount_psw) AS amount_psw FROM customer_credit_allocations cca
        WHERE cca.payment_transaction_id = credit.id AND cca.company_id = credit.company_id
          AND cca.customer_id = credit.customer_id
      ) allocated ON true
      WHERE credit.company_id = ${input.companyId} AND credit.customer_id = ${input.customerId}
        AND credit.transaction_type = ${CustomerCreditTransactionType.PAYMENT}
        AND credit.signed_amount_psw < 0
    `);
    if (Number(unallocated?.amount) > 0) {
      throw Conflict(
        'This customer has unallocated credit from an earlier payment. Finance must reconcile it before collecting another payment.',
      );
    }
    const principalIds = selected
      .filter((charge) => charge.sourceType === CustomerCreditSourceType.PARCEL)
      .map((charge) => charge.parcelId);
    const [conflictingPayment] = await tx
      .select({ id: payments.id })
      .from(payments)
      .where(
        and(
          eq(payments.companyId, input.companyId),
          inArray(payments.parcelId, principalIds.length ? principalIds : ['__none__']),
          eq(payments.component, PaymentComponent.PRINCIPAL),
          isNull(payments.voidedAt),
        ),
      )
      .limit(1);
    if (conflictingPayment)
      throw Conflict(
        'A selected parcel already has a principal payment. Finance must review it before settling credit.',
      );
    const total = selected.reduce((sum, charge) => sum + charge.outstandingAmountPsw, 0);
    if (!Number.isSafeInteger(total) || amountPsw !== total) {
      throw BadRequest(
        `Amount paid must equal the selected parcels' outstanding total: GHS ${(total / 100).toFixed(2)}. Partial payments and excess amounts are not allowed.`,
      );
    }
    const [payment] = await tx
      .insert(customerCreditTransactions)
      .values({
        companyId: input.companyId,
        customerId: input.customerId,
        createdBy: input.createdBy,
        sourceType: CustomerCreditSourceType.MANUAL,
        transactionType: CustomerCreditTransactionType.PAYMENT,
        signedAmountPsw: -amountPsw,
        referenceId: input.referenceId?.trim() || null,
        notes: input.notes?.trim() || null,
      })
      .returning({ id: customerCreditTransactions.id });
    const allocations = selected.map((charge) => ({
      chargeTransactionId: charge.chargeTransactionId,
      amountPsw: charge.outstandingAmountPsw,
    }));
    await tx.insert(customerCreditAllocations).values(
      allocations.map((allocation) => ({
        ...allocation,
        companyId: input.companyId,
        customerId: input.customerId,
        paymentTransactionId: payment!.id,
        createdBy: input.createdBy,
      })),
    );
    await tx.insert(auditLogs).values({
      companyId: input.companyId,
      actorUserId: input.createdBy,
      entityType: 'customer_credit_payment',
      entityId: payment!.id,
      action: 'CUSTOMER_CREDIT_PARCELS_SETTLED',
      metadata: { parcelIds: ids, amountPsw, allocations },
    });
    return { id: payment!.id, allocatedAmountPsw: amountPsw, unallocatedAmountPsw: 0, allocations };
  });
}
