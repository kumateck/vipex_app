import { BadRequest, NotFound } from '../../utils/http-error';
import { recordAuditLog } from '../audit/logger';
import {
  createCustomerCardRepo,
  createCustomerRepo,
  findCustomerCardByTypeAndNumberRepo,
  findCustomersByTelephoneRepo,
  getCustomerRepo,
  listCardOptionsRepo,
  listCustomerCardsRepo,
  listCustomersRepo,
  softDeleteCustomerRepo,
  updateCustomerRepo,
  type CardOptionRow,
  type CustomerCardRow,
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
  isNiaVerified?: boolean;
  loggedToGovernment?: boolean;
  createdBy: string;
}): Promise<{ id: string }> {
  if (!input.companyId || !input.fullname) throw BadRequest('Missing required fields');
  const created = await createCustomerRepo({
    ...input,
    isNiaVerified: input.isNiaVerified ?? false,
    loggedToGovernment: input.loggedToGovernment ?? false,
    isDeleted: false,
  });
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
    isNiaVerified?: boolean;
    loggedToGovernment?: boolean;
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

export async function listCustomerCardsSvc(input: {
  customerId: string;
  companyId: string;
}): Promise<CustomerCardRow[]> {
  const customer = await getCustomerRepo(input.customerId);
  if (!customer || customer.companyId !== input.companyId) throw NotFound('Customer not found');
  return listCustomerCardsRepo(input);
}

export async function listCardOptionsSvc(companyId: string): Promise<CardOptionRow[]> {
  if (!companyId) throw BadRequest('Company is required');
  return listCardOptionsRepo(companyId);
}

export async function addCustomerCardSvc(input: {
  customerId: string;
  companyId: string;
  cardId: string;
  cardNumber: string;
}): Promise<{ id: string }> {
  const customer = await getCustomerRepo(input.customerId);
  if (!customer || customer.companyId !== input.companyId) throw NotFound('Customer not found');

  const cardNumber = input.cardNumber.trim();
  if (!cardNumber) throw BadRequest('Card number is required');

  const existing = await findCustomerCardByTypeAndNumberRepo({
    customerId: input.customerId,
    cardId: input.cardId,
    cardNumber,
  });
  if (existing) return existing;

  return createCustomerCardRepo({
    customerId: input.customerId,
    cardId: input.cardId,
    cardNumber,
  });
}
