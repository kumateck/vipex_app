import { and, eq, or, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcels, payments, PaymentComponent, ParcelStatus } from '@/db/schemas';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import { recordAuditLog } from '../audit/logger';

type RepairScope = { companyId: string; branchId: string; search: string };

async function findParcel(scope: RepairScope) {
  const normalized = scope.search.trim();
  if (normalized.length < 3) throw BadRequest('Enter at least 3 characters');
  const query = db
    .select({
      id: parcels.id,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      sourceId: parcels.sourceId,
      destinationId: parcels.destinationId,
      status: parcels.status,
      chargePsw: parcels.chargePsw,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      isDeleted: parcels.isDeleted,
    })
    .from(parcels)
    .where(
      and(
        eq(parcels.companyId, scope.companyId),
        eq(parcels.isDeleted, false),
        or(eq(parcels.sourceId, scope.branchId), eq(parcels.destinationId, scope.branchId)),
        or(eq(parcels.bookingCode, normalized), eq(parcels.trackingCode, normalized)),
      ),
    )
    .limit(2);
  const rows = await query;
  if (rows.length > 1) {
    throw Conflict('Multiple parcels match this booking code; search using the tracking code');
  }
  if (!rows[0]) throw NotFound('Parcel not found for this branch');
  return rows[0];
}

async function getRepairView(scope: RepairScope) {
  const parcel = await findParcel(scope);
  const principalPaymentRows = await db
    .select({ amountPsw: payments.grossAmountPsw })
    .from(payments)
    .where(
      and(
        eq(payments.parcelId, parcel.id),
        eq(payments.component, PaymentComponent.PRINCIPAL),
        sql`${payments.voidedAt} is null`,
      ),
    );
  const paidPrincipalPsw = principalPaymentRows.reduce(
    (sum, payment) => sum + payment.amountPsw,
    0,
  );
  const expectedToBePaidPsw = Math.max(parcel.chargePsw - paidPrincipalPsw, 0);
  const deliveryConfirmed =
    parcel.status === ParcelStatus.DELIVERED_BY_OFFICE ||
    parcel.status === ParcelStatus.DELIVERED_AT_HOME;
  return {
    id: parcel.id,
    bookingCode: parcel.bookingCode,
    trackingCode: parcel.trackingCode,
    status: parcel.status,
    chargePsw: parcel.chargePsw,
    activePrincipalPaidPsw: paidPrincipalPsw,
    currentToBePaidPsw: parcel.plannedToBePaidPsw,
    expectedToBePaidPsw,
    needsRepair: expectedToBePaidPsw !== parcel.plannedToBePaidPsw,
    canRepair: !deliveryConfirmed,
    restriction: deliveryConfirmed
      ? 'A currently delivered parcel cannot be financially repaired here.'
      : null,
  };
}

export async function previewParcelFinancialRepairSvc(scope: RepairScope) {
  return getRepairView(scope);
}

export async function repairParcelFinancialStateSvc(
  input: RepairScope & {
    actorUserId: string;
    reason: string;
  },
) {
  const reason = input.reason.trim();
  if (reason.length < 5) throw BadRequest('Enter a reason of at least 5 characters');
  const repaired = await db.transaction(async (tx) => {
    const matchingParcels = await tx
      .select({
        id: parcels.id,
        bookingCode: parcels.bookingCode,
        trackingCode: parcels.trackingCode,
        status: parcels.status,
        chargePsw: parcels.chargePsw,
        plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      })
      .from(parcels)
      .where(
        and(
          eq(parcels.companyId, input.companyId),
          eq(parcels.isDeleted, false),
          or(eq(parcels.sourceId, input.branchId), eq(parcels.destinationId, input.branchId)),
          or(
            eq(parcels.bookingCode, input.search.trim()),
            eq(parcels.trackingCode, input.search.trim()),
          ),
        ),
      )
      .limit(2)
      .for('update');
    if (matchingParcels.length > 1) {
      throw Conflict('Multiple parcels match this booking code; search using the tracking code');
    }
    const parcel = matchingParcels[0];
    if (!parcel) throw NotFound('Parcel not found for this branch');
    if (
      parcel.status === ParcelStatus.DELIVERED_BY_OFFICE ||
      parcel.status === ParcelStatus.DELIVERED_AT_HOME
    ) {
      throw Conflict('A currently delivered parcel cannot be financially repaired here');
    }
    const [paymentsTotal] = await tx
      .select({
        totalPsw: sql<number>`coalesce(sum(${payments.grossAmountPsw}), 0)::int`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.parcelId, parcel.id),
          eq(payments.component, PaymentComponent.PRINCIPAL),
          sql`${payments.voidedAt} is null`,
        ),
      );
    const paidPrincipalPsw = Number(paymentsTotal?.totalPsw ?? 0);
    const expectedToBePaidPsw = Math.max(parcel.chargePsw - paidPrincipalPsw, 0);
    if (expectedToBePaidPsw === parcel.plannedToBePaidPsw) {
      throw Conflict('The parcel To Be Paid amount already matches its active principal payments');
    }
    const [updated] = await tx
      .update(parcels)
      .set({ plannedToBePaidPsw: expectedToBePaidPsw, updatedAt: new Date() })
      .where(
        and(eq(parcels.id, parcel.id), eq(parcels.plannedToBePaidPsw, parcel.plannedToBePaidPsw)),
      )
      .returning({ id: parcels.id });
    if (!updated) throw Conflict('The parcel changed during repair; preview it again');
    return { ...parcel, paidPrincipalPsw, expectedToBePaidPsw };
  });

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'parcel',
    entityId: repaired.id,
    action: 'PARCEL_FINANCIAL_STATE_REPAIRED',
    message: `To Be Paid repaired for ${repaired.bookingCode}`,
    metadata: {
      reason,
      previousToBePaidPsw: repaired.plannedToBePaidPsw,
      repairedToBePaidPsw: repaired.expectedToBePaidPsw,
      chargePsw: repaired.chargePsw,
      activePrincipalPaidPsw: repaired.paidPrincipalPsw,
      status: repaired.status,
      branchId: input.branchId,
    },
  });
  return {
    id: repaired.id,
    bookingCode: repaired.bookingCode,
    trackingCode: repaired.trackingCode,
    previousToBePaidPsw: repaired.plannedToBePaidPsw,
    plannedToBePaidPsw: repaired.expectedToBePaidPsw,
  };
}
