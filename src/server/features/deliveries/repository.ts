import { eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { and, asc, desc, inArray } from 'drizzle-orm';
import { deliveries, parcels, customers, branches } from '@/db/schemas';
import { alias } from 'drizzle-orm/pg-core';
type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export type DeliveryRow = {
  id: string;
  parcelId: string;
  mode: number;
  status: string;
  officeLocationId: string | null;
  dropoffAddress: string | null;
  frontDeskUserId: string | null;
  deliveryUserId: string | null;
  riderUserId: string | null;
  signatureImage: string | null;
  receiverCalledConfirmedBy: string | null;
  receiverCalledConfirmedAt: Date | null;
  chargePsw: number;
  amountPaidPsw: number;
  isDeleted: boolean;
  deliveredAt: Date | null;
  confirmedBy: string | null;
  confirmedAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  cashierSessionId: string | null;
};

export async function createDeliveryRepo(
  values: typeof deliveries.$inferInsert,
  executor: DbExecutor = db,
): Promise<{ id: string }> {
  const [row] = await executor.insert(deliveries).values(values).returning({ id: deliveries.id });
  if (!row) {
    throw new Error('Failed to create delivery');
  }
  return row;
}

export async function getDeliveryByParcelRepo(
  parcelId: string,
  executor: DbExecutor = db,
): Promise<DeliveryRow | null> {
  try {
    const [row] = await executor
      .select({
        id: deliveries.id,
        parcelId: deliveries.parcelId,
        mode: deliveries.mode,
        status: deliveries.status,
        officeLocationId: deliveries.officeLocationId,
        dropoffAddress: deliveries.dropoffAddress,
        frontDeskUserId: deliveries.frontDeskUserId,
        deliveryUserId: deliveries.deliveryUserId,
        riderUserId: deliveries.riderUserId,
        signatureImage: deliveries.signatureImage,
        receiverCalledConfirmedBy: deliveries.receiverCalledConfirmedBy,
        receiverCalledConfirmedAt: deliveries.receiverCalledConfirmedAt,
        chargePsw: deliveries.chargePsw,
        amountPaidPsw: deliveries.amountPaidPsw,
        isDeleted: deliveries.isDeleted,
        deliveredAt: deliveries.deliveredAt,
        confirmedBy: deliveries.confirmedBy,
        confirmedAt: deliveries.confirmedAt,
        createdBy: deliveries.createdBy,
        createdAt: deliveries.createdAt,
        updatedAt: deliveries.updatedAt,
        cashierSessionId: deliveries.cashierSessionId,
      })
      .from(deliveries)
      .where(eq(deliveries.parcelId, parcelId))
      .limit(1);
    return row ?? null;
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
        ? error.code
        : undefined;
    const message =
      error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : '';
    const isMissingSignatureColumn = code === '42703' && message.includes('signature_image');
    if (!isMissingSignatureColumn) throw error;

    const [row] = await executor
      .select({
        id: deliveries.id,
        parcelId: deliveries.parcelId,
        mode: deliveries.mode,
        status: deliveries.status,
        officeLocationId: deliveries.officeLocationId,
        dropoffAddress: deliveries.dropoffAddress,
        frontDeskUserId: deliveries.frontDeskUserId,
        deliveryUserId: deliveries.deliveryUserId,
        riderUserId: deliveries.riderUserId,
        receiverCalledConfirmedBy: deliveries.receiverCalledConfirmedBy,
        receiverCalledConfirmedAt: deliveries.receiverCalledConfirmedAt,
        chargePsw: deliveries.chargePsw,
        amountPaidPsw: deliveries.amountPaidPsw,
        isDeleted: deliveries.isDeleted,
        deliveredAt: deliveries.deliveredAt,
        confirmedBy: deliveries.confirmedBy,
        confirmedAt: deliveries.confirmedAt,
        createdBy: deliveries.createdBy,
        createdAt: deliveries.createdAt,
        updatedAt: deliveries.updatedAt,
        cashierSessionId: deliveries.cashierSessionId,
      })
      .from(deliveries)
      .where(eq(deliveries.parcelId, parcelId))
      .limit(1);

    if (!row) return null;
    return { ...row, signatureImage: null };
  }
}

export async function updateDeliveryRepo(
  id: string,
  patch: Partial<typeof deliveries.$inferInsert>,
): Promise<{ id: string } | null> {
  const [row] = await db
    .update(deliveries)
    .set(patch)
    .where(eq(deliveries.id, id))
    .returning({ id: deliveries.id });
  return row ?? null;
}

export type RiderDeliveryRow = {
  deliveryId: string;
  parcelId: string;
  riderUserId: string | null;
  deliveryStatus: string;
  signatureImage: string | null;
  dropoffAddress: string | null;
  deliveryFeePsw: number;
  amountPaidPsw: number;
  trackingCode: string;
  bookingCode: string;
  parcelStatus: number;
  parcelDetails: string;
  parcelContent: string;
  plannedToBePaidPsw: number;
  chargePsw: number;
  destinationId: string;
  destinationName: string | null;
  receiverId: string;
  receiverName: string | null;
  receiverPhone: string | null;
  secondReceiverId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function listDoorstepByRiderRepo(input: {
  riderUserId: string;
  parcelStatuses?: number[] | null;
}): Promise<RiderDeliveryRow[]> {
  const r = alias(customers, 'r');
  const d = alias(branches, 'd');
  const where = [eq(deliveries.riderUserId, input.riderUserId), eq(deliveries.isDeleted, false)];
  if (input.parcelStatuses && input.parcelStatuses.length > 0) {
    where.push(inArray(parcels.status, input.parcelStatuses));
  }

  return db
    .select({
      deliveryId: deliveries.id,
      parcelId: deliveries.parcelId,
      riderUserId: deliveries.riderUserId,
      deliveryStatus: deliveries.status,
      signatureImage: deliveries.signatureImage,
      dropoffAddress: deliveries.dropoffAddress,
      deliveryFeePsw: deliveries.chargePsw,
      amountPaidPsw: deliveries.amountPaidPsw,
      trackingCode: parcels.trackingCode,
      bookingCode: parcels.bookingCode,
      parcelStatus: parcels.status,
      parcelDetails: parcels.parcelDetails,
      parcelContent: parcels.parcelContent,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      chargePsw: parcels.chargePsw,
      destinationId: parcels.destinationId,
      destinationName: d.name,
      receiverId: parcels.receiverId,
      receiverName: r.fullname,
      receiverPhone: r.telephone,
      secondReceiverId: parcels.secondReceiverId,
      createdAt: deliveries.createdAt,
      updatedAt: deliveries.updatedAt,
    })
    .from(deliveries)
    .innerJoin(parcels, eq(parcels.id, deliveries.parcelId))
    .leftJoin(r, eq(r.id, parcels.receiverId))
    .leftJoin(d, eq(d.id, parcels.destinationId))
    .where(and(...where))
    .orderBy(desc(deliveries.updatedAt), asc(deliveries.id));
}
