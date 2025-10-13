import { Conflict, NotFound } from '../../utils/http-error';
import {
  createBranchRepo,
  findBranchByNameRepo,
  getBranchRepo,
  listBranchesRepo,
  softDeleteBranchRepo,
  updateBranchRepo,
  type ListBranchParams,
} from './repository';

export async function listBranchesSvc(p: ListBranchParams) {
  return listBranchesRepo(p);
}
export async function getBranchSvc(id: string) {
  const b = await getBranchRepo(id);
  if (!b) throw NotFound('Branch not found');
  return b;
}
export async function createBranchSvc(input: {
  companyId: string;
  name: string;
  type: string;
  telephone?: string | null;
  address?: string | null;
  email?: string | null;
  createdBy: string;
}) {
  const dup = await findBranchByNameRepo(input.companyId, input.name);
  if (dup) throw Conflict('Branch name already exists for this company');
  const created = await createBranchRepo({ ...input, isDeleted: false });
  return { id: created?.id };
}
export async function updateBranchSvc(
  id: string,
  patch: {
    name?: string;
    type?: string;
    telephone?: string | null;
    address?: string | null;
    email?: string | null;
  },
) {
  if (patch.name) {
    const existing = await getBranchRepo(id);
    if (!existing) throw NotFound('Branch not found');
    if (patch.name !== existing.name) {
      const dup = await findBranchByNameRepo(existing.companyId, patch.name);
      if (dup && dup.id !== id) throw Conflict('Branch name already exists for this company');
    }
  }
  const updated = await updateBranchRepo(id, patch);
  if (!updated) throw NotFound('Branch not found');
  return { id: updated.id };
}
export async function deleteBranchSvc(id: string) {
  const count = await softDeleteBranchRepo(id);
  if (!count) throw NotFound('Branch not found or already deleted');
  return { success: true };
}
