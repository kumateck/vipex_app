import { ParcelStatus } from '@/db/schemas/enums';
import { db } from '@/db/config';
import type { pickupQueues } from '@/db/schemas';
import { Conflict, NotFound } from '@/server/utils/http-error';
import { getBranchSvc } from '../branches/service';
import { getLocationSvc } from '../locations/service';
import { getParcelSvc } from '../shipments/parcels.service';
import { sendPickupQueueNotificationSvc } from '../notification-hub/service';
import { getPickupQueueDate } from './queue-date';
import {
  createPickupQueueRepo,
  getNextPickupQueueNumberRepo,
  getPickupQueueByParcelAndDateRepo,
  endOpenPickupQueuesRepo,
  lockPickupQueueNumberRepo,
  lockPickupQueueParcelRepo,
  listActivePickupQueuesForBranchRepo,
} from './repository';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

const CROCKFORD_BASE32_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const DATE_CODE_EPOCH_UTC = Date.UTC(2025, 10, 14); // 2025-11-14

const LOCATION_CODE_OVERRIDES: Record<string, string> = {
  'anloga junction': 'AN',
  circle: 'CI',
  asafo: 'AS',
  'race course': 'RC',
  'vip bus terminal': 'VT',
};

function toTypeCode(paymentBucket: 'SP' | 'TP') {
  return paymentBucket === 'SP' ? 'S' : 'T';
}

function normalizeLocationName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function toLocationCode(name: string) {
  const normalized = normalizeLocationName(name);
  const override = LOCATION_CODE_OVERRIDES[normalized];
  if (override) return override;

  const cleaned = normalized
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 'XX';

  const firstToken = cleaned.split(' ')[0] ?? '';
  const fromFirstToken = firstToken.toUpperCase().slice(0, 2);
  if (fromFirstToken.length === 2) return fromFirstToken;
  return `${fromFirstToken}X`.slice(0, 2);
}

function encodeCrockfordBase32(value: number) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('Crockford Base32 value must be a non-negative integer');
  }

  const high = Math.floor(value / 32);
  const low = value % 32;
  return `${CROCKFORD_BASE32_ALPHABET[high]}${CROCKFORD_BASE32_ALPHABET[low]}`;
}

function toDateCode(queueDate: Date) {
  const daysSinceEpoch = Math.floor((queueDate.getTime() - DATE_CODE_EPOCH_UTC) / 86_400_000);
  if (daysSinceEpoch < 0 || daysSinceEpoch > 1023) {
    throw Conflict('Queue date is outside supported date-code range');
  }
  return encodeCrockfordBase32(daysSinceEpoch);
}

function formatQueueCode(input: {
  paymentBucket: 'SP' | 'TP';
  locationName: string;
  queueDate: Date;
  queueNumber: number;
}) {
  return `${toTypeCode(input.paymentBucket)}${toLocationCode(input.locationName)}-${toDateCode(input.queueDate)}${String(input.queueNumber).padStart(3, '0')}`;
}

function mapPickupQueue(queue: typeof pickupQueues.$inferSelect) {
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
  sendSms?: boolean;
}) {
  const parcel = await getParcelSvc(input.parcelId);
  if (parcel.status !== ParcelStatus.AWAITING_PICKUP) {
    throw Conflict('Queue tickets can only be created for parcels awaiting pickup');
  }
  if (parcel.hasPendingReceiverHandover) {
    throw Conflict('Payment is already processed. Open the parcel in Awaiting Signature.');
  }

  const branch = await getBranchSvc(parcel.destinationId);
  if (!branch.usePickupQueue) {
    throw Conflict('This branch is not using pickup queue');
  }

  const paymentBucket = Number(parcel.plannedToBePaidPsw ?? 0) > 0 ? 'TP' : 'SP';
  const queueLocationId = parcel.pickupLocationId ?? null;
  const queueLocation = queueLocationId ? await getLocationSvc(queueLocationId) : null;
  if (
    queueLocation &&
    (queueLocation.companyId !== parcel.companyId ||
      queueLocation.branchId !== parcel.destinationId ||
      queueLocation.isDeleted)
  )
    throw Conflict(
      'The assigned queue location is no longer active in this company and destination branch',
    );
  const queueLocationName = queueLocation?.name ?? branch.name;

  const { ticket, created } = await db.transaction(async (tx) => {
    const current = await lockPickupQueueParcelRepo(parcel.id, tx);
    if (
      !current ||
      current.status !== ParcelStatus.AWAITING_PICKUP ||
      current.hasPendingReceiverHandover
    ) {
      throw Conflict('The parcel is no longer eligible for a pickup queue ticket');
    }
    if (
      current.destinationId !== parcel.destinationId ||
      current.pickupLocationId !== queueLocationId
    ) {
      throw Conflict('The pickup location changed. Refresh the parcel and try again.');
    }
    const queueDate = getPickupQueueDate();
    const lookup = { parcelId: parcel.id, queueDate };
    const existing = await getPickupQueueByParcelAndDateRepo(lookup, tx);
    if (existing) return { ticket: existing, created: false };

    await lockPickupQueueNumberRepo(parcel.destinationId, queueLocationId, queueDate, tx);
    const queueNumber = await getNextPickupQueueNumberRepo(
      {
        branchId: parcel.destinationId,
        locationId: queueLocationId,
        queueDate,
      },
      tx,
    );

    const queueCode = formatQueueCode({
      paymentBucket,
      locationName: queueLocationName,
      queueDate,
      queueNumber,
    });

    const ticket = await createPickupQueueRepo(
      {
        companyId: parcel.companyId,
        branchId: parcel.destinationId,
        locationId: queueLocationId,
        parcelId: parcel.id,
        paymentBucket,
        queueDate,
        queueNumber,
        queueCode,
        pickerStaffId: input.pickerStaffId ?? null,
        idCardTypeId: input.idCardTypeId ?? null,
        idCardNumber: input.idCardNumber?.trim() || null,
        queuedBy: input.queuedBy,
      },
      tx,
    );
    if (!ticket) throw Conflict('Unable to create pickup queue ticket right now. Please retry.');
    return { ticket, created: true };
  });

  const smsSent =
    created && input.sendSms !== false
      ? (
          await sendPickupQueueNotificationSvc({
            companyId: parcel.companyId,
            parcelId: parcel.id,
            queueCode: ticket.queueCode,
            queueNumber: ticket.queueNumber,
            branchName: branch.name,
            locationName: queueLocationName,
            locationPhone: queueLocation?.telephone ?? null,
          })
        ).sent
      : false;
  return { ...mapPickupQueue(ticket), smsSent };
}

export async function endPickupQueueForParcelSvc(
  input: { parcelId: string; endedBy?: string | null },
  executor?: DbExecutor,
) {
  await endOpenPickupQueuesRepo(input, executor);
}

export async function listActivePickupQueuesForBranchSvc(branchId: string) {
  const rows = await listActivePickupQueuesForBranchRepo({
    branchId,
    queueDate: getPickupQueueDate(),
  });
  return rows.map(mapPickupQueue);
}

export async function listActivePickupQueueCardsForBranchSvc(input: {
  branchId: string;
  paymentBucket?: 'SP' | 'TP' | null;
  todayOnly?: boolean;
}) {
  const rows = await listActivePickupQueuesForBranchRepo({
    branchId: input.branchId,
    paymentBucket: input.paymentBucket ?? null,
    queueDate: input.todayOnly !== false ? getPickupQueueDate() : undefined,
  });

  return rows.map((row) => ({
    ...mapPickupQueue(row),
    hasHandoverNote: row.hasHandoverNote,
    handoverNoteCritical: row.handoverNoteCritical,
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
  const queue = await getPickupQueueByParcelAndDateRepo({
    parcelId,
    queueDate: getPickupQueueDate(),
  });
  if (!queue) throw NotFound('Pickup queue not found');
  return mapPickupQueue(queue);
}
