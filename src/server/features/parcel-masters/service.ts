import { Conflict, NotFound } from '@/server/utils/http-error';
import {
  createParcelContentRepo,
  createParcelDetailRepo,
  findParcelContentByNameRepo,
  findParcelDetailByNameRepo,
  getParcelContentRepo,
  getParcelDetailRepo,
  listParcelContentOptionsRepo,
  listParcelDetailOptionsRepo,
  updateParcelContentRepo,
  updateParcelDetailRepo,
} from './repository';

export async function listParcelContentOptionsSvc(input: {
  companyId: string;
  activeOnly?: boolean | null;
}) {
  return listParcelContentOptionsRepo(input);
}

export async function listParcelDetailOptionsSvc(input: {
  companyId: string;
  activeOnly?: boolean | null;
}) {
  return listParcelDetailOptionsRepo(input);
}

export async function createParcelContentSvc(input: {
  companyId: string;
  name: string;
  description?: string | null;
  basePricePsw: number;
  taxInclusive: boolean;
  active?: boolean;
  sortOrder?: number;
  createdBy?: string | null;
}) {
  const name = input.name.trim();
  if (!name) throw Conflict('Parcel content name is required');

  const duplicate = await findParcelContentByNameRepo(input.companyId, name);
  if (duplicate) throw Conflict('Parcel content already exists');

  const created = await createParcelContentRepo({
    companyId: input.companyId,
    name,
    description: input.description?.trim() || null,
    basePricePsw: Math.max(0, Math.trunc(input.basePricePsw || 0)),
    taxInclusive: input.taxInclusive,
    active: input.active ?? true,
    sortOrder: input.sortOrder ?? 0,
    createdBy: input.createdBy ?? null,
  });

  return { id: created?.id };
}

export async function createParcelDetailSvc(input: {
  companyId: string;
  name: string;
  description?: string | null;
  active?: boolean;
  sortOrder?: number;
  createdBy?: string | null;
}) {
  const name = input.name.trim();
  if (!name) throw Conflict('Parcel detail name is required');

  const duplicate = await findParcelDetailByNameRepo(input.companyId, name);
  if (duplicate) throw Conflict('Parcel detail already exists');

  const created = await createParcelDetailRepo({
    companyId: input.companyId,
    name,
    description: input.description?.trim() || null,
    active: input.active ?? true,
    sortOrder: input.sortOrder ?? 0,
    createdBy: input.createdBy ?? null,
  });

  return { id: created?.id };
}

export async function updateParcelContentSvc(input: {
  companyId: string;
  id: string;
  name?: string;
  description?: string | null;
  basePricePsw?: number;
  taxInclusive?: boolean;
  active?: boolean;
  sortOrder?: number;
}) {
  const existing = await getParcelContentRepo(input.companyId, input.id);
  if (!existing) throw NotFound('Parcel content not found');

  const nextName = input.name?.trim() ?? existing.name;
  if (nextName !== existing.name) {
    const duplicate = await findParcelContentByNameRepo(input.companyId, nextName);
    if (duplicate && duplicate.id !== input.id) throw Conflict('Parcel content already exists');
  }

  const updated = await updateParcelContentRepo(input.id, {
    name: nextName,
    description:
      input.description !== undefined ? input.description?.trim() || null : existing.description,
    basePricePsw:
      input.basePricePsw !== undefined
        ? Math.max(0, Math.trunc(input.basePricePsw))
        : existing.basePricePsw,
    taxInclusive: input.taxInclusive ?? existing.taxInclusive,
    active: input.active ?? existing.active,
    sortOrder: input.sortOrder ?? existing.sortOrder,
  });
  return { id: updated?.id };
}

export async function updateParcelDetailSvc(input: {
  companyId: string;
  id: string;
  name?: string;
  description?: string | null;
  active?: boolean;
  sortOrder?: number;
}) {
  const existing = await getParcelDetailRepo(input.companyId, input.id);
  if (!existing) throw NotFound('Parcel detail not found');

  const nextName = input.name?.trim() ?? existing.name;
  if (nextName !== existing.name) {
    const duplicate = await findParcelDetailByNameRepo(input.companyId, nextName);
    if (duplicate && duplicate.id !== input.id) throw Conflict('Parcel detail already exists');
  }

  const updated = await updateParcelDetailRepo(input.id, {
    name: nextName,
    description:
      input.description !== undefined ? input.description?.trim() || null : existing.description,
    active: input.active ?? existing.active,
    sortOrder: input.sortOrder ?? existing.sortOrder,
  });
  return { id: updated?.id };
}
