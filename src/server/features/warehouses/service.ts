import { Conflict, NotFound } from '@/server/utils/http-error';
import { recordAuditLog } from '../audit/logger';
import {
  createWarehouseRepo,
  findWarehouseByNameRepo,
  getWarehouseRepo,
  getWarehouseUsageSummaryRepo,
  listWarehouseOptionsRepo,
  listWarehousesRepo,
  softDeleteWarehouseRepo,
  updateWarehouseRepo,
  type ListWarehouseParams,
} from './repository';

export async function listWarehousesSvc(p: ListWarehouseParams) {
  return listWarehousesRepo(p);
}

export async function listWarehouseOptionsSvc(p: {
  companyId?: string | null;
  branchId?: string | null;
  search?: string | null;
  includeDeleted?: boolean | null;
  activeOnly?: boolean | null;
}) {
  return listWarehouseOptionsRepo(p);
}

export async function getWarehouseSvc(id: string) {
  const warehouse = await getWarehouseRepo(id);
  if (!warehouse) throw NotFound('Warehouse not found');
  return warehouse;
}

export async function createWarehouseSvc(input: {
  companyId: string;
  branchId: string;
  name: string;
  description?: string | null;
  active?: boolean;
  createdBy: string;
}) {
  const dup = await findWarehouseByNameRepo(input.branchId, input.name.trim());
  if (dup && !dup.isDeleted) throw Conflict('Warehouse name already exists for this branch');
  if (dup && dup.isDeleted) {
    const row = await updateWarehouseRepo(dup.id, {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      active: input.active ?? true,
      isDeleted: false,
    });
    await recordAuditLog({
      companyId: input.companyId,
      actorUserId: input.createdBy,
      entityType: 'warehouse',
      entityId: dup.id,
      action: 'WAREHOUSE_RESTORED',
      message: 'Warehouse restored',
      metadata: { patch: input },
    });
    return { id: row?.id ?? dup.id };
  }

  const created = await createWarehouseRepo({
    companyId: input.companyId,
    branchId: input.branchId,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    active: input.active ?? true,
    createdBy: input.createdBy,
    isDeleted: false,
  });

  if (!created) throw NotFound('Failed to create warehouse');
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy,
    entityType: 'warehouse',
    entityId: created.id,
    action: 'WAREHOUSE_CREATED',
    message: 'Warehouse created',
    metadata: { after: await getWarehouseRepo(created.id) },
  });
  return { id: created.id };
}

export async function updateWarehouseSvc(
  id: string,
  patch: { name?: string; description?: string | null; active?: boolean },
  actorUserId?: string | null,
) {
  const current = await getWarehouseRepo(id);
  if (!current) throw NotFound('Warehouse not found');

  if (patch.name && patch.name !== current.name) {
    const dup = await findWarehouseByNameRepo(current.branchId, patch.name.trim());
    if (dup && dup.id !== id && !dup.isDeleted) {
      throw Conflict('Warehouse name already exists for this branch');
    }
  }

  const updated = await updateWarehouseRepo(id, {
    name: patch.name?.trim() || current.name,
    description:
      patch.description !== undefined ? patch.description?.trim() || null : current.description,
    active: patch.active ?? current.active,
  });
  if (!updated) throw NotFound('Warehouse not found');

  await recordAuditLog({
    companyId: current.companyId,
    actorUserId: actorUserId ?? null,
    entityType: 'warehouse',
    entityId: id,
    action: 'WAREHOUSE_UPDATED',
    message: 'Warehouse updated',
    metadata: { before: current, patch, after: await getWarehouseRepo(id) },
  });
  return { id: updated.id };
}

export async function deleteWarehouseSvc(id: string, actorUserId?: string | null) {
  const current = await getWarehouseRepo(id);
  if (!current) throw NotFound('Warehouse not found');

  const usage = await getWarehouseUsageSummaryRepo(id);
  if (usage.holderCount > 0) {
    throw Conflict('Warehouse cannot be deleted while parcels are currently held there');
  }

  const count = await softDeleteWarehouseRepo(id);
  if (!count) throw NotFound('Warehouse not found or already deleted');

  await recordAuditLog({
    companyId: current.companyId,
    actorUserId: actorUserId ?? null,
    entityType: 'warehouse',
    entityId: id,
    action: 'WAREHOUSE_DELETED',
    message: 'Warehouse deleted',
    metadata: { before: current },
  });
  return { success: true };
}
