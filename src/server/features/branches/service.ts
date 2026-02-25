import { Conflict, NotFound } from '../../utils/http-error';
import { recordAuditLog } from '../audit/logger';
import {
  createBranchRepo,
  findBranchByNameRepo,
  getBranchRepo,
  listBranchOptionsRepo,
  listBranchesRepo,
  softDeleteBranchRepo,
  updateBranchRepo,
  type ListBranchParams,
} from './repository';

export async function listBranchesSvc(p: ListBranchParams) {
  return listBranchesRepo(p);
}
export async function listBranchOptionsSvc(p: {
  companyId?: string | null;
  search?: string | null;
  includeDeleted?: boolean | null;
}) {
  return listBranchOptionsRepo(p);
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
  if (dup && !dup.isDeleted) {
    throw Conflict('Branch name already exists for this company');
  }
  if (dup?.isDeleted) {
    const restored = await updateBranchRepo(dup.id, {
      name: input.name,
      type: input.type,
      telephone: input.telephone ?? null,
      address: input.address ?? null,
      email: input.email ?? null,
      isDeleted: false,
      createdBy: input.createdBy,
    });
    await recordAuditLog({
      companyId: input.companyId,
      actorUserId: input.createdBy,
      entityType: 'branch',
      entityId: restored?.id ?? dup.id,
      action: 'BRANCH_RESTORED',
      message: 'Branch restored from soft-delete',
      metadata: {
        mode: 'restore',
        name: input.name,
        type: input.type,
        telephone: input.telephone ?? null,
        address: input.address ?? null,
        email: input.email ?? null,
      },
    });
    return { id: restored?.id ?? dup.id };
  }
  const created = await createBranchRepo({ ...input, isDeleted: false });
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy,
    entityType: 'branch',
    entityId: created?.id ?? null,
    action: 'BRANCH_CREATED',
    message: 'Branch created',
    metadata: {
      mode: 'create',
      name: input.name,
      type: input.type,
      telephone: input.telephone ?? null,
      address: input.address ?? null,
      email: input.email ?? null,
    },
  });
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
  actorUserId?: string | null,
) {
  const existing = await getBranchRepo(id);
  if (!existing) throw NotFound('Branch not found');

  if (patch.name) {
    if (patch.name !== existing.name) {
      const dup = await findBranchByNameRepo(existing.companyId, patch.name);
      if (dup && dup.id !== id) throw Conflict('Branch name already exists for this company');
    }
  }
  const updated = await updateBranchRepo(id, patch);
  if (!updated) throw NotFound('Branch not found');
  const after = await getBranchRepo(id);
  await recordAuditLog({
    companyId: existing.companyId,
    actorUserId: actorUserId ?? null,
    entityType: 'branch',
    entityId: id,
    action: 'BRANCH_UPDATED',
    message: 'Branch updated',
    metadata: {
      before: {
        id: existing.id,
        companyId: existing.companyId,
        name: existing.name,
        type: existing.type,
        telephone: existing.telephone ?? null,
        address: existing.address ?? null,
        email: existing.email ?? null,
        isDeleted: existing.isDeleted,
        createdBy: existing.createdBy,
      },
      patch,
      after: after
        ? {
            id: after.id,
            companyId: after.companyId,
            name: after.name,
            type: after.type,
            telephone: after.telephone ?? null,
            address: after.address ?? null,
            email: after.email ?? null,
            isDeleted: after.isDeleted,
            createdBy: after.createdBy,
          }
        : null,
    },
  });
  return { id: updated.id };
}
export async function deleteBranchSvc(id: string, actorUserId?: string | null) {
  const existing = await getBranchRepo(id);
  if (!existing) throw NotFound('Branch not found or already deleted');
  const count = await softDeleteBranchRepo(id);
  if (!count) throw NotFound('Branch not found or already deleted');
  await recordAuditLog({
    companyId: existing.companyId,
    actorUserId: actorUserId ?? null,
    entityType: 'branch',
    entityId: id,
    action: 'BRANCH_DELETED',
    message: 'Branch soft deleted',
    metadata: {
      deletedBranch: {
        id: existing.id,
        companyId: existing.companyId,
        name: existing.name,
        type: existing.type,
        telephone: existing.telephone ?? null,
        address: existing.address ?? null,
        email: existing.email ?? null,
      },
    },
  });
  return { success: true };
}
