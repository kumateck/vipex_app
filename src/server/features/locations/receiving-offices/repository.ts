import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { locations, receivingOffices } from '@/db/schemas';
import type { DbExecutor } from '../../shipments/parcel-repositories/parcel-repository.types';

const fields = {
  id: receivingOffices.id,
  name: receivingOffices.name,
  locationId: locations.id,
  locationName: locations.name,
};

export function listReceivingOfficesRepo(
  scope: {
    companyId: string;
    branchId?: string;
    locationId?: string;
  },
  executor: DbExecutor = db,
) {
  return executor
    .select(fields)
    .from(receivingOffices)
    .innerJoin(locations, eq(locations.id, receivingOffices.locationId))
    .where(
      and(
        eq(locations.companyId, scope.companyId),
        scope.branchId ? eq(locations.branchId, scope.branchId) : undefined,
        scope.locationId ? eq(locations.id, scope.locationId) : undefined,
        eq(locations.isDeleted, false),
        eq(locations.canReceive, true),
      ),
    )
    .orderBy(asc(locations.name), asc(receivingOffices.name));
}

export function lockReceivingOfficesRepo(locationIds: string[], tx: DbExecutor) {
  return tx
    .select({
      id: receivingOffices.id,
      locationId: receivingOffices.locationId,
    })
    .from(receivingOffices)
    .where(inArray(receivingOffices.locationId, locationIds))
    .orderBy(asc(receivingOffices.id))
    .for('share');
}

export function findOfficeNameRepo(locationId: string, name: string, tx: DbExecutor) {
  return tx
    .select({ id: receivingOffices.id })
    .from(receivingOffices)
    .where(
      and(
        eq(receivingOffices.locationId, locationId),
        eq(sql`lower(${receivingOffices.name})`, sql`lower(${name})`),
      ),
    )
    .limit(1);
}
