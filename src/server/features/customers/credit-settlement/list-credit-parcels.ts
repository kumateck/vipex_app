import { and, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { customers } from '@/db/schemas';
import type { OutstandingDebtParcel } from '@/shared/customers/outstanding-debt';
import { NotFound } from '@/server/utils/http-error';
import { listOpenParcelCharges, type CreditExecutor } from './repository';

export async function assertActiveCreditCustomer(
  input: { companyId: string; customerId: string },
  executor: CreditExecutor,
) {
  const [customer] = await executor
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
}

export async function listDetailedCreditParcels(
  input: { companyId: string; customerId: string },
  executor: CreditExecutor,
) {
  const charges = await listOpenParcelCharges(input.companyId, input.customerId, executor);
  const grouped = new Map<string, OutstandingDebtParcel>();

  for (const charge of charges) {
    const item = grouped.get(charge.parcelId) ?? {
      parcelId: charge.parcelId,
      bookingCode: charge.bookingCode,
      trackingCode: charge.trackingCode,
      createdAt: charge.createdAt,
      parcelDetails: charge.parcelDetails,
      parcelContent: charge.parcelContent,
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

export async function listCreditParcelsSvc(input: { companyId: string; customerId: string }) {
  await assertActiveCreditCustomer(input, db);
  const parcels = await listDetailedCreditParcels(input, db);
  return parcels.map(
    ({ parcelDetails: _parcelDetails, parcelContent: _parcelContent, ...parcel }) => parcel,
  );
}
