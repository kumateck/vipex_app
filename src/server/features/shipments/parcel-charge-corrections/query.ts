import { PermissionKeys } from '@/shared/permissions/constants';
import { assertChargePermission } from './access';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import { customers, parcelChargeCorrections, parcels, users } from '@/db/schemas';

export async function listCreditChargeRequestsSvc(input: {
  companyId: string;
  actorUserId: string;
  page?: number;
  search?: string;
  parcelId?: string;
}) {
  await assertChargePermission(input.companyId, input.actorUserId, [
    PermissionKeys.CanUpdateParcelCharge,
    PermissionKeys.CanApproveParcelCharge,
  ]);
  const requester = alias(users, 'charge_requester');
  const reviewer = alias(users, 'charge_reviewer');
  const rows = await db
    .select({
      id: parcelChargeCorrections.id,
      parcelId: parcels.id,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      customerName: customers.fullname,
      chargePsw: parcelChargeCorrections.chargePsw,
      originalMethod: parcelChargeCorrections.originalMethod,
      reason: parcelChargeCorrections.reason,
      status: parcelChargeCorrections.status,
      requestedBy: parcelChargeCorrections.requestedBy,
      requestedByName: requester.fullname,
      requestedAt: parcelChargeCorrections.requestedAt,
      reviewedByName: reviewer.fullname,
      reviewedAt: parcelChargeCorrections.reviewedAt,
      reviewNote: parcelChargeCorrections.reviewNote,
    })
    .from(parcelChargeCorrections)
    .innerJoin(
      parcels,
      and(eq(parcels.id, parcelChargeCorrections.parcelId), eq(parcels.companyId, input.companyId)),
    )
    .innerJoin(
      customers,
      and(
        eq(customers.id, parcelChargeCorrections.customerId),
        eq(customers.companyId, input.companyId),
      ),
    )
    .innerJoin(
      requester,
      and(
        eq(requester.id, parcelChargeCorrections.requestedBy),
        eq(requester.companyId, input.companyId),
      ),
    )
    .leftJoin(
      reviewer,
      and(
        eq(reviewer.id, parcelChargeCorrections.reviewedBy),
        eq(reviewer.companyId, input.companyId),
      ),
    )
    .where(
      and(
        eq(parcelChargeCorrections.companyId, input.companyId),
        input.parcelId ? eq(parcels.id, input.parcelId) : undefined,
        input.search?.trim()
          ? or(
              ilike(parcels.bookingCode, `%${input.search.trim()}%`),
              ilike(parcels.trackingCode, `%${input.search.trim()}%`),
            )
          : undefined,
      ),
    )
    .orderBy(
      parcelChargeCorrections.status,
      desc(parcelChargeCorrections.requestedAt),
      desc(parcelChargeCorrections.id),
    )
    .limit(21)
    .offset(((input.page ?? 1) - 1) * 20);
  return { data: rows.slice(0, 20), hasNextPage: rows.length > 20 };
}
