import { getWhatsAppEventDefinition } from '../notification-hub/whatsapp-event-definitions';
import type { WhatsAppSpendRow } from './spend.repository';

export type WhatsAppRateMicros = {
  authentication: number;
  utility: number;
  marketing: number;
};

/** A client price that applies from `effectiveFrom` (YYYY-MM-DD) until the next period. */
export type WhatsAppRatePeriod = { effectiveFrom: string; micros: WhatsAppRateMicros };

export type SpendCounts = {
  messages: number;
  delivered: number;
  failed: number;
  billable: number;
  /** Delivered before Meta's pricing was recorded; billed as delivered. */
  estimated: number;
  /**
   * Delivered messages Meta did not charge for (for example inside a customer
   * service window). Still billed to the client; internal only.
   */
  free: number;
  /** Accepted by Meta, not yet delivered (or delivered free but unconfirmed); not billed. */
  unconfirmed: number;
  /** Billable messages sent before the first price start date; billed at 0. */
  unpriced: number;
  amountMicros: number;
};

export type SpendByEvent = SpendCounts & {
  eventCode: string;
  name: string;
  category: string;
  /** Price of the latest day in the period for this message type. */
  rateMicros: number;
  /** True when the price changed during the period. */
  rateVaries: boolean;
};
export type SpendByDay = SpendCounts & { day: string };

const emptyCounts = (): SpendCounts => ({
  messages: 0,
  delivered: 0,
  failed: 0,
  billable: 0,
  estimated: 0,
  free: 0,
  unconfirmed: 0,
  unpriced: 0,
  amountMicros: 0,
});

/** The price period in force on `day`: the latest start date on or before it. */
export function ratesForDay(schedule: WhatsAppRatePeriod[], day: string) {
  let match: WhatsAppRatePeriod | null = null;
  for (const period of schedule) {
    if (period.effectiveFrom <= day && (!match || period.effectiveFrom > match.effectiveFrom)) {
      match = period;
    }
  }
  return match?.micros ?? null;
}

/** Client price for a Meta pricing category; categories we never send cost 0. */
export function rateForCategory(category: string, rates: WhatsAppRateMicros) {
  if (category.startsWith('authentication')) return rates.authentication;
  if (category === 'utility') return rates.utility;
  if (category === 'marketing') return rates.marketing;
  return 0;
}

function addRow(target: SpendCounts, row: WhatsAppSpendRow, rateMicros: number, isPriced: boolean) {
  const { count, status } = row;
  const delivered = status === 'delivered' || status === 'read';
  target.messages += count;
  if (delivered) target.delivered += count;
  if (status === 'failed') target.failed += count;

  // The client pays for every delivered message, even when Meta charged nothing.
  let billable = 0;
  if (status === 'failed') billable = 0;
  else if (row.billable === 'true' || delivered) billable = count;
  else target.unconfirmed += count;

  if (billable && row.billable === 'false') target.free += count;
  if (billable && row.billable === null) target.estimated += count;
  if (billable && !isPriced) target.unpriced += count;

  target.billable += billable;
  target.amountMicros += billable * rateMicros;
}

/**
 * Builds the client bill: totals, per message type, and per day. Each day is
 * billed at the price in force that day, so later price changes never alter
 * earlier periods.
 */
export function summarizeWhatsAppSpend(rows: WhatsAppSpendRow[], schedule: WhatsAppRatePeriod[]) {
  const totals = emptyCounts();
  const byEvent = new Map<string, SpendByEvent & { lastDay: string }>();
  const byDay = new Map<string, SpendByDay>();

  for (const row of rows) {
    const definition = row.eventCode ? getWhatsAppEventDefinition(row.eventCode) : null;
    // Client prices follow our message type (the quote), not Meta's category, which can be
    // 'service' for free messages.
    const category = definition?.category ?? row.category ?? 'utility';
    const rates = ratesForDay(schedule, row.day);
    const rateMicros = rates ? rateForCategory(category, rates) : 0;
    const eventCode = definition?.code ?? row.eventCode ?? 'other';

    const event = byEvent.get(eventCode) ?? {
      ...emptyCounts(),
      eventCode,
      name: definition?.name ?? 'Other WhatsApp messages',
      category,
      rateMicros,
      rateVaries: false,
      lastDay: row.day,
    };
    // Rows arrive in day order; the event shows the latest day's price.
    if (event.messages > 0 && event.rateMicros !== rateMicros) event.rateVaries = true;
    if (row.day >= event.lastDay) {
      event.rateMicros = rateMicros;
      event.lastDay = row.day;
    }
    const day = byDay.get(row.day) ?? { ...emptyCounts(), day: row.day };
    addRow(totals, row, rateMicros, Boolean(rates));
    addRow(event, row, rateMicros, Boolean(rates));
    addRow(day, row, rateMicros, Boolean(rates));
    byEvent.set(eventCode, event);
    byDay.set(row.day, day);
  }

  return {
    totals,
    byEvent: [...byEvent.values()]
      .sort((a, b) => b.messages - a.messages)
      .map(({ lastDay: _lastDay, ...event }): SpendByEvent => event),
    daily: [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day)),
  };
}
