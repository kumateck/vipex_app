import { BadRequest, Conflict, NotFound } from '../../utils/http-error';
import { db } from '@/db/config';
import { recordAuditLog } from '../audit/logger';
import { toPesewas } from '@/server/utils/gh-money';
import {
  createCustomerCreditAllocationRepo,
  createCustomerCardRepo,
  createCustomerCreditTransactionRepo,
  createCustomerRepo,
  findCustomerCardByTypeAndNumberRepo,
  findCustomerByCompanyTelephonesRepo,
  findCustomersByTelephoneRepo,
  getCardOptionByIdRepo,
  getCustomerCardRepo,
  getCustomerCreditBalancePswRepo,
  getCustomerCreditBalanceBeforeDateRepo,
  getCustomerRepo,
  listCardOptionsRepo,
  listCustomerCreditPaymentsRepo,
  listCustomerCardsRepo,
  listCustomerCreditTransactionsByDateRepo,
  listCustomerCreditTransactionsRepo,
  listCustomerOpenCreditChargesRepo,
  listCustomerParcelPaymentsRepo,
  listCustomerStatementPaymentsRepo,
  listCustomerStatementReceivedParcelsRepo,
  listCustomerStatementSentParcelsRepo,
  listCustomerTransactionsMonthlyRepo,
  listCustomerTransactionsRepo,
  listCustomersRepo,
  softDeleteCustomerRepo,
  updateCustomerCardRepo,
  updateCustomerRepo,
  type CardOptionRow,
  type CustomerCardRow,
  type CustomerCreditTransactionRow,
  type CustomerRow,
  type ListCustomerParams,
} from './repository';
import {
  Payer,
  PaymentComponent,
  CustomerCreditSourceType,
  CustomerCreditTransactionType,
  CustomerType,
} from '@/db/schemas/enums';
type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

function parseCustomerType(value?: number): number {
  if (value == null) return CustomerType.INDIVIDUAL;
  if (value !== CustomerType.INDIVIDUAL && value !== CustomerType.BUSINESS) {
    throw BadRequest('Invalid customer type');
  }
  return value;
}

function normalizeCreditLimitPsw(value?: number | null): number {
  if (value == null) return 0;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw BadRequest('Invalid credit limit value');
  }
  return Math.trunc(parsed);
}

function normalizePaymentTermsDays(value?: number | null): number {
  if (value == null) return 0;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw BadRequest('Invalid payment terms value');
  }
  return Math.trunc(parsed);
}

function normalizeCustomerTelephone(value?: string | null): string | null {
  if (value == null) return null;
  const normalized = value.trim().replace(/[()\-\s]/g, '');
  return normalized.length > 0 ? normalized : null;
}

function assertBusinessCreationContext(customerType: number, sourceContext?: 'crm' | 'default') {
  if (customerType !== CustomerType.BUSINESS) return;
  if ((sourceContext ?? 'default') !== 'crm') {
    throw BadRequest('Business customers can only be created from CRM');
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
  if (nextCustomerType === CustomerType.BUSINESS && cur.customerType !== CustomerType.BUSINESS) {
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

export async function updateCustomerCardSvc(input: {
  id: string;
  customerId: string;
  companyId: string;
  cardId?: string;
  cardNumber?: string;
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
}): Promise<{ id: string }> {
  const customer = await getCustomerRepo(input.customerId);
  if (!customer || customer.companyId !== input.companyId) throw NotFound('Customer not found');

  const existing = await getCustomerCardRepo({ id: input.id, customerId: input.customerId });
  if (!existing) throw NotFound('Customer card not found');

  const nextCardId = input.cardId ?? existing.cardId;
  const nextCardNumber =
    input.cardNumber !== undefined ? input.cardNumber.trim() : existing.cardNumber;

  if (!nextCardNumber) throw BadRequest('Card number is required');

  if (nextCardId !== existing.cardId) {
    const card = await getCardOptionByIdRepo({ id: nextCardId, companyId: input.companyId });
    if (!card) throw NotFound('Card type not found');
  }

  const duplicate = await findCustomerCardByTypeAndNumberRepo({
    customerId: input.customerId,
    cardId: nextCardId,
    cardNumber: nextCardNumber,
    excludeCardRecordId: existing.id,
  });
  if (duplicate) throw Conflict('A customer card with this type and number already exists');

  const updated = await updateCustomerCardRepo(input.id, {
    cardId: nextCardId,
    cardNumber: nextCardNumber,
    frontImageUrl: input.frontImageUrl,
    backImageUrl: input.backImageUrl,
  });
  if (!updated) throw NotFound('Customer card not found');

  return updated;
}

export async function listCustomerCreditTransactionsSvc(input: {
  customerId: string;
  companyId: string;
  limit?: number;
  dateFrom?: string | null;
  dateTo?: string | null;
}): Promise<CustomerCreditTransactionRow[]> {
  const customer = await getCustomerRepo(input.customerId);
  if (!customer || customer.companyId !== input.companyId) throw NotFound('Customer not found');
  const { dateFrom, dateTo } = parseDateRange(input);
  return listCustomerCreditTransactionsRepo({
    customerId: input.customerId,
    companyId: input.companyId,
    limit: input.limit,
    dateFrom,
    dateTo,
  });
}

export async function getCustomerCreditSummarySvc(input: {
  customerId: string;
  companyId: string;
}): Promise<{
  balancePsw: number;
  balanceCedis: number;
  creditLimitPsw: number;
  availableCreditPsw: number | null;
}> {
  const customer = await getCustomerRepo(input.customerId);
  if (!customer || customer.companyId !== input.companyId) throw NotFound('Customer not found');

  const balancePsw = await getCustomerCreditBalancePswRepo({
    customerId: input.customerId,
    companyId: input.companyId,
  });

  const hasLimit = Number(customer.creditLimitPsw ?? 0) > 0;
  const availableCreditPsw = hasLimit
    ? Math.max(Number(customer.creditLimitPsw ?? 0) - balancePsw, 0)
    : null;

  return {
    balancePsw,
    balanceCedis: balancePsw / 100,
    creditLimitPsw: Number(customer.creditLimitPsw ?? 0),
    availableCreditPsw,
  };
}

export async function postCustomerCreditPaymentSvc(input: {
  customerId: string;
  companyId: string;
  amountCedis: number | string;
  notes?: string | null;
  referenceId?: string | null;
  createdBy: string;
}): Promise<{
  id: string;
  allocatedAmountPsw: number;
  unallocatedAmountPsw: number;
  allocations: Array<{ chargeTransactionId: string; amountPsw: number }>;
}> {
  const customer = await getCustomerRepo(input.customerId);
  if (!customer || customer.companyId !== input.companyId) throw NotFound('Customer not found');

  const amountPsw = Number(toPesewas(input.amountCedis));
  if (amountPsw <= 0) {
    throw BadRequest('Payment amount must be greater than zero');
  }

  const payment = await createCustomerCreditTransactionRepo({
    companyId: input.companyId,
    customerId: input.customerId,
    sourceType: CustomerCreditSourceType.MANUAL,
    transactionType: CustomerCreditTransactionType.PAYMENT,
    referenceId: input.referenceId ?? null,
    signedAmountPsw: -Math.abs(amountPsw),
    notes: input.notes ?? null,
    createdBy: input.createdBy,
  });

  const openCharges = await listCustomerOpenCreditChargesRepo({
    customerId: input.customerId,
    companyId: input.companyId,
  });

  let remainingPsw = amountPsw;
  const allocations: Array<{ chargeTransactionId: string; amountPsw: number }> = [];
  for (const charge of openCharges) {
    if (remainingPsw <= 0) break;
    if (charge.outstandingAmountPsw <= 0) continue;
    const allocationAmountPsw = Math.min(remainingPsw, charge.outstandingAmountPsw);
    if (allocationAmountPsw <= 0) continue;

    await createCustomerCreditAllocationRepo({
      companyId: input.companyId,
      customerId: input.customerId,
      chargeTransactionId: charge.chargeTransactionId,
      paymentTransactionId: payment.id,
      amountPsw: allocationAmountPsw,
      createdBy: input.createdBy,
    });
    allocations.push({
      chargeTransactionId: charge.chargeTransactionId,
      amountPsw: allocationAmountPsw,
    });
    remainingPsw -= allocationAmountPsw;
  }

  return {
    id: payment.id,
    allocatedAmountPsw: amountPsw - remainingPsw,
    unallocatedAmountPsw: remainingPsw,
    allocations,
  };
}

export async function postCustomerCreditChargeSvc(input: {
  customerId: string;
  companyId: string;
  amountPsw: number;
  sourceType: CustomerCreditSourceType;
  referenceId?: string | null;
  notes?: string | null;
  createdBy: string;
  executor?: DbExecutor;
}): Promise<{ id: string }> {
  const executor = input.executor ?? db;
  const customer = await getCustomerRepo(input.customerId, executor);
  if (!customer || customer.companyId !== input.companyId) throw NotFound('Customer not found');

  if (!customer.creditEligible) {
    throw Conflict('Customer is not eligible for credit');
  }

  const amountPsw = Math.trunc(Number(input.amountPsw));
  if (!Number.isFinite(amountPsw) || amountPsw <= 0) {
    throw BadRequest('Credit amount must be greater than zero');
  }

  const balancePsw = await getCustomerCreditBalancePswRepo({
    customerId: input.customerId,
    companyId: input.companyId,
    executor,
  });

  const creditLimitPsw = Number(customer.creditLimitPsw ?? 0);
  if (creditLimitPsw > 0 && balancePsw + amountPsw > creditLimitPsw) {
    throw Conflict('Credit limit exceeded for this customer');
  }

  return createCustomerCreditTransactionRepo({
    companyId: input.companyId,
    customerId: input.customerId,
    sourceType: input.sourceType,
    transactionType: CustomerCreditTransactionType.CHARGE,
    referenceId: input.referenceId ?? null,
    signedAmountPsw: Math.abs(amountPsw),
    notes: input.notes ?? null,
    createdBy: input.createdBy,
    executor,
  });
}

function parseOptionalDateTime(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw BadRequest('Invalid date format');
  return date;
}

function parseDateRange(input: { dateFrom?: string | null; dateTo?: string | null }) {
  const dateFrom = parseOptionalDateTime(input.dateFrom);
  const dateTo = parseOptionalDateTime(input.dateTo);
  if (dateFrom && dateTo && dateFrom > dateTo) {
    throw BadRequest('dateFrom cannot be greater than dateTo');
  }
  return { dateFrom, dateTo };
}

function toSafeDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toSafeIso(value: Date | string | null | undefined): string | null {
  const date = toSafeDate(value);
  return date ? date.toISOString() : null;
}

function toSafeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getErrorCode(error: unknown, depth = 0): string | undefined {
  if (!error || typeof error !== 'object' || depth > 6) return undefined;
  const err = error as { code?: unknown; cause?: unknown };
  if (typeof err.code === 'string' && err.code.length > 0) return err.code;
  return getErrorCode(err.cause, depth + 1);
}

function isMissingRelationError(error: unknown): boolean {
  const code = getErrorCode(error);
  return code === '42P01' || code === '42703';
}

function serializeErrorChain(error: unknown, depth = 0): Array<Record<string, unknown>> {
  if (!error || typeof error !== 'object' || depth > 8) return [];
  const err = error as {
    name?: unknown;
    message?: unknown;
    code?: unknown;
    command?: unknown;
    detail?: unknown;
    hint?: unknown;
    schema?: unknown;
    table?: unknown;
    column?: unknown;
    constraint?: unknown;
    cause?: unknown;
  };

  const node: Record<string, unknown> = {
    depth,
    name: err.name,
    message: err.message,
    code: err.code,
    command: err.command,
    detail: err.detail,
    hint: err.hint,
    schema: err.schema,
    table: err.table,
    column: err.column,
    constraint: err.constraint,
  };

  return [node, ...serializeErrorChain(err.cause, depth + 1)];
}

function debugCustomerServiceError(
  scope: string,
  input: Record<string, unknown>,
  error: unknown,
): void {
  console.error(
    '[customers][debug]',
    JSON.stringify(
      {
        scope,
        input,
        errorCode: getErrorCode(error),
        errorChain: serializeErrorChain(error),
      },
      null,
      2,
    ),
  );
}

export async function getCustomerStatementSvc(input: {
  customerId: string;
  companyId: string;
  dateFrom?: string | null;
  dateTo?: string | null;
}) {
  try {
    const customer = await getCustomerRepo(input.customerId);
    if (!customer || customer.companyId !== input.companyId) throw NotFound('Customer not found');

    const { dateFrom, dateTo } = parseDateRange(input);

    const creditRowsPromise = (async () => {
      try {
        return await listCustomerCreditTransactionsByDateRepo({
          customerId: input.customerId,
          companyId: input.companyId,
          dateFrom,
          dateTo,
        });
      } catch (error) {
        if (isMissingRelationError(error)) return [] as CustomerCreditTransactionRow[];
        throw error;
      }
    })();

    const openingCreditBalancePromise = dateFrom
      ? (async () => {
          try {
            return await getCustomerCreditBalanceBeforeDateRepo({
              customerId: input.customerId,
              companyId: input.companyId,
              before: dateFrom,
            });
          } catch (error) {
            if (isMissingRelationError(error)) return 0;
            throw error;
          }
        })()
      : Promise.resolve(0);

    const [sentParcels, receivedParcels, paymentsRows, creditRows, openingCreditBalancePsw] =
      await Promise.all([
        (async () => {
          try {
            return await listCustomerStatementSentParcelsRepo({
              customerId: input.customerId,
              companyId: input.companyId,
              dateFrom,
              dateTo,
            });
          } catch (error) {
            if (isMissingRelationError(error)) return [];
            throw error;
          }
        })(),
        (async () => {
          try {
            return await listCustomerStatementReceivedParcelsRepo({
              customerId: input.customerId,
              companyId: input.companyId,
              dateFrom,
              dateTo,
            });
          } catch (error) {
            if (isMissingRelationError(error)) return [];
            throw error;
          }
        })(),
        (async () => {
          try {
            return await listCustomerStatementPaymentsRepo({
              customerId: input.customerId,
              companyId: input.companyId,
              dateFrom,
              dateTo,
            });
          } catch (error) {
            if (isMissingRelationError(error)) return [];
            throw error;
          }
        })(),
        creditRowsPromise,
        openingCreditBalancePromise,
      ]);

    const sentRows = sentParcels.flatMap((row) => {
      const timestamp = toSafeIso(row.createdAt);
      if (!timestamp) return [];
      return {
        id: `parcel-sent:${row.id}`,
        timestamp,
        entryType: 'PARCEL_SENT' as const,
        direction: 'info' as const,
        amountPsw: toSafeNumber(row.chargePsw),
        parcelId: row.id,
        bookingCode: row.bookingCode,
        trackingCode: row.trackingCode,
        method: row.method,
        notes: 'Parcel sent',
      };
    });

    const receivedRows = receivedParcels.flatMap((row) => {
      const timestamp = toSafeIso(row.createdAt);
      if (!timestamp) return [];
      return {
        id: `parcel-received:${row.id}`,
        timestamp,
        entryType: 'PARCEL_RECEIVED' as const,
        direction: 'info' as const,
        amountPsw: toSafeNumber(row.plannedToBePaidPsw),
        parcelId: row.id,
        bookingCode: row.bookingCode,
        trackingCode: row.trackingCode,
        method: row.method,
        notes: 'Parcel received',
      };
    });

    const paymentRows = paymentsRows.flatMap((row) => {
      const timestamp = toSafeIso(row.receivedAt);
      if (!timestamp) return [];
      const customerIsSender = row.senderId === input.customerId;
      const customerIsReceiver =
        row.receiverId === input.customerId || row.secondReceiverId === input.customerId;
      const madeByCustomer =
        (row.payer === Payer.SENDER && customerIsSender) ||
        (row.payer === Payer.RECIPIENT && customerIsReceiver);
      return {
        id: `payment:${row.id}`,
        timestamp,
        entryType: 'PAYMENT' as const,
        direction: madeByCustomer ? ('credit' as const) : ('info' as const),
        amountPsw: toSafeNumber(row.grossAmountPsw),
        parcelId: row.parcelId,
        bookingCode: row.bookingCode,
        trackingCode: row.trackingCode,
        method: row.method,
        notes:
          row.component === PaymentComponent.DELIVERY_FEE
            ? madeByCustomer
              ? 'Delivery fee paid by customer'
              : 'Delivery fee payment (other payer)'
            : madeByCustomer
              ? 'Payment made by customer'
              : 'Payment recorded (other payer)',
      };
    });

    const creditStatementRows = creditRows.flatMap((row) => {
      const timestamp = toSafeIso(row.createdAt);
      if (!timestamp) return [];
      const signedAmountPsw = toSafeNumber(row.signedAmountPsw);
      return {
        id: `credit:${row.id}`,
        timestamp,
        entryType: 'CREDIT' as const,
        direction: signedAmountPsw >= 0 ? ('debit' as const) : ('credit' as const),
        amountPsw: Math.abs(signedAmountPsw),
        parcelId: row.referenceId ?? null,
        bookingCode: null,
        trackingCode: null,
        method: null,
        notes: row.notes ?? (signedAmountPsw >= 0 ? 'Credit charge' : 'Credit payment'),
      };
    });

    const rows = [...sentRows, ...receivedRows, ...paymentRows, ...creditStatementRows].sort(
      (a, b) => {
        if (a.timestamp === b.timestamp) return a.id < b.id ? 1 : -1;
        return a.timestamp < b.timestamp ? 1 : -1;
      },
    );

    const creditChargesPsw = creditRows
      .filter((row) => toSafeNumber(row.signedAmountPsw) > 0)
      .reduce((acc, row) => acc + toSafeNumber(row.signedAmountPsw), 0);
    const creditPaymentsPsw = creditRows
      .filter((row) => toSafeNumber(row.signedAmountPsw) < 0)
      .reduce((acc, row) => acc + Math.abs(toSafeNumber(row.signedAmountPsw)), 0);
    const paymentsMadeByCustomerPsw = paymentsRows.reduce((acc, row) => {
      const customerIsSender = row.senderId === input.customerId;
      const customerIsReceiver =
        row.receiverId === input.customerId || row.secondReceiverId === input.customerId;
      const madeByCustomer =
        (row.payer === Payer.SENDER && customerIsSender) ||
        (row.payer === Payer.RECIPIENT && customerIsReceiver);
      return madeByCustomer ? acc + toSafeNumber(row.grossAmountPsw) : acc;
    }, 0);

    const closingCreditBalancePsw = openingCreditBalancePsw + creditChargesPsw - creditPaymentsPsw;

    return {
      customer: {
        id: customer.id,
        fullname: customer.fullname,
        customerType: customer.customerType,
      },
      range: {
        dateFrom: dateFrom?.toISOString() ?? null,
        dateTo: dateTo?.toISOString() ?? null,
      },
      summary: {
        sentParcels: sentParcels.length,
        receivedParcels: receivedParcels.length,
        totalSentChargePsw: sentParcels.reduce((acc, row) => acc + toSafeNumber(row.chargePsw), 0),
        totalReceivingToPayPsw: receivedParcels.reduce(
          (acc, row) => acc + toSafeNumber(row.plannedToBePaidPsw),
          0,
        ),
        paymentsMadeByCustomerPsw,
        creditChargesPsw,
        creditPaymentsPsw,
        openingCreditBalancePsw,
        closingCreditBalancePsw,
      },
      rows,
    };
  } catch (error) {
    debugCustomerServiceError('getCustomerStatementSvc', input as Record<string, unknown>, error);
    throw error;
  }
}

export async function listCustomerTransactionsSvc(input: {
  customerId: string;
  companyId: string;
  dateFrom?: string | null;
  dateTo?: string | null;
  limit: number;
  offset: number;
}) {
  const customer = await getCustomerRepo(input.customerId);
  if (!customer || customer.companyId !== input.companyId) throw NotFound('Customer not found');
  const { dateFrom, dateTo } = parseDateRange(input);
  const result = await listCustomerTransactionsRepo({
    customerId: input.customerId,
    companyId: input.companyId,
    dateFrom,
    dateTo,
    limit: input.limit,
    offset: input.offset,
  });
  return {
    totalRecords: result.totalRecords,
    data: result.data.map((row) => {
      const isSender = row.senderId === input.customerId;
      return {
        id: row.id,
        bookingCode: row.bookingCode,
        trackingCode: row.trackingCode,
        sourceId: row.sourceId,
        destinationId: row.destinationId,
        status: row.status,
        chargePsw: row.chargePsw,
        method: row.method,
        transactionRole: isSender ? ('SENDER' as const) : ('RECEIVER' as const),
        createdAt: row.createdAt,
      };
    }),
  };
}

export async function listCustomerPaymentsSvc(input: {
  customerId: string;
  companyId: string;
  dateFrom?: string | null;
  dateTo?: string | null;
  limit: number;
  offset: number;
}): Promise<{
  data: Array<{
    id: string;
    source: 'PARCEL_PAYMENT' | 'CREDIT_PAYMENT';
    amountPsw: number;
    method: number | null;
    bookingCode: string | null;
    trackingCode: string | null;
    notes: string | null;
    createdAt: Date;
  }>;
  totalRecords: number;
}> {
  const customer = await getCustomerRepo(input.customerId);
  if (!customer || customer.companyId !== input.companyId) throw NotFound('Customer not found');
  const { dateFrom, dateTo } = parseDateRange(input);

  const [parcelPayments, creditPayments] = await Promise.all([
    (async () => {
      try {
        return await listCustomerParcelPaymentsRepo({
          customerId: input.customerId,
          companyId: input.companyId,
          dateFrom,
          dateTo,
          limit: 2000,
        });
      } catch (error) {
        if (isMissingRelationError(error)) return [];
        throw error;
      }
    })(),
    (async () => {
      try {
        return await listCustomerCreditPaymentsRepo({
          customerId: input.customerId,
          companyId: input.companyId,
          dateFrom,
          dateTo,
          limit: 2000,
        });
      } catch (error) {
        if (isMissingRelationError(error)) return [];
        throw error;
      }
    })(),
  ]);

  const merged = [...parcelPayments, ...creditPayments].sort((a, b) => {
    if (a.createdAt.getTime() === b.createdAt.getTime()) return a.id < b.id ? 1 : -1;
    return a.createdAt.getTime() < b.createdAt.getTime() ? 1 : -1;
  });

  const totalRecords = merged.length;
  const data = merged.slice(input.offset, input.offset + input.limit);
  return { data, totalRecords };
}

export async function listCustomerCreditOpenItemsSvc(input: {
  customerId: string;
  companyId: string;
  dateFrom?: string | null;
  dateTo?: string | null;
}) {
  const customer = await getCustomerRepo(input.customerId);
  if (!customer || customer.companyId !== input.companyId) throw NotFound('Customer not found');
  const { dateFrom, dateTo } = parseDateRange(input);
  let rows = [] as Awaited<ReturnType<typeof listCustomerOpenCreditChargesRepo>>;
  try {
    rows = await listCustomerOpenCreditChargesRepo({
      customerId: input.customerId,
      companyId: input.companyId,
    });
  } catch (error) {
    if (!isMissingRelationError(error)) throw error;
  }

  return rows.filter((row) => {
    if (dateFrom && row.createdAt < dateFrom) return false;
    if (dateTo && row.createdAt > dateTo) return false;
    return true;
  });
}

export async function getCustomerPaymentsMonthlySvc(input: {
  customerId: string;
  companyId: string;
  year?: number;
}) {
  const customer = await getCustomerRepo(input.customerId);
  if (!customer || customer.companyId !== input.companyId) throw NotFound('Customer not found');

  const now = new Date();
  const year = Number.isFinite(input.year) ? Math.trunc(Number(input.year)) : now.getFullYear();
  if (year < 2000 || year > 2100) throw BadRequest('Invalid year');

  const dateFrom = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  const dateTo = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

  const [parcelPayments, creditPayments] = await Promise.all([
    (async () => {
      try {
        return await listCustomerParcelPaymentsRepo({
          customerId: input.customerId,
          companyId: input.companyId,
          dateFrom,
          dateTo,
          limit: 20000,
        });
      } catch (error) {
        if (isMissingRelationError(error)) return [];
        throw error;
      }
    })(),
    (async () => {
      try {
        return await listCustomerCreditPaymentsRepo({
          customerId: input.customerId,
          companyId: input.companyId,
          dateFrom,
          dateTo,
          limit: 20000,
        });
      } catch (error) {
        if (isMissingRelationError(error)) return [];
        throw error;
      }
    })(),
  ]);

  const monthly = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    monthLabel: new Date(Date.UTC(year, index, 1)).toLocaleString('en-US', { month: 'short' }),
    totalPsw: 0,
    parcelPaymentsPsw: 0,
    creditPaymentsPsw: 0,
  }));

  for (const payment of parcelPayments) {
    const monthIndex = payment.createdAt.getUTCMonth();
    monthly[monthIndex]!.totalPsw += payment.amountPsw;
    monthly[monthIndex]!.parcelPaymentsPsw += payment.amountPsw;
  }
  for (const payment of creditPayments) {
    const monthIndex = payment.createdAt.getUTCMonth();
    monthly[monthIndex]!.totalPsw += payment.amountPsw;
    monthly[monthIndex]!.creditPaymentsPsw += payment.amountPsw;
  }

  const yearTotalPsw = monthly.reduce((acc, row) => acc + row.totalPsw, 0);

  return {
    year,
    yearTotalPsw,
    months: monthly,
  };
}

export async function getCustomerTransactionsMonthlySvc(input: {
  customerId: string;
  companyId: string;
  year?: number;
}) {
  try {
    const customer = await getCustomerRepo(input.customerId);
    if (!customer || customer.companyId !== input.companyId) throw NotFound('Customer not found');

    const now = new Date();
    const year = Number.isFinite(input.year) ? Math.trunc(Number(input.year)) : now.getFullYear();
    if (year < 2000 || year > 2100) throw BadRequest('Invalid year');

    let byMonth: Awaited<ReturnType<typeof listCustomerTransactionsMonthlyRepo>> = [];
    try {
      byMonth = await listCustomerTransactionsMonthlyRepo({
        customerId: input.customerId,
        companyId: input.companyId,
        year,
      });
    } catch (error) {
      if (!isMissingRelationError(error)) throw error;
    }

    const months = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      monthLabel: new Date(Date.UTC(year, index, 1)).toLocaleString('en-US', { month: 'short' }),
      sentCount: 0,
      receivedCount: 0,
      sentAmountPsw: 0,
      receivedAmountPsw: 0,
    }));

    for (const row of byMonth) {
      const idx = row.month - 1;
      if (idx < 0 || idx > 11) continue;
      months[idx]!.sentCount = row.sentCount;
      months[idx]!.receivedCount = row.receivedCount;
      months[idx]!.sentAmountPsw = row.sentAmountPsw;
      months[idx]!.receivedAmountPsw = row.receivedAmountPsw;
    }

    return {
      year,
      totalSentCount: months.reduce((acc, row) => acc + row.sentCount, 0),
      totalReceivedCount: months.reduce((acc, row) => acc + row.receivedCount, 0),
      totalSentAmountPsw: months.reduce((acc, row) => acc + row.sentAmountPsw, 0),
      totalReceivedAmountPsw: months.reduce((acc, row) => acc + row.receivedAmountPsw, 0),
      months,
    };
  } catch (error) {
    debugCustomerServiceError(
      'getCustomerTransactionsMonthlySvc',
      input as Record<string, unknown>,
      error,
    );
    throw error;
  }
}
