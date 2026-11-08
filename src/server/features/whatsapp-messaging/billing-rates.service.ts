import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import { recordAuditLog } from '../audit/logger';
import {
  deleteWhatsAppBillingRateRepo,
  listWhatsAppBillingRatesRepo,
  upsertWhatsAppBillingRateRepo,
} from './billing-rates.repository';
import type { WhatsAppRatePeriod } from './spend-summary';

export const BILLING_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const MAX_RATE = 100;
const MICROS = 1_000_000;
export const DEFAULT_BILLING_CURRENCY = 'USD';

export const toAmount = (micros: number) => micros / MICROS;
const toMicros = (amount: number) => Math.round(amount * MICROS);

export function isValidIsoDate(value: string) {
  return BILLING_DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

/** Price history as stored, plus the schedule the bill calculation uses. */
export async function loadWhatsAppBillingRatesSvc(companyId: string) {
  const rows = await listWhatsAppBillingRatesRepo(companyId);
  const schedule: WhatsAppRatePeriod[] = rows.map((row) => ({
    effectiveFrom: row.effectiveFrom,
    micros: {
      authentication: row.authenticationRateMicros,
      utility: row.utilityRateMicros,
      marketing: row.marketingRateMicros,
    },
  }));
  return {
    currency: rows[0]?.currency ?? DEFAULT_BILLING_CURRENCY,
    schedule,
    history: rows.map((row) => ({
      id: row.id,
      effectiveFrom: row.effectiveFrom,
      authentication: toAmount(row.authenticationRateMicros),
      utility: toAmount(row.utilityRateMicros),
      marketing: toAmount(row.marketingRateMicros),
      updatedAt: row.updatedAt.toISOString(),
    })),
  };
}

/**
 * Adds a price period starting on `effectiveFrom` (or replaces the one starting
 * that day). All periods share one currency so a bill never mixes currencies.
 */
export async function saveWhatsAppBillingRateSvc(input: {
  companyId: string;
  actorUserId: string;
  effectiveFrom: string;
  currency: string;
  authentication: number;
  utility: number;
  marketing: number;
}) {
  const currency = input.currency.trim().toUpperCase();
  if (!CURRENCY_PATTERN.test(currency)) {
    throw BadRequest('Currency must be a 3-letter code like USD');
  }
  if (!isValidIsoDate(input.effectiveFrom)) throw BadRequest('Start date must be YYYY-MM-DD');
  for (const value of [input.authentication, input.utility, input.marketing]) {
    if (!Number.isFinite(value) || value < 0 || value > MAX_RATE) {
      throw BadRequest(`Prices must be between 0 and ${MAX_RATE} per message`);
    }
  }
  const others = (await listWhatsAppBillingRatesRepo(input.companyId)).filter(
    (row) => row.effectiveFrom !== input.effectiveFrom,
  );
  const otherCurrency = others.find((row) => row.currency !== currency)?.currency;
  if (otherCurrency) {
    throw BadRequest(
      `All prices must use the same currency (${otherCurrency}). Delete the other prices to change currency.`,
    );
  }

  const saved = await upsertWhatsAppBillingRateRepo({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    effectiveFrom: input.effectiveFrom,
    currency,
    authenticationRateMicros: toMicros(input.authentication),
    utilityRateMicros: toMicros(input.utility),
    marketingRateMicros: toMicros(input.marketing),
  });
  if (!saved) throw Conflict('Failed to save WhatsApp billing price');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'whatsapp_billing_rates',
    entityId: saved.id,
    action: 'WHATSAPP_BILLING_RATES_SAVED',
    message: `WhatsApp billing price saved from ${input.effectiveFrom}`,
    metadata: {
      effectiveFrom: input.effectiveFrom,
      currency,
      authentication: input.authentication,
      utility: input.utility,
      marketing: input.marketing,
    },
  });
  return { id: saved.id, effectiveFrom: saved.effectiveFrom };
}

export async function deleteWhatsAppBillingRateSvc(input: {
  companyId: string;
  actorUserId: string;
  id: string;
}) {
  const deleted = await deleteWhatsAppBillingRateRepo(input.id, input.companyId);
  if (!deleted) throw NotFound('Billing price not found');
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'whatsapp_billing_rates',
    entityId: deleted.id,
    action: 'WHATSAPP_BILLING_RATES_DELETED',
    message: `WhatsApp billing price from ${deleted.effectiveFrom} deleted`,
    metadata: {
      effectiveFrom: deleted.effectiveFrom,
      currency: deleted.currency,
      authentication: toAmount(deleted.authenticationRateMicros),
      utility: toAmount(deleted.utilityRateMicros),
    },
  });
  return { id: deleted.id };
}
