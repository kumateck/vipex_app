import { BadRequest, NotFound } from '../../utils/http-error';
import {
  createCustomerRepo,
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
export async function getCustomerSvc(id: string): Promise<CustomerRow> {
  const c = await getCustomerRepo(id);
  if (!c) throw NotFound('Customer not found');
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
  return { id: created.id };
}
export async function updateCustomerSvc(
  id: string,
  patch: {
    fullname?: string;
    telephone?: string | null;
    telephone2?: string | null;
    address?: string | null;
    email?: string | null;
  },
): Promise<{ id: string }> {
  const cur = await getCustomerRepo(id);
  if (!cur) throw NotFound('Customer not found');
  const updated = await updateCustomerRepo(id, patch as typeof patch);
  if (!updated) throw NotFound('Customer not found');
  return { id: updated.id };
}
export async function deleteCustomerSvc(id: string): Promise<{ success: true }> {
  const count = await softDeleteCustomerRepo(id);
  if (!count) throw NotFound('Customer not found or already deleted');
  return { success: true };
}
