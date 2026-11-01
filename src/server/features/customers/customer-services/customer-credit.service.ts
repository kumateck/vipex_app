import { BadRequest, Conflict, NotFound } from '../../../utils/http-error';
import { db } from '@/db/config';
import {
  createCustomerCreditTransactionRepo,
  findCustomerCardByTypeAndNumberRepo,
  getCardOptionByIdRepo,
  getCustomerCardRepo,
  getCustomerCreditBalancePswRepo,
  getCustomerRepo,
  listCustomerCreditTransactionsRepo,
  updateCustomerCardRepo,
  type CustomerCreditTransactionRow,
} from '../repository';
import { CustomerCreditSourceType, CustomerCreditTransactionType } from '@/db/schemas/enums';
import { type DbExecutor } from './customer-profile.service';

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

export { postCustomerCreditPaymentSvc } from '../credit-settlement';

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

export function parseOptionalDateTime(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw BadRequest('Invalid date format');
  return date;
}

export function parseDateRange(input: { dateFrom?: string | null; dateTo?: string | null }) {
  const dateFrom = parseOptionalDateTime(input.dateFrom);
  const dateTo = parseOptionalDateTime(input.dateTo);
  if (dateFrom && dateTo && dateFrom > dateTo) {
    throw BadRequest('dateFrom cannot be greater than dateTo');
  }
  return { dateFrom, dateTo };
}

export function toSafeDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toSafeIso(value: Date | string | null | undefined): string | null {
  const date = toSafeDate(value);
  return date ? date.toISOString() : null;
}

export function toSafeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getErrorCode(error: unknown, depth = 0): string | undefined {
  if (!error || typeof error !== 'object' || depth > 6) return undefined;
  const err = error as { code?: unknown; cause?: unknown };
  if (typeof err.code === 'string' && err.code.length > 0) return err.code;
  return getErrorCode(err.cause, depth + 1);
}

export function isMissingRelationError(error: unknown): boolean {
  const code = getErrorCode(error);
  return code === '42P01' || code === '42703';
}
