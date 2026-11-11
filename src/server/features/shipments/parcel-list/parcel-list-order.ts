import { effectiveParcelReceivedAt } from '../parcel-repositories/parcel-repository.types';
import { and, asc, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';

import { parcels, pickupQueues } from '@/db/schemas';
import { ParcelStatus } from '@/db/schemas/enums';

import type { ListParcelsParams } from '../parcels.repository';
import type { createParcelListContext } from './parcel-list-context';
import { getPickupQueueDate } from '@/server/features/pickup-queues/queue-date';
export function createParcelListOrder(
  p: ListParcelsParams,
  context: ReturnType<typeof createParcelListContext>,
  now = new Date(),
) {
  const { whereParts, s, r, senderName, receiverName, secondReceiverName } = context;
  const sort = p.sort ?? [];
  const orderBy = p.callCenterAssignmentOrder
    ? [
        asc(sql`case when ${parcels.callCenterAssignedToUserId} is null then 0 else 1 end`),
        desc(sql`coalesce(${effectiveParcelReceivedAt()}, ${parcels.createdAt})`),
        desc(parcels.id),
      ]
    : p.shelfPickerAssignmentOrder
      ? [
          asc(
            sql`case when coalesce(${parcels.shelfPickerStaffId}, ${pickupQueues.pickerStaffId}) is null then 0 else 1 end`,
          ),
          ...(sort.some((item) => item.field === 'pickupQueueNumber')
            ? [asc(pickupQueues.queueNumber)]
            : [asc(parcels.createdAt)]),
          asc(parcels.id),
        ]
      : sort.length
        ? sort
            .map((srt) => {
              if (srt.field === 'createdAt')
                return srt.direction === 'desc' ? desc(parcels.createdAt) : asc(parcels.createdAt);
              if (srt.field === 'trackingCode')
                return srt.direction === 'desc'
                  ? desc(parcels.trackingCode)
                  : asc(parcels.trackingCode);
              if (srt.field === 'bookingCode')
                return srt.direction === 'desc'
                  ? desc(parcels.bookingCode)
                  : asc(parcels.bookingCode);
              if (srt.field === 'pickupQueueNumber')
                return srt.direction === 'desc'
                  ? desc(pickupQueues.queueNumber)
                  : asc(pickupQueues.queueNumber);
              if (srt.field === 'id')
                return srt.direction === 'desc' ? desc(parcels.id) : asc(parcels.id);
              return null;
            })
            .filter((value): value is ReturnType<typeof asc> => value !== null)
        : [asc(parcels.createdAt), asc(parcels.id)];
  const currentQueueOnly =
    p.pickupQueueTodayOnly || (p.status === ParcelStatus.AWAITING_PICKUP && !p.shelfPickerAssigned);
  const pickupQueueJoin = currentQueueOnly
    ? and(
        eq(pickupQueues.parcelId, parcels.id),
        eq(pickupQueues.queueDate, getPickupQueueDate(now)),
        isNull(pickupQueues.endedAt),
      )
    : sql`${pickupQueues.id} = (
        select pq_latest.id from pickup_queues pq_latest
        where pq_latest.parcel_id = ${parcels.id}
        ${p.shelfPickerAssigned || p.shelfPickerAssignmentOrder ? sql`and pq_latest.ended_at is null` : sql``}
        order by pq_latest.queue_date desc, pq_latest.queued_at desc, pq_latest.id desc limit 1
      )`;
  const whereClause =
    whereParts.length || p.search
      ? and(
          ...(whereParts as [(typeof whereParts)[number], ...(typeof whereParts)[number][]]),
          ...(p.search
            ? [
                or(
                  ilike(parcels.bookingCode, `%${p.search}%`),
                  ilike(parcels.relatedStaffNameSnapshot, `%${p.search}%`),
                  ilike(parcels.trackingCode, `%${p.search}%`),
                  ilike(senderName, `%${p.search}%`),
                  ilike(s.telephone, `%${p.search}%`),
                  ilike(s.telephone2, `%${p.search}%`),
                  ilike(receiverName, `%${p.search}%`),
                  ilike(secondReceiverName, `%${p.search}%`),
                  ilike(r.telephone, `%${p.search}%`),
                  ilike(r.telephone2, `%${p.search}%`),
                ),
              ]
            : []),
        )
      : undefined;
  return { sort, orderBy, pickupQueueJoin, whereClause };
}
