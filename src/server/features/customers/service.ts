import { BadRequest, NotFound } from '../../utils/http-error';
import { recordAuditLog } from '../audit/logger';
import {
  createCustomerRepo,
  findCustomersByTelephoneRepo,
  getCustomerRepo,
  listCustomersRepo,
  softDeleteCustomerRepo,
  updateCustomerRepo,
  type ListCustomerParams,
  type CustomerRow,
} from './repository';

export async function listCustomersSvc(p: ListCustomerParams) {
  return listCustomersRepo(p);
}
export async function getCustomerSvc(id: string, companyId?: string | null): Promise<CustomerRow> {
  const c = await getCustomerRepo(id);
  if (!c || (companyId && c.companyId !== companyId)) throw NotFound('Customer not found');
  return c;
}
export async function createCustomerSvc(input: {
  companyId: string;
  fullname: string;
  telephone?: string | null;
  telephone2?: string | null;
  address?: string | null;
  email?: string | null;
  createdBy: string;
}): Promise<{ id: string }> {
  if (!input.companyId || !input.fullname) throw BadRequest('Missing required fields');
  const created = await createCustomerRepo({ ...input, isDeleted: false });
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy,
    entityType: 'customer',
    entityId: created.id,
    action: 'CUSTOMER_CREATED',
    message: 'Customer created',
    metadata: {
      fullname: input.fullname,
      telephone: input.telephone ?? null,
    },
  });
  return { id: created.id };
}
export async function updateCustomerSvc(
  id: string,
  companyId: string,
  patch: {
    fullname?: string;
    telephone?: string | null;
    telephone2?: string | null;
    address?: string | null;
    email?: string | null;
  },
  actorUserId?: string | null,
): Promise<{ id: string }> {
  const cur = await getCustomerRepo(id);
  if (!cur || cur.companyId !== companyId) throw NotFound('Customer not found');
  const updated = await updateCustomerRepo(id, patch as typeof patch);
  if (!updated) throw NotFound('Customer not found');
  await recordAuditLog({
    companyId: cur.companyId,
    actorUserId: actorUserId ?? null,
    entityType: 'customer',
    entityId: id,
    action: 'CUSTOMER_UPDATED',
    message: 'Customer updated',
    metadata: { patch },
  });
  return { id: updated.id };
}
export async function deleteCustomerSvc(
  id: string,
  companyId: string,
  actorUserId?: string | null,
): Promise<{ success: true }> {
  const cur = await getCustomerRepo(id);
  if (!cur || cur.companyId !== companyId) throw NotFound('Customer not found or already deleted');
  const count = await softDeleteCustomerRepo(id);
  if (!count) throw NotFound('Customer not found or already deleted');
  await recordAuditLog({
    companyId: cur.companyId,
    actorUserId: actorUserId ?? null,
    entityType: 'customer',
    entityId: id,
    action: 'CUSTOMER_DELETED',
    message: 'Customer soft deleted',
  });
  return { success: true };
}

export async function findCustomersByTelephoneSvc(input: {
  companyId: string;
  telephone: string;
  limit?: number;
}): Promise<CustomerRow[]> {
  if (!input.companyId) throw BadRequest('Company is required');
  if (!input.telephone || input.telephone.trim().length < 6) {
    throw BadRequest('Telephone should be at least 6 characters');
  }
  return findCustomersByTelephoneRepo(input);
}
