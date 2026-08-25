import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { deliveries, parcels, payments } from '@/db/schemas';
import { PaymentComponent } from '@/db/schemas/enums';

export async function getRiderDailyAnalyticsRepo(input: {
  riderUserId: string;
  start: Date;
  end: Date;
}) {
  const startTimestamp = input.start.toISOString();
  const endTimestamp = input.end.toISOString();
  const assignedTimestamp = sql`coalesce(
    ${deliveries.riderAssignedAt},
    case
      when ${deliveries.status} in ('ASSIGNED', 'DISPATCHED', 'OUT_FOR_DELIVERY')
        then ${deliveries.updatedAt}
      else null
    end
  )`;
  const principalPaidBeforeCompletion = sql<number>`coalesce((
    select sum(${payments.grossAmountPsw})
    from ${payments}
    where ${payments.parcelId} = ${parcels.id}
      and ${payments.component} = ${PaymentComponent.PRINCIPAL}
      and ${payments.voidedAt} is null
      and ${payments.receivedAt} <= ${deliveries.riderCompletedAt}
  ), 0)`;
  const principalPaidAfterCompletion = sql<number>`coalesce((
    select sum(${payments.grossAmountPsw})
    from ${payments}
    where ${payments.parcelId} = ${parcels.id}
      and ${payments.component} = ${PaymentComponent.PRINCIPAL}
      and ${payments.voidedAt} is null
      and ${payments.receivedAt} > ${deliveries.riderCompletedAt}
  ), 0)`;
  const deliveryFeePaidBeforeCompletion = sql<number>`coalesce((
    select sum(${payments.grossAmountPsw})
    from ${payments}
    where ${payments.parcelId} = ${parcels.id}
      and ${payments.component} = ${PaymentComponent.DELIVERY_FEE}
      and ${payments.voidedAt} is null
      and ${payments.receivedAt} <= ${deliveries.riderCompletedAt}
  ), 0)`;
  const principalCollectableAtCompletion = sql<number>`greatest(
    ${parcels.plannedToBePaidPsw}
      + ${principalPaidAfterCompletion}
      - ${principalPaidBeforeCompletion},
    0
  )`;
  const deliveryFeeCollectableAtCompletion = sql<number>`greatest(
    ${deliveries.chargePsw} - ${deliveryFeePaidBeforeCompletion},
    0
  )`;
  const [deliveryRows, collectionRows] = await Promise.all([
    db
      .select({
        assigned: sql<number>`count(*) filter (where ${assignedTimestamp} >= ${startTimestamp} and ${assignedTimestamp} < ${endTimestamp})`,
        completed: sql<number>`count(*) filter (where ${deliveries.riderCompletedAt} >= ${startTimestamp} and ${deliveries.riderCompletedAt} < ${endTimestamp})`,
        returned: sql<number>`count(*) filter (where ${deliveries.returnedAt} >= ${startTimestamp} and ${deliveries.returnedAt} < ${endTimestamp})`,
      })
      .from(deliveries)
      .where(and(eq(deliveries.riderUserId, input.riderUserId), eq(deliveries.isDeleted, false))),
    db
      .select({
        toBePaidReceivedPsw: sql<number>`coalesce(sum(case
          when ${deliveries.riderCompletedAt} >= ${startTimestamp}
            and ${deliveries.riderCompletedAt} < ${endTimestamp}
          then case
            when ${deliveries.riderCollectionRecordedAt} is not null
              then least(
                ${deliveries.riderCollectedPrincipalPsw},
                ${principalCollectableAtCompletion}
              )
            else ${principalCollectableAtCompletion}
          end
          else 0 end), 0)`,
        deliveryFeeReceivedPsw: sql<number>`coalesce(sum(case
          when ${deliveries.riderCompletedAt} >= ${startTimestamp}
            and ${deliveries.riderCompletedAt} < ${endTimestamp}
          then case
            when ${deliveries.riderCollectionRecordedAt} is not null
              then least(
                ${deliveries.riderCollectedDeliveryFeePsw},
                ${deliveryFeeCollectableAtCompletion}
              )
            else ${deliveryFeeCollectableAtCompletion}
          end
          else 0 end), 0)`,
      })
      .from(deliveries)
      .innerJoin(parcels, eq(parcels.id, deliveries.parcelId))
      .where(and(eq(deliveries.riderUserId, input.riderUserId), eq(deliveries.isDeleted, false))),
  ]);

  const delivery = deliveryRows[0];
  const collection = collectionRows[0];
  const toBePaidReceivedPsw = Number(collection?.toBePaidReceivedPsw ?? 0);
  const deliveryFeeReceivedPsw = Number(collection?.deliveryFeeReceivedPsw ?? 0);
  return {
    assignedCount: Number(delivery?.assigned ?? 0),
    completedCount: Number(delivery?.completed ?? 0),
    returnedCount: Number(delivery?.returned ?? 0),
    toBePaidReceivedPsw,
    deliveryFeeReceivedPsw,
    totalAmountReceivedPsw: toBePaidReceivedPsw + deliveryFeeReceivedPsw,
  };
}
