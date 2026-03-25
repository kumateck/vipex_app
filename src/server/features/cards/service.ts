import { Conflict, NotFound } from '../../utils/http-error';
import {
  createCardRepo,
  findCardByNameRepo,
  getCardRepo,
  listCardsRepo,
  softDeleteCardRepo,
  updateCardRepo,
  checkCardHasAssociationsRepo,
  type ListCardParams,
} from './repository';

export async function listCardsSvc(p: ListCardParams) {
  return listCardsRepo(p);
}

export async function getCardSvc(id: string) {
  const l = await getCardRepo(id);
  if (!l) throw NotFound('Card not found');
  return l;
}

export async function createCardSvc(input: { companyId: string; name: string; createdBy: string }) {
  const dup = await findCardByNameRepo(input.companyId, input.name);
  if (dup && !dup.isDeleted) throw Conflict('Card name already exists for this company');
  if (dup && dup.isDeleted) {
    const row = await updateCardRepo(dup.id, { name: input.name, isDeleted: false });
    return { id: row?.id ?? dup.id };
  }
  const created = await createCardRepo({ ...input, isDeleted: false });
  return { id: created?.id };
}

export async function updateCardSvc(id: string, patch: { name?: string }) {
  const cur = await getCardRepo(id);
  if (!cur) throw NotFound('Card not found');
  if (patch.name && patch.name !== cur.name) {
    const dup = await findCardByNameRepo(cur.companyId, patch.name);
    if (dup && dup.id !== id && !dup.isDeleted)
      throw Conflict('Card name already exists for this company');
  }
  const updated = await updateCardRepo(id, patch);
  if (!updated) throw NotFound('Card not found');
  return { id: updated.id };
}

export async function deleteCardSvc(id: string) {
  const hasAssociations = await checkCardHasAssociationsRepo(id);
  if (hasAssociations) {
    throw Conflict('Cannot delete card: it is associated with one or more customers');
  }
  const count = await softDeleteCardRepo(id);
  if (!count) throw NotFound('Card not found or already deleted');
  return { success: true };
}
