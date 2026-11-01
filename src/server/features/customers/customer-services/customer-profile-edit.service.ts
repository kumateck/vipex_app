import { BadRequest, Conflict, NotFound } from '../../../utils/http-error';
import { recordAuditLog } from '../../audit/logger';
import {
  createCustomerCardRepo,
  findCustomerCardByTypeAndNumberRepo,
  findCustomerByCompanyTelephonesRepo,
  findCustomersByTelephoneRepo,
  getCardOptionByIdRepo,
  getCustomerRepo,
  listCardOptionsRepo,
  listCustomerCardsRepo,
  softDeleteCustomerRepo,
  updateCustomerRepo,
  type CardOptionRow,
  type CustomerCardRow,
  type CustomerRow,
} from '../repository';
import { CustomerType } from '@/db/schemas/enums';
import {
  parseCustomerType,
  normalizeCreditLimitPsw,
  normalizePaymentTermsDays,
  normalizeCustomerTelephone,
  assertBusinessCreationContext,
} from './customer-profile.service';

export async function updateCustomerSvc(
  id: string,
  companyId: string,
  patch: {
    fullname?: string;
    telephone?: string | null;
    telephone2?: string | null;
    address?: string | null;
    email?: string | null;
    customerType?: number;
    creditEligible?: boolean;
    creditLimitPsw?: number;
    paymentTermsDays?: number;
    isNiaVerified?: boolean;
    loggedToGovernment?: boolean;
    sourceContext?: 'crm' | 'default';
  },
  actorUserId?: string | null,
): Promise<{ id: string }> {
  const cur = await getCustomerRepo(id);
  if (!cur || cur.companyId !== companyId) throw NotFound('Customer not found');

  const nextCustomerType =
    patch.customerType == null ? cur.customerType : parseCustomerType(patch.customerType);
  if (nextCustomerType !== CustomerType.INDIVIDUAL && cur.customerType !== nextCustomerType) {
    assertBusinessCreationContext(nextCustomerType, patch.sourceContext);
  }

  const nextCreditEligible =
    patch.creditEligible == null ? cur.creditEligible : patch.creditEligible;
  if (nextCreditEligible && nextCustomerType !== CustomerType.BUSINESS) {
    throw BadRequest('Only business customers can be marked as credit eligible');
  }

  const patchData: Partial<{
    fullname: string;
    telephone: string | null;
    telephone2: string | null;
    address: string | null;
    email: string | null;
    customerType: number;
    creditEligible: boolean;
    creditLimitPsw: number;
    paymentTermsDays: number;
    isNiaVerified: boolean;
    loggedToGovernment: boolean;
  }> = {
    fullname: patch.fullname,
    telephone:
      patch.telephone !== undefined ? normalizeCustomerTelephone(patch.telephone) : undefined,
    telephone2:
      patch.telephone2 !== undefined ? normalizeCustomerTelephone(patch.telephone2) : undefined,
    address: patch.address,
    email: patch.email,
    customerType: patch.customerType,
    creditEligible: patch.creditEligible,
    isNiaVerified: patch.isNiaVerified,
    loggedToGovernment: patch.loggedToGovernment,
  };

  if (patch.creditLimitPsw != null) {
    patchData.creditLimitPsw = normalizeCreditLimitPsw(patch.creditLimitPsw);
  }

  if (patch.paymentTermsDays != null) {
    patchData.paymentTermsDays = normalizePaymentTermsDays(patch.paymentTermsDays);
  }

  const nextTelephone = patchData.telephone !== undefined ? patchData.telephone : cur.telephone;
  const nextTelephone2 = patchData.telephone2 !== undefined ? patchData.telephone2 : cur.telephone2;

  if (nextTelephone && nextTelephone2 && nextTelephone === nextTelephone2) {
    throw BadRequest('Primary and secondary telephone cannot be the same');
  }

  const duplicateTelephone = await findCustomerByCompanyTelephonesRepo({
    companyId,
    telephones: [nextTelephone, nextTelephone2].filter((value): value is string => !!value),
    excludeCustomerId: id,
  });
  if (duplicateTelephone) {
    throw Conflict('A customer with this telephone already exists in this company');
  }

  const updated = await updateCustomerRepo(id, patchData);
  if (!updated) throw NotFound('Customer not found');

  await recordAuditLog({
    companyId: cur.companyId,
    actorUserId: actorUserId ?? null,
    entityType: 'customer',
    entityId: id,
    action: 'CUSTOMER_UPDATED',
    message: 'Customer updated',
    metadata: { patch: patchData },
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
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
}): Promise<{ id: string }> {
  const customer = await getCustomerRepo(input.customerId);
  if (!customer || customer.companyId !== input.companyId) throw NotFound('Customer not found');
  const card = await getCardOptionByIdRepo({ id: input.cardId, companyId: input.companyId });
  if (!card) throw NotFound('Card type not found');

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
    frontImageUrl: input.frontImageUrl ?? null,
    backImageUrl: input.backImageUrl ?? null,
  });
}
