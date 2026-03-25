import { Conflict, NotFound } from '../../utils/http-error';
import {
  createStatusRepo,
  findStatusByNameRepo,
  getStatusRepo,
  listStatusOptionsRepo,
  listStatusesRepo,
  softDeleteStatusRepo,
  updateStatusRepo,
  type ListStatusParams,
} from './repository';

export async function listStatusesSvc(p: ListStatusParams) {
  return listStatusesRepo(p);
}
export async function listStatusOptionsSvc(p: {
  companyId?: string | null;
  search?: string | null;
  includeDeleted?: boolean | null;
}) {
  return listStatusOptionsRepo(p);
}
export async function getStatusSvc(id: string) {
  const s = await getStatusRepo(id);
  if (!s) throw NotFound('Status not found');
  return s;
}
export async function createStatusSvc(input: {
  companyId: string;
  name: string;
  color: string;
  createdBy: string;
}) {
  const dup = await findStatusByNameRepo(input.companyId, input.name);
  if (dup && !dup.isDeleted) throw Conflict('Status name already exists for this company');
  if (dup && dup.isDeleted) {
    const result = await updateStatusRepo(dup.id, {
      name: input.name,
      color: input.color,
      isDeleted: false,
    });
    const row = Array.isArray(result) ? result[0] : null;
    return { id: row?.id ?? dup.id };
  }
  const created = await createStatusRepo({ ...input, isDeleted: false });
  return { id: created?.id };
}
export async function updateStatusSvc(id: string, patch: { name?: string; color?: string }) {
  const cur = await getStatusRepo(id);
  if (!cur) throw NotFound('Status not found');
  if (patch.name && patch.name !== cur.name) {
    const dup = await findStatusByNameRepo(cur.companyId, patch.name);
    if (dup && dup.id !== id && !dup.isDeleted)
      throw Conflict('Status name already exists for this company');
  }
  const updated = await updateStatusRepo(id, patch);
  if (!updated) throw NotFound('Status not found');
  return { id: updated.id };
}
export async function deleteStatusSvc(id: string) {
  const count = await softDeleteStatusRepo(id);
  if (!count) throw NotFound('Status not found or already deleted');
  return { success: true };
}
