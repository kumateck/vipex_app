import { toPesewas } from '@/server/utils/gh-money';
import { NotFound } from '../../utils/http-error';

import {
  createSessionTypeRepo,
  getSessionRepo,
  listSessionTypesRepo,
  listSessionsRepo,
  openSessionRepo,
  closeSessionRepo,
  type SessionRow,
  type ListSessionsParams,
} from './repository';

export async function listSessionTypesSvc() {
  return listSessionTypesRepo();
}
export async function createSessionTypeSvc(input: {
  sessionType: string;
  startTime: string;
  endTime: string;
  createdBy: string;
}) {
  const created = await createSessionTypeRepo(input);
  return { id: created.id };
}

export async function listSessionsSvc(p: ListSessionsParams) {
  return listSessionsRepo(p);
}
export async function getSessionSvc(id: string): Promise<SessionRow> {
  const s = await getSessionRepo(id);
  if (!s) throw NotFound('Session not found');
  return s;
}
export async function openSessionSvc(input: {
  cashierId: string;
  branchId: string;
  sessionTypeId: string;
  startTime: string; // ISO
  openingBalanceCedis?: number | string | null;
}) {
  const openingBalancePsw =
    input.openingBalanceCedis != null ? toPesewas(input.openingBalanceCedis) : 0n;
  const created = await openSessionRepo({
    cashierId: input.cashierId,
    branchId: input.branchId,
    sessionTypeId: input.sessionTypeId,
    startTime: new Date(input.startTime),
    openingBalancePsw,
    status: 'ACTIVE',
  });
  return { id: created.id };
}
export async function closeSessionSvc(
  id: string,
  input: { endTime: string; closingBalanceCedis?: number | string | null },
) {
  const patch = {
    endTime: new Date(input.endTime),
    closingBalancePsw:
      input.closingBalanceCedis != null ? toPesewas(input.closingBalanceCedis) : 0n,
    status: 'CLOSED',
  };
  const updated = await closeSessionRepo(id, patch);
  if (!updated) throw NotFound('Session not found');
  return { id: updated.id };
}
