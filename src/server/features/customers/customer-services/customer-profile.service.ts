import { BadRequest, Conflict, NotFound } from '../../../utils/http-error';
import { db } from '@/db/config';
import { recordAuditLog } from '../../audit/logger';
import { resolveCustomerByTelephone } from '../resolve-customer-by-telephone';
import {
  createCustomerRepo,
  findCustomerByCompanyTelephonesRepo,
  getCustomerRepo,
  listCustomersRepo,
  type CustomerRow,
  type ListCustomerParams,
} from '../repository';
import { CustomerType } from '@/db/schemas/enums';

export type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export function parseCustomerType(value?: number): number {
  if (value == null) return CustomerType.INDIVIDUAL;
  if (!Number.isInteger(value) || value < 0 || value > CustomerType.STAFF) {
    throw BadRequest('Invalid customer type');
  }
  return value;
}

export function normalizeCreditLimitPsw(value?: number | null): number {
  if (value == null) return 0;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw BadRequest('Invalid credit limit value');
  }
  return Math.trunc(parsed);
}

export function normalizePaymentTermsDays(value?: number | null): number {
  if (value == null) return 0;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw BadRequest('Invalid payment terms value');
  }
  return Math.trunc(parsed);
}

export function normalizeCustomerTelephone(value?: string | null): string | null {
  if (value == null) return null;
  const normalized = value.trim().replace(/[()\-\s]/g, '');
  return normalized.length > 0 ? normalized : null;
}

export function assertBusinessCreationContext(
  customerType: number,
  sourceContext?: 'crm' | 'default',
) {
  if (customerType === CustomerType.INDIVIDUAL) return;
  if ((sourceContext ?? 'default') !== 'crm') {
    throw BadRequest('Business and exempt customers can only be created from Customer Management');
  }
}

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
  customerType?: number;
  creditEligible?: boolean;
  creditLimitPsw?: number;
  paymentTermsDays?: number;
  isNiaVerified?: boolean;
  loggedToGovernment?: boolean;
  sourceContext?: 'crm' | 'default';
  createdBy: string;
}): Promise<{ id: string }> {
  if (!input.companyId || !input.fullname) throw BadRequest('Missing required fields');

  const customerType = parseCustomerType(input.customerType);
  assertBusinessCreationContext(customerType, input.sourceContext);

  const creditEligible = input.creditEligible ?? false;
  if (creditEligible && customerType !== CustomerType.BUSINESS) {
    throw BadRequest('Only business customers can be marked as credit eligible');
  }

  const creditLimitPsw = normalizeCreditLimitPsw(input.creditLimitPsw);
  const paymentTermsDays = normalizePaymentTermsDays(input.paymentTermsDays);
  const telephone = normalizeCustomerTelephone(input.telephone);
  const telephone2 = normalizeCustomerTelephone(input.telephone2);

  if (telephone && telephone2 && telephone === telephone2) {
    throw BadRequest('Primary and secondary telephone cannot be the same');
  }

  const duplicateTelephone = await findCustomerByCompanyTelephonesRepo({
    companyId: input.companyId,
    telephones: [telephone, telephone2].filter((value): value is string => !!value),
  });
  if (duplicateTelephone) {
    throw Conflict('A customer with this telephone already exists in this company');
  }

  const created = await createCustomerRepo({
    companyId: input.companyId,
    fullname: input.fullname,
    telephone,
    telephone2,
    address: input.address ?? null,
    email: input.email ?? null,
    customerType,
    creditEligible,
    creditLimitPsw,
    paymentTermsDays,
    isNiaVerified: input.isNiaVerified ?? false,
    loggedToGovernment: input.loggedToGovernment ?? false,
    isDeleted: false,
    createdBy: input.createdBy,
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
      telephone,
      customerType,
      creditEligible,
      creditLimitPsw,
      paymentTermsDays,
    },
  });

  return { id: created.id };
}

export async function findOrCreateCustomerSvc(input: {
  companyId: string;
  fullname: string;
  telephone?: string | null;
  telephone2?: string | null;
  createdBy: string;
}): Promise<{ id: string }> {
  const telephone = normalizeCustomerTelephone(input.telephone);
  const telephone2 = normalizeCustomerTelephone(input.telephone2);

  const telephones = [telephone, telephone2].filter((value): value is string => !!value);
  return resolveCustomerByTelephone({
    findExisting: () =>
      findCustomerByCompanyTelephonesRepo({ companyId: input.companyId, telephones }),
    create: () =>
      createCustomerSvc({
        companyId: input.companyId,
        fullname: input.fullname,
        telephone,
        telephone2,
        createdBy: input.createdBy,
      }),
  });
}
