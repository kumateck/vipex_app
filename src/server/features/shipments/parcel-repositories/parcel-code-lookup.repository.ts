import { and, asc, count, eq, lte, notInArray, or } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcels } from '@/db/schemas';
import { extractScannedCode } from '@/server/utils/scan-code';
import { type DbExecutor } from './parcel-repository.types';
import { STUCK_PARCEL_EXCLUDED_STATUSES } from './parcel-records.repository';

export type ListStuckParcelsParams = {
  companyId: string;
  branchId?: string | null;
  stuckAfterDays: number;
  limit: number;
  offset: number;
};

export async function listStuckParcelsRepo(p: ListStuckParcelsParams): Promise<{
  data: {
    id: string;
    trackingCode: string;
    bookingCode: string;
    status: number;
    updatedAt: Date;
    destinationId: string | null;
  }[];
  totalRecords: number;
}> {
  const cutoff = new Date(Date.now() - p.stuckAfterDays * 24 * 60 * 60 * 1000);
  const whereParts = [
    eq(parcels.isDeleted, false),
    eq(parcels.companyId, p.companyId),
    notInArray(parcels.status, STUCK_PARCEL_EXCLUDED_STATUSES),
    lte(parcels.updatedAt, cutoff),
  ];
  if (p.branchId) whereParts.push(eq(parcels.destinationId, p.branchId));

  const where = and(...whereParts);

  const [countRow] = await db.select({ c: count() }).from(parcels).where(where);

  const rows = await db
    .select({
      id: parcels.id,
      trackingCode: parcels.trackingCode,
      bookingCode: parcels.bookingCode,
      status: parcels.status,
      updatedAt: parcels.updatedAt,
      destinationId: parcels.destinationId,
    })
    .from(parcels)
    .where(where)
    .orderBy(asc(parcels.updatedAt))
    .limit(p.limit)
    .offset(p.offset);

  return { data: rows, totalRecords: Number(countRow?.c ?? 0) };
}

export async function getParcelByCodeRepo(
  companyId: string,
  code: string,
  executor: DbExecutor = db,
): Promise<{ id: string; trackingCode: string; bookingCode: string; sourceId: string } | null> {
  const trimmed = extractScannedCode(code);
  if (!trimmed) return null;
  const [row] = await executor
    .select({
      id: parcels.id,
      trackingCode: parcels.trackingCode,
      bookingCode: parcels.bookingCode,
      sourceId: parcels.sourceId,
    })
    .from(parcels)
    .where(
      and(
        eq(parcels.companyId, companyId),
        or(eq(parcels.trackingCode, trimmed), eq(parcels.bookingCode, trimmed)),
      ),
    )
    .limit(1);
  return row ?? null;
}
