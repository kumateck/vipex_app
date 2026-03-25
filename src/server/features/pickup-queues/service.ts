import { ParcelStatus } from '@/db/schemas/enums';
import { db } from '@/db/config';
import { Conflict, NotFound } from '@/server/utils/http-error';
import { getBranchSvc } from '../branches/service';
import { getParcelSvc } from '../shipments/parcels.service';
import {
  createPickupQueueRepo,
  getNextPickupQueueNumberRepo,
  getPickupQueueByParcelRepo,
  listActivePickupQueuesForBranchRepo,
  updatePickupQueueRepo,
} from './repository';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

function toQueueDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatQueueCode(input: {
  paymentBucket: 'SP' | 'TP';
  branchName: string;
  queueNumber: number;
}) {
  const branchInitial = input.branchName.trim().charAt(0).toUpperCase() || 'X';
  return `${input.paymentBucket}${branchInitial}${String(input.queueNumber).padStart(3, '0')}`;
}

function mapPickupQueue(queue: Awaited<ReturnType<typeof getPickupQueueByParcelRepo>>) {
  if (!queue) return null;
  return {
    ...queue,
    queueDate: queue.queueDate.toISOString(),
    queuedAt: queue.queuedAt.toISOString(),
    endedAt: queue.endedAt ? queue.endedAt.toISOString() : null,
    createdAt: queue.createdAt.toISOString(),
    updatedAt: queue.updatedAt.toISOString(),
  };
}

export async function createPickupQueueSvc(input: {
  parcelId: string;
  queuedBy: string;
  pickerStaffId?: string | null;
  idCardTypeId?: string | null;
  idCardNumber?: string | null;
}) {
  const parcel = await getParcelSvc(input.parcelId);
  if (parcel.status !== ParcelStatus.AWAITING_PICKUP) {
    throw Conflict('Queue tickets can only be created for parcels awaiting pickup');
  }

  const branch = await getBranchSvc(parcel.destinationId);
  if (!branch.usePickupQueue) {
    throw Conflict('This branch is not using pickup queue');
  }

  const existing = await getPickupQueueByParcelRepo(input.parcelId);
  if (existing) return mapPickupQueue(existing);

  const paymentBucket = Number(parcel.plannedToBePaidPsw ?? 0) > 0 ? 'TP' : 'SP';
  const queueDate = toQueueDate(new Date());
  const queueNumber = await getNextPickupQueueNumberRepo({
    branchId: parcel.destinationId,
    queueDate,
    paymentBucket,
  });

  const created = await createPickupQueueRepo({
    companyId: parcel.companyId,
    branchId: parcel.destinationId,
    parcelId: parcel.id,
    paymentBucket,
    queueDate,
    queueNumber,
    queueCode: formatQueueCode({
      paymentBucket,
      branchName: branch.name,
      queueNumber,
    }),
    pickerStaffId: input.pickerStaffId ?? null,
    idCardTypeId: input.idCardTypeId ?? null,
    idCardNumber: input.idCardNumber?.trim() || null,
    queuedBy: input.queuedBy,
  });

  return mapPickupQueue(created);
}

export async function endPickupQueueForParcelSvc(
  input: { parcelId: string; endedBy?: string | null },
  executor?: DbExecutor,
) {
  const queue = await getPickupQueueByParcelRepo(input.parcelId, executor);
  if (!queue || queue.endedAt) return null;

  const updated = await updatePickupQueueRepo(
    queue.id,
    {
      endedAt: new Date(),
      endedBy: input.endedBy ?? null,
    },
    executor,
  );

  return updated ? mapPickupQueue(updated) : null;
}

export async function listActivePickupQueuesForBranchSvc(branchId: string) {
  const rows = await listActivePickupQueuesForBranchRepo(branchId);
  return rows.map((row) => mapPickupQueue(row)).filter((row) => row !== null);
}

export async function listActivePickupQueueCardsForBranchSvc(input: {
  branchId: string;
  paymentBucket?: 'SP' | 'TP' | null;
}) {
  const rows = await listActivePickupQueuesForBranchRepo(
    input.branchId,
    input.paymentBucket ?? null,
  );

  return rows.map((row) => ({
    ...mapPickupQueue(row),
    trackingCode: row.trackingCode,
    bookingCode: row.bookingCode,
    parcelDetails: row.parcelDetails,
    plannedToBePaidPsw: row.plannedToBePaidPsw,
    chargePsw: row.chargePsw,
    receiverName: row.receiverName,
    receiverPhone: row.receiverPhone,
  }));
}

export async function getPickupQueueByParcelSvc(parcelId: string) {
  const queue = await getPickupQueueByParcelRepo(parcelId);
  if (!queue) throw NotFound('Pickup queue not found');
  return mapPickupQueue(queue);
}
