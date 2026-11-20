import { and, desc, eq, lt, isNotNull, or, ilike, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { locations, parcels, receivingOffices } from '@/db/schemas';
import { NotFound } from '@/server/utils/http-error';
import type {
  PendingReceiverHandoverRow,
  ReceiverHandoverListQuery,
} from '@/shared/shipments/receiver-cashier-signature';
import { handoverNoteProjection } from '../../../shipments/handover-note/projection';
import {
  receivingOfficeJoin,
  receivingOfficeProjection,
} from '../../../shipments/parcel-receiving-office/projection';
import { parcelScope, type Scope } from './scope';

const PAGE_SIZE = 40;

export async function listReceiverHandovers(
  scope: Scope & ReceiverHandoverListQuery,
): Promise<{ rows: PendingReceiverHandoverRow[]; next: string | null }> {
  const [afterTime, afterId] = scope.after?.split('~') ?? [];
  const activity = sql<string>`coalesce(
    ${parcels.pendingReceiverHandover}->'capture'->>'capturedAt',
    ${parcels.pendingReceiverHandover}->>'requestedAt'
  )`;
  const search = scope.search?.trim().replace(/[\\%_]/g, '\\$&');
  const rows = await db
    .select({
      id: parcels.id,
      handoverId: sql<string>`${parcels.pendingReceiverHandover}->>'id'`,
      bookingCode: parcels.bookingCode,
      ...handoverNoteProjection,
      trackingCode: parcels.trackingCode,
      pickupLocationName: locations.name,
      ...receivingOfficeProjection,
      receiverId: parcels.receiverId,
      collectorName: sql<string>`${parcels.pendingReceiverHandover}->>'collectorName'`,
      associateName: sql<string>`${parcels.pendingReceiverHandover}->>'associateName'`,
      requestedAt: sql<string>`${parcels.pendingReceiverHandover}->>'requestedAt'`,
      signedAt: sql<string | null>`${parcels.pendingReceiverHandover}->'capture'->>'capturedAt'`,
    })
    .from(parcels)
    .leftJoin(locations, eq(locations.id, parcels.pickupLocationId))
    .leftJoin(receivingOffices, receivingOfficeJoin)
    .where(
      and(
        parcelScope(scope),
        isNotNull(parcels.pendingReceiverHandover),
        scope.parcelId ? eq(parcels.id, scope.parcelId) : undefined,
        scope.handoverId
          ? sql`${parcels.pendingReceiverHandover}->>'id' = ${scope.handoverId}`
          : undefined,
        afterTime && afterId
          ? or(lt(activity, afterTime), and(eq(activity, afterTime), lt(parcels.id, afterId)))
          : undefined,
        search
          ? or(
              ilike(parcels.trackingCode, `%${search}%`),
              ilike(parcels.bookingCode, `%${search}%`),
              ilike(sql`${parcels.pendingReceiverHandover}->>'collectorName'`, `%${search}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(activity), desc(parcels.id))
    .limit(PAGE_SIZE + 1);
  const last = rows[PAGE_SIZE - 1];
  return {
    rows: rows.slice(0, PAGE_SIZE),
    next:
      rows.length > PAGE_SIZE && last ? `${last.signedAt ?? last.requestedAt}~${last.id}` : null,
  };
}

export async function getReceiverHandoverPreview(
  scope: Scope & { parcelId: string; handoverId: string },
) {
  const capture = sql`${parcels.pendingReceiverHandover}->'capture'`;
  const [preview] = await db
    .select({
      signatureImage: sql<string>`${capture}->>'signatureImage'`,
      signedAt: sql<string>`${capture}->>'capturedAt'`,
    })
    .from(parcels)
    .where(
      and(
        parcelScope(scope),
        eq(parcels.id, scope.parcelId),
        sql`${parcels.pendingReceiverHandover}->>'id' = ${scope.handoverId}`,
        sql`${capture} is not null`,
      ),
    );
  if (!preview) throw NotFound('Signed handover not found');
  return preview;
}
