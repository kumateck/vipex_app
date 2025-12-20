import { eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { deliveries } from '@/db/schemas';

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
  receiverCalledConfirmedBy: string | null;
  receiverCalledConfirmedAt: Date | null;
  chargePsw: bigint;
  amountPaidPsw: bigint;
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
): Promise<{ id: string }> {
  const [row] = await db.insert(deliveries).values(values).returning({ id: deliveries.id });
  if (!row) {
    throw new Error('Failed to create delivery');
  }
  return row;
}

export async function getDeliveryByParcelRepo(parcelId: string): Promise<DeliveryRow | null> {
  const [row] = await db
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
  return row ?? null;
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
