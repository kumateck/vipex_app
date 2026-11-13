import { and, eq, getTableColumns, inArray, or, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { customers, locations, parcels, receivingOffices } from '@/db/schemas';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import type { CorrectionParcel } from '@/shared/shipments/parcel-customer-correction';
import type { ParcelReceivingOffice } from '@/shared/shipments/receiving-office';
import {
  receivingOfficeJoin,
  receivingOfficeProjection,
} from '../parcel-receiving-office/projection';
import { correctionRestriction } from './rules';

export type CorrectionTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = typeof db | CorrectionTransaction;
export const customerColumns = {
  id: customers.id,
  fullname: customers.fullname,
  telephone: customers.telephone,
  telephone2: customers.telephone2,
  version: sql<string>`md5(row_to_json(customers)::text)`,
};
export const parcelColumns = {
  ...getTableColumns(parcels),
  version: sql<string>`md5(row_to_json(parcels)::text)`,
};

export async function findCorrectionParcels(companyId: string, bookingCode: string) {
  if (!companyId) throw BadRequest('Company context is required');
  const code = bookingCode.trim();
  if (!code || code.length > 255) throw BadRequest('Enter the booking code');
  const rows = await db
    .select({
      ...parcelColumns,
      pickupLocationName: locations.name,
      office: receivingOfficeProjection,
    })
    .from(parcels)
    .leftJoin(locations, eq(locations.id, parcels.pickupLocationId))
    .leftJoin(receivingOffices, receivingOfficeJoin)
    .where(
      and(
        eq(parcels.companyId, companyId),
        eq(parcels.bookingCode, code),
        eq(parcels.isDeleted, false),
      ),
    )
    .orderBy(parcels.trackingCode)
    .limit(51);
  if (!rows.length) throw NotFound('No active parcel matches this booking code in your company');
  if (rows.length > 50) throw Conflict('More than 50 parcels use this code; contact support');
  return Promise.all(
    rows.map(({ office, ...row }) =>
      buildCorrectionView(row, db, { pickupLocationName: row.pickupLocationName, ...office }),
    ),
  );
}

export async function buildCorrectionView(
  parcel: typeof parcels.$inferSelect & { version: string },
  executor: Executor = db,
  pickup?: ParcelReceivingOffice,
): Promise<CorrectionParcel> {
  const ids = [parcel.senderId, parcel.receiverId, parcel.secondReceiverId].filter(
    (id): id is string => !!id,
  );
  const rows = await executor
    .select(customerColumns)
    .from(customers)
    .where(
      and(
        inArray(customers.id, ids),
        eq(customers.companyId, parcel.companyId),
        eq(customers.isDeleted, false),
      ),
    );
  const byId = new Map(rows.map((row) => [row.id, row]));
  const party = (id: string | null, recordedName: string | null) => {
    const customer = id ? byId.get(id) : undefined;
    return customer ? { ...customer, recordedName: recordedName || customer.fullname } : undefined;
  };
  return {
    id: parcel.id,
    bookingCode: parcel.bookingCode,
    trackingCode: parcel.trackingCode,
    ...pickup,
    status: parcel.status,
    version: parcel.version,
    restriction: correctionRestriction(parcel),
    parties: {
      sender: party(parcel.senderId, parcel.senderNameSnapshot),
      receiver: party(parcel.receiverId, parcel.receiverNameSnapshot),
      secondReceiver: party(parcel.secondReceiverId, parcel.secondReceiverNameSnapshot),
    },
  };
}

export async function findCorrectionCustomers(companyId: string, telephone: string) {
  if (!companyId) throw BadRequest('Company context is required');
  if (!/^\d{10}$/.test(telephone)) throw BadRequest('Enter a ten-digit telephone');
  return db
    .select(customerColumns)
    .from(customers)
    .where(
      and(
        eq(customers.companyId, companyId),
        eq(customers.isDeleted, false),
        or(eq(customers.telephone, telephone), eq(customers.telephone2, telephone)),
      ),
    )
    .limit(20);
}
