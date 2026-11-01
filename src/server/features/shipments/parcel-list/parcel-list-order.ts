import { effectiveParcelReceivedAt } from '../parcel-repositories/parcel-repository.types';
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';

import { parcels, pickupQueues } from '@/db/schemas';

import type { ListParcelsParams } from '../parcels.repository';
import type { createParcelListContext } from './parcel-list-context';
export function createParcelListOrder(
  p: ListParcelsParams,
  context: ReturnType<typeof createParcelListContext>,
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
  const pickupQueueJoin = and(
    eq(pickupQueues.parcelId, parcels.id),
    p.shelfPickerAssigned
      ? sql`${pickupQueues.id} = (
        select pq_latest.id from pickup_queues pq_latest
        where pq_latest.parcel_id = ${parcels.id} and pq_latest.ended_at is null
        order by pq_latest.queued_at desc, pq_latest.id desc limit 1
      )`
      : undefined,
  );
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
