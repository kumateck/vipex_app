import { and, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { locations, receivingOffices } from '@/db/schemas';
import { BadRequest, Conflict, Forbidden, NotFound } from '@/server/utils/http-error';
import type { DbExecutor } from '../../shipments/parcel-repositories/parcel-repository.types';
import { deleteUnusedOfficeRepo, findOfficeNameRepo, listReceivingOfficesRepo } from './repository';

async function assertLocation(
  companyId: string,
  locationId: string,
  tx: DbExecutor,
  lock?: 'update',
) {
  const query = tx
    .select({ id: locations.id })
    .from(locations)
    .where(
      and(
        eq(locations.companyId, companyId),
        eq(locations.id, locationId),
        eq(locations.isDeleted, false),
        eq(locations.canReceive, true),
      ),
    );
  const [location] = await (lock ? query.for(lock) : query);
  if (!location) throw NotFound('Receiving location not found');
}

export async function getLocationOffices(companyId: string, locationId: string) {
  await assertLocation(companyId, locationId, db);
  return listReceivingOfficesRepo({ companyId, locationId });
}

export function getReceivingOfficeOptions(companyId?: string | null, branchId?: string | null) {
  if (!companyId || !branchId) throw Forbidden('Receiving branch context is required');
  return listReceivingOfficesRepo({ companyId, branchId });
}

export async function saveReceivingOffice(input: {
  companyId: string;
  locationId: string;
  officeId?: string;
  name: string;
}) {
  const name = input.name.trim();
  if (!name || name.length > 255) throw BadRequest('Enter an office name of 1 to 255 characters');

  return db.transaction(async (tx) => {
    await assertLocation(input.companyId, input.locationId, tx, 'update');
    const [duplicate] = await findOfficeNameRepo(input.locationId, name, tx);
    if (duplicate && duplicate.id !== input.officeId)
      throw Conflict('An office with this name already exists at this location');

    const selection = { id: receivingOffices.id, name: receivingOffices.name };
    const [office] = input.officeId
      ? await tx
          .update(receivingOffices)
          .set({ name })
          .where(
            and(
              eq(receivingOffices.locationId, input.locationId),
              eq(receivingOffices.id, input.officeId),
            ),
          )
          .returning(selection)
      : await tx
          .insert(receivingOffices)
          .values({ locationId: input.locationId, name })
          .returning(selection);
    if (!office) throw NotFound('Receiving office not found');
    return office;
  });
}

export function deleteReceivingOffice(input: {
  companyId: string;
  locationId: string;
  officeId: string;
}) {
  return db.transaction(async (tx) => {
    // Receiving and office reassignment share-lock this location before assigning an office.
    await assertLocation(input.companyId, input.locationId, tx, 'update');
    const result = await deleteUnusedOfficeRepo(input.locationId, input.officeId, tx);
    if (result === 'missing') throw NotFound('Receiving office not found');
    if (result === 'referenced')
      throw Conflict('This receiving office is linked to a parcel and cannot be deleted');
    return { success: true };
  });
}
