import { and, asc, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import { branches, customers, deliveries, parcels, payments } from '@/db/schemas';
import { PaymentComponent } from '@/db/schemas/enums';

export type RiderDeliveryRow = {
  deliveryId: string;
  parcelId: string;
  riderUserId: string | null;
  riderAssignedAt: Date | null;
  riderCompletedAt: Date | null;
  returnedAt: Date | null;
  deliveryStatus: string;
  signatureImage: string | null;
  dropoffAddress: string | null;
  deliveryFeePsw: number;
  amountPaidPsw: number;
  riderCollectedPrincipalPsw: number;
  riderCollectedDeliveryFeePsw: number;
  riderCollectionRecordedAt: Date | null;
  principalCollectableAtCompletionPsw: number;
  deliveryFeeCollectableAtCompletionPsw: number;
  trackingCode: string;
  bookingCode: string;
  parcelStatus: number;
  parcelDetails: string;
  parcelContent: string;
  plannedToBePaidPsw: number;
  outstandingPrincipalPsw: number;
  outstandingDeliveryFeePsw: number;
  chargePsw: number;
  destinationId: string;
  destinationName: string | null;
  receiverId: string;
  receiverName: string | null;
  receiverPhone: string | null;
  secondReceiverId: string | null;
  callSender: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const paidPrincipalPsw = sql<number>`coalesce((select sum(${payments.grossAmountPsw})
  from ${payments} where ${payments.parcelId} = ${parcels.id}
  and ${payments.component} = ${PaymentComponent.PRINCIPAL}
  and ${payments.voidedAt} is null), 0)`;
const paidDeliveryFeePsw = sql<number>`coalesce((select sum(${payments.grossAmountPsw})
  from ${payments} where ${payments.parcelId} = ${parcels.id}
  and ${payments.component} = ${PaymentComponent.DELIVERY_FEE}
  and ${payments.voidedAt} is null), 0)`;
const principalPaidBeforeCompletionPsw = sql<number>`coalesce((select sum(${payments.grossAmountPsw})
  from ${payments} where ${payments.parcelId} = ${parcels.id}
  and ${payments.component} = ${PaymentComponent.PRINCIPAL}
  and ${payments.voidedAt} is null
  and ${payments.receivedAt} <= ${deliveries.riderCompletedAt}), 0)`;
const principalPaidAfterCompletionPsw = sql<number>`coalesce((select sum(${payments.grossAmountPsw})
  from ${payments} where ${payments.parcelId} = ${parcels.id}
  and ${payments.component} = ${PaymentComponent.PRINCIPAL}
  and ${payments.voidedAt} is null
  and ${payments.receivedAt} > ${deliveries.riderCompletedAt}), 0)`;
const deliveryFeePaidBeforeCompletionPsw = sql<number>`coalesce((select sum(${payments.grossAmountPsw})
  from ${payments} where ${payments.parcelId} = ${parcels.id}
  and ${payments.component} = ${PaymentComponent.DELIVERY_FEE}
  and ${payments.voidedAt} is null
  and ${payments.receivedAt} <= ${deliveries.riderCompletedAt}), 0)`;

const outstandingPrincipalPsw = sql<number>`greatest(
  ${parcels.plannedToBePaidPsw} - ${paidPrincipalPsw}, 0)`.mapWith(Number);
const outstandingDeliveryFeePsw = sql<number>`greatest(
  ${deliveries.chargePsw} - ${paidDeliveryFeePsw}, 0)`.mapWith(Number);
const principalCollectableAtCompletionPsw = sql<number>`greatest(
  ${parcels.plannedToBePaidPsw} + ${principalPaidAfterCompletionPsw}
    - ${principalPaidBeforeCompletionPsw}, 0)`.mapWith(Number);
const deliveryFeeCollectableAtCompletionPsw = sql<number>`greatest(
  ${deliveries.chargePsw} - ${deliveryFeePaidBeforeCompletionPsw}, 0)`.mapWith(Number);

const riderDeliverySelection = {
  deliveryId: deliveries.id,
  parcelId: deliveries.parcelId,
  riderUserId: deliveries.riderUserId,
  riderAssignedAt: deliveries.riderAssignedAt,
  riderCompletedAt: deliveries.riderCompletedAt,
  returnedAt: deliveries.returnedAt,
  deliveryStatus: deliveries.status,
  signatureImage: deliveries.signatureImage,
  dropoffAddress: deliveries.dropoffAddress,
  deliveryFeePsw: deliveries.chargePsw,
  amountPaidPsw: deliveries.amountPaidPsw,
  riderCollectedPrincipalPsw: deliveries.riderCollectedPrincipalPsw,
  riderCollectedDeliveryFeePsw: deliveries.riderCollectedDeliveryFeePsw,
  riderCollectionRecordedAt: deliveries.riderCollectionRecordedAt,
  principalCollectableAtCompletionPsw,
  deliveryFeeCollectableAtCompletionPsw,
  trackingCode: parcels.trackingCode,
  bookingCode: parcels.bookingCode,
  parcelStatus: parcels.status,
  parcelDetails: parcels.parcelDetails,
  parcelContent: parcels.parcelContent,
  plannedToBePaidPsw: parcels.plannedToBePaidPsw,
  outstandingPrincipalPsw,
  outstandingDeliveryFeePsw,
  chargePsw: parcels.chargePsw,
  destinationId: parcels.destinationId,
  secondReceiverId: parcels.secondReceiverId,
  callSender: parcels.callSender,
  createdAt: deliveries.createdAt,
  updatedAt: deliveries.updatedAt,
};

export async function listDoorstepByRiderRepo(input: {
  riderUserId: string;
  parcelStatuses?: number[] | null;
}): Promise<RiderDeliveryRow[]> {
  const receiver = alias(customers, 'r');
  const destination = alias(branches, 'd');
  const conditions = [
    eq(deliveries.riderUserId, input.riderUserId),
    eq(deliveries.isDeleted, false),
  ];
  if (input.parcelStatuses?.length) conditions.push(inArray(parcels.status, input.parcelStatuses));

  return db
    .select({
      ...riderDeliverySelection,
      destinationName: destination.name,
      receiverId: parcels.receiverId,
      receiverName: receiver.fullname,
      receiverPhone: receiver.telephone,
    })
    .from(deliveries)
    .innerJoin(parcels, eq(parcels.id, deliveries.parcelId))
    .leftJoin(receiver, eq(receiver.id, parcels.receiverId))
    .leftJoin(destination, eq(destination.id, parcels.destinationId))
    .where(and(...conditions))
    .orderBy(desc(deliveries.updatedAt), asc(deliveries.id));
}

export async function listDoorstepByBranchRepo(input: {
  branchId: string;
  parcelStatuses?: number[] | null;
}): Promise<RiderDeliveryRow[]> {
  const receiver = alias(customers, 'r');
  const destination = alias(branches, 'd');
  const conditions = [
    eq(parcels.destinationId, input.branchId),
    eq(deliveries.isDeleted, false),
    isNotNull(deliveries.riderUserId),
  ];
  if (input.parcelStatuses?.length) conditions.push(inArray(parcels.status, input.parcelStatuses));

  return db
    .select({
      ...riderDeliverySelection,
      destinationName: destination.name,
      receiverId: parcels.receiverId,
      receiverName: receiver.fullname,
      receiverPhone: receiver.telephone,
    })
    .from(deliveries)
    .innerJoin(parcels, eq(parcels.id, deliveries.parcelId))
    .leftJoin(receiver, eq(receiver.id, parcels.receiverId))
    .leftJoin(destination, eq(destination.id, parcels.destinationId))
    .where(and(...conditions))
    .orderBy(desc(deliveries.updatedAt), asc(deliveries.id));
}
