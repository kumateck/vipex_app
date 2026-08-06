import { ParcelStatus } from '@/db/schemas/enums';
import { db } from '@/db/config';
import { Conflict, NotFound } from '@/server/utils/http-error';
import { getBranchSvc } from '../branches/service';
import { getLocationSvc } from '../locations/service';
import { getParcelSvc } from '../shipments/parcels.service';
import { sendPickupQueueNotificationSvc } from '../notification-hub/service';
import {
  createPickupQueueRepo,
  getNextPickupQueueNumberRepo,
  getPickupQueueByParcelAndDateRepo,
  getPickupQueueByParcelRepo,
  updatePickupQueueRepo,
  listActivePickupQueuesForBranchRepo,
} from './repository';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

function toQueueDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

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
  const dayUtc = Date.UTC(queueDate.getFullYear(), queueDate.getMonth(), queueDate.getDate());
  const daysSinceEpoch = Math.floor((dayUtc - DATE_CODE_EPOCH_UTC) / 86_400_000);
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
  sendSms?: boolean;
}) {
  const parcel = await getParcelSvc(input.parcelId);
  if (parcel.status !== ParcelStatus.AWAITING_PICKUP) {
    throw Conflict('Queue tickets can only be created for parcels awaiting pickup');
  }

  const branch = await getBranchSvc(parcel.destinationId);
  if (!branch.usePickupQueue) {
    throw Conflict('This branch is not using pickup queue');
  }

  const queueDate = toQueueDate(new Date());

  const existing = await getPickupQueueByParcelAndDateRepo({
    parcelId: input.parcelId,
    queueDate,
  });
  if (existing) return { ...mapPickupQueue(existing), smsSent: false };

  const paymentBucket = Number(parcel.plannedToBePaidPsw ?? 0) > 0 ? 'TP' : 'SP';
  const queueLocationId = parcel.pickupLocationId ?? null;
  const queueLocationName = queueLocationId
    ? (await getLocationSvc(queueLocationId)).name
    : branch.name;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const queueNumber = await getNextPickupQueueNumberRepo({
      branchId: parcel.destinationId,
      locationId: queueLocationId,
      queueDate,
    });

    const queueCode = formatQueueCode({
      paymentBucket,
      locationName: queueLocationName,
      queueDate,
      queueNumber,
    });

    const created = await createPickupQueueRepo({
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
    });

    if (created) {
      let smsSent = false;
      if (input.sendSms !== false) {
        const result = await sendPickupQueueNotificationSvc({
          companyId: parcel.companyId,
          parcelId: parcel.id,
          queueCode,
          queueNumber,
          branchName: branch.name,
        });
        smsSent = result.sent;
      }
      return { ...mapPickupQueue(created), smsSent };
    }

    const existingByParcel = await getPickupQueueByParcelAndDateRepo({
      parcelId: input.parcelId,
      queueDate,
    });
    if (existingByParcel) {
      return { ...mapPickupQueue(existingByParcel), smsSent: false };
    }
  }

  throw Conflict('Unable to create pickup queue ticket right now. Please retry.');
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
