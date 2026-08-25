import { eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { deliveries } from '@/db/schemas';

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
  riderAssignedAt: Date | null;
  riderCompletedAt: Date | null;
  returnedAt: Date | null;
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

const deliverySelection = {
  id: deliveries.id,
  parcelId: deliveries.parcelId,
  mode: deliveries.mode,
  status: deliveries.status,
  officeLocationId: deliveries.officeLocationId,
  dropoffAddress: deliveries.dropoffAddress,
  frontDeskUserId: deliveries.frontDeskUserId,
  deliveryUserId: deliveries.deliveryUserId,
  riderUserId: deliveries.riderUserId,
  riderAssignedAt: deliveries.riderAssignedAt,
  riderCompletedAt: deliveries.riderCompletedAt,
  returnedAt: deliveries.returnedAt,
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
};

export async function createDeliveryRepo(
  values: typeof deliveries.$inferInsert,
  executor: DbExecutor = db,
): Promise<{ id: string }> {
  const [row] = await executor.insert(deliveries).values(values).returning({ id: deliveries.id });
  if (!row) throw new Error('Failed to create delivery');
  return row;
}

export async function getDeliveryByParcelRepo(
  parcelId: string,
  executor: DbExecutor = db,
): Promise<DeliveryRow | null> {
  try {
    const [row] = await executor
      .select(deliverySelection)
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

    const { signatureImage: _signatureImage, ...legacySelection } = deliverySelection;
    const [row] = await executor
      .select(legacySelection)
      .from(deliveries)
      .where(eq(deliveries.parcelId, parcelId))
      .limit(1);
    return row ? { ...row, signatureImage: null } : null;
  }
}

export async function updateDeliveryRepo(
  id: string,
  patch: Partial<typeof deliveries.$inferInsert>,
  executor: DbExecutor = db,
): Promise<{ id: string } | null> {
  const [row] = await executor
    .update(deliveries)
    .set(patch)
    .where(eq(deliveries.id, id))
    .returning({ id: deliveries.id });
  return row ?? null;
}

export { listDoorstepByBranchRepo, listDoorstepByRiderRepo } from './rider.repository';
export type { RiderDeliveryRow } from './rider.repository';
