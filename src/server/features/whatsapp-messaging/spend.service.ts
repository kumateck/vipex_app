import { BadRequest } from '@/server/utils/http-error';
import { isValidIsoDate, loadWhatsAppBillingRatesSvc, toAmount } from './billing-rates.service';
import { fetchMetaWhatsAppSpend } from './meta-pricing-analytics';
import { findWhatsAppProviderRepo } from './repository';
import { listWhatsAppSpendRowsRepo } from './spend.repository';
import { ratesForDay, summarizeWhatsAppSpend, type SpendCounts } from './spend-summary';

const MAX_RANGE_DAYS = 366;

/**
 * `free` (delivered messages Meta did not charge for, still billed to the client)
 * and `unpriced` (billed before the first price start date) are internal: only
 * platform managers receive them.
 */
function presentCounts<T extends SpendCounts>(
  { amountMicros, free, unpriced, ...rest }: T,
  includeInternal: boolean,
) {
  return {
    ...rest,
    ...(includeInternal ? { free, unpriced } : {}),
    amount: toAmount(amountMicros),
  };
}

function assertPeriod(from: string, to: string) {
  if (!isValidIsoDate(from) || !isValidIsoDate(to)) {
    throw BadRequest('Dates must be YYYY-MM-DD');
  }
  const days = (Date.parse(to) - Date.parse(from)) / 86_400_000;
  if (Number.isNaN(days) || days < 0)
    throw BadRequest('The end date must be on or after the start date');
  if (days >= MAX_RANGE_DAYS) throw BadRequest('Choose a period of one year or less');
}

/**
 * Client bill for a period. `includeMetaCost` (platform managers only) adds what
 * Meta actually charged and the margin; other viewers never receive Meta's cost.
 */
export async function getWhatsAppSpendReportSvc(input: {
  companyId: string;
  from: string;
  to: string;
  includeMetaCost: boolean;
}) {
  assertPeriod(input.from, input.to);
  const [rates, rows, provider] = await Promise.all([
    loadWhatsAppBillingRatesSvc(input.companyId),
    listWhatsAppSpendRowsRepo(input),
    input.includeMetaCost ? findWhatsAppProviderRepo(input.companyId) : Promise.resolve(null),
  ]);
  const summary = summarizeWhatsAppSpend(rows, rates.schedule);
  const current = ratesForDay(rates.schedule, input.to);
  const amountDue = toAmount(summary.totals.amountMicros);

  const meta = input.includeMetaCost
    ? await fetchMetaWhatsAppSpend({ config: provider?.configJson ?? null, ...input })
    : null;
  const margin =
    meta?.available && meta.currency === rates.currency ? amountDue - meta.total : null;

  return {
    period: { from: input.from, to: input.to },
    prices: {
      currency: rates.currency,
      isConfigured: rates.history.length > 0,
      /** Prices in force on the last day of the period, or null before the first price. */
      current: current
        ? {
            authentication: toAmount(current.authentication),
            utility: toAmount(current.utility),
            marketing: toAmount(current.marketing),
          }
        : null,
      history: rates.history,
    },
    totals: presentCounts(summary.totals, input.includeMetaCost),
    byEvent: summary.byEvent.map(({ rateMicros, ...event }) => ({
      ...presentCounts(event, input.includeMetaCost),
      rate: toAmount(rateMicros),
    })),
    daily: summary.daily.map((day) => presentCounts(day, input.includeMetaCost)),
    metaCost: meta,
    margin,
  };
}
