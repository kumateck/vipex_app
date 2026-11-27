import { and, asc, eq, inArray, isNull, ne, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { branches, consignmentItems, locations, parcels } from '@/db/schemas';
import type { DestinationOptionBranch } from '@/shared/shipments/parcel-destination-change';

export type Executor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

const activeConsignmentId = sql<string | null>`(${db
  .select({ consignmentId: consignmentItems.consignmentId })
  .from(consignmentItems)
  .where(and(eq(consignmentItems.parcelId, parcels.id), isNull(consignmentItems.removedAt)))
  .limit(1)})`;

/** Loads the company-scoped parcel state used by destination change rules. */
export async function findParcelDestinationStateRepo(
  input: { parcelId: string; companyId: string; lock?: boolean },
  tx: Executor = db,
) {
  const query = tx
    .select({
      id: parcels.id,
      bookingCode: parcels.bookingCode,
      status: parcels.status,
      isDeleted: parcels.isDeleted,
      sourceId: parcels.sourceId,
      destinationId: parcels.destinationId,
      pickupLocationId: parcels.pickupLocationId,
      receivingOfficeId: parcels.receivingOfficeId,
      receivedAt: parcels.receivedAt,
      confirmed: sql<boolean>`${parcels.confirmedAt} is not null`,
      hasPendingReceiverHandover: sql<boolean>`${parcels.pendingReceiverHandover} is not null`,
      activeConsignmentId,
    })
    .from(parcels)
    .where(and(eq(parcels.id, input.parcelId), eq(parcels.companyId, input.companyId)));
  const [row] = input.lock ? await query.for('update', { of: parcels }) : await query;
  return row ?? null;
}

export type ParcelDestinationState = NonNullable<
  Awaited<ReturnType<typeof findParcelDestinationStateRepo>>
>;

export async function removeFromActiveConsignmentRepo(parcelId: string, tx: Executor) {
  await tx
    .update(consignmentItems)
    .set({ removedAt: new Date() })
    .where(and(eq(consignmentItems.parcelId, parcelId), isNull(consignmentItems.removedAt)));
}

/** Company branches (except the source) with their receiving-enabled pickup locations. */
export async function listDestinationBranchesRepo(input: {
  companyId: string;
  excludeBranchId: string;
}): Promise<DestinationOptionBranch[]> {
  const [branchRows, locationRows] = await Promise.all([
    db
      .select({ id: branches.id, name: branches.name })
      .from(branches)
      .where(
        and(
          eq(branches.companyId, input.companyId),
          eq(branches.isDeleted, false),
          ne(branches.id, input.excludeBranchId),
        ),
      )
      .orderBy(asc(branches.name)),
    db
      .select({ id: locations.id, name: locations.name, branchId: locations.branchId })
      .from(locations)
      .where(
        and(
          eq(locations.companyId, input.companyId),
          eq(locations.isDeleted, false),
          eq(locations.canReceive, true),
        ),
      )
      .orderBy(asc(locations.name)),
  ]);
  const byBranch = new Map<string, { id: string; name: string }[]>();
  for (const { branchId, ...location } of locationRows) {
    const list = byBranch.get(branchId) ?? [];
    list.push(location);
    byBranch.set(branchId, list);
  }
  return branchRows.map((branch) => ({ ...branch, locations: byBranch.get(branch.id) ?? [] }));
}

export async function findCompanyBranchNamesRepo(
  companyId: string,
  ids: string[],
  tx: Executor = db,
) {
  const rows = await tx
    .select({ id: branches.id, name: branches.name, isDeleted: branches.isDeleted })
    .from(branches)
    .where(and(eq(branches.companyId, companyId), inArray(branches.id, ids)));
  return new Map(rows.map((row) => [row.id, row]));
}

export async function findLocationNameRepo(id: string | null, tx: Executor = db) {
  if (!id) return null;
  const [row] = await tx
    .select({ name: locations.name })
    .from(locations)
    .where(eq(locations.id, id));
  return row?.name ?? null;
}
