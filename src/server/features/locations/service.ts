import { Conflict, NotFound } from '../../utils/http-error';
import {
  createLocationRepo,
  findLocationByNameRepo,
  getLocationRepo,
  listLocationOptionsRepo,
  listLocationsRepo,
  softDeleteLocationRepo,
  updateLocationRepo,
  type ListLocationParams,
} from './repository';

export async function listLocationsSvc(p: ListLocationParams) {
  return listLocationsRepo(p);
}
export async function listLocationOptionsSvc(p: {
  companyId?: string | null;
  branchId?: string | null;
  search?: string | null;
  includeDeleted?: boolean | null;
}) {
  return listLocationOptionsRepo(p);
}
export async function getLocationSvc(id: string) {
  const l = await getLocationRepo(id);
  if (!l) throw NotFound('Location not found');
  return l;
}
export async function createLocationSvc(input: {
  companyId: string;
  branchId: string;
  name: string;
  createdBy: string;
}) {
  const dup = await findLocationByNameRepo(input.branchId, input.name);
  if (dup && !dup.isDeleted) throw Conflict('Location name already exists for this branch');
  if (dup && dup.isDeleted) {
    const row = await updateLocationRepo(dup.id, { name: input.name, isDeleted: false });
    return { id: row?.id ?? dup.id };
  }
  const created = await createLocationRepo({ ...input, isDeleted: false });
  return { id: created?.id };
}
export async function updateLocationSvc(id: string, patch: { name?: string }) {
  const cur = await getLocationRepo(id);
  if (!cur) throw NotFound('Location not found');
  if (patch.name && patch.name !== cur.name) {
    const dup = await findLocationByNameRepo(cur.branchId, patch.name);
    if (dup && dup.id !== id && !dup.isDeleted)
      throw Conflict('Location name already exists for this branch');
  }
  const updated = await updateLocationRepo(id, patch);
  if (!updated) throw NotFound('Location not found');
  return { id: updated.id };
}
export async function deleteLocationSvc(id: string) {
  const count = await softDeleteLocationRepo(id);
  if (!count) throw NotFound('Location not found or already deleted');
  return { success: true };
}
