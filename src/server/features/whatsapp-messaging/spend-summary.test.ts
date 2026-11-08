import { describe, expect, test } from 'bun:test';
import type { WhatsAppSpendRow } from './spend.repository';
import { rateForCategory, ratesForDay, summarizeWhatsAppSpend } from './spend-summary';

const RATES = { authentication: 10_000, utility: 20_000, marketing: 50_000 }; // 0.01 / 0.02 / 0.05
const SCHEDULE = [{ effectiveFrom: '2026-01-01', micros: RATES }];

const row = (overrides: Partial<WhatsAppSpendRow>): WhatsAppSpendRow => ({
  day: '2026-11-08',
  eventCode: 'digital_receipt_booking',
  status: 'delivered',
  billable: 'true',
  category: 'utility',
  count: 1,
  ...overrides,
});

describe('summarizeWhatsAppSpend', () => {
  test('bills messages Meta marked billable at the category price', () => {
    const { totals, byEvent } = summarizeWhatsAppSpend(
      [
        row({ count: 3 }),
        row({
          eventCode: 'receiver_pickup_otp',
          category: 'authentication',
          status: 'read',
          count: 2,
        }),
      ],
      SCHEDULE,
    );
    expect(totals.billable).toBe(5);
    expect(totals.amountMicros).toBe(3 * 20_000 + 2 * 10_000);
    expect(byEvent.map((event) => [event.eventCode, event.billable, event.rateMicros])).toEqual([
      ['digital_receipt_booking', 3, 20_000],
      ['receiver_pickup_otp', 2, 10_000],
    ]);
  });

  test('bills delivered messages Meta gave free, at the client price', () => {
    const { totals } = summarizeWhatsAppSpend(
      [row({ billable: 'false', category: 'service', count: 4 })],
      SCHEDULE,
    );
    // Priced by our message type (utility receipt), not Meta's 'service' category.
    expect(totals).toMatchObject({ billable: 4, free: 4, amountMicros: 4 * 20_000 });
  });

  test('never bills failed or unconfirmed messages', () => {
    const { totals } = summarizeWhatsAppSpend(
      [
        row({ status: 'failed', billable: 'true', count: 2 }),
        row({ status: 'sent', billable: null, category: null, count: 5 }),
        row({ status: 'sent', billable: 'false', count: 1 }),
      ],
      SCHEDULE,
    );
    expect(totals).toMatchObject({
      messages: 8,
      billable: 0,
      failed: 2,
      unconfirmed: 6,
      free: 0,
      amountMicros: 0,
    });
  });

  test('bills delivered messages without pricing as estimated, using the event category', () => {
    const { totals } = summarizeWhatsAppSpend(
      [row({ eventCode: 'receiver_pickup_otp', billable: null, category: null, count: 2 })],
      SCHEDULE,
    );
    expect(totals).toMatchObject({ billable: 2, estimated: 2, amountMicros: 20_000 });
  });

  test('groups by day in date order', () => {
    const { daily } = summarizeWhatsAppSpend(
      [row({ day: '2026-11-09' }), row({ day: '2026-11-08', count: 2 })],
      SCHEDULE,
    );
    expect(daily.map((day) => [day.day, day.billable])).toEqual([
      ['2026-11-08', 2],
      ['2026-11-09', 1],
    ]);
  });
});

describe('price periods', () => {
  const RAISED = { authentication: 15_000, utility: 30_000, marketing: 50_000 };
  const TWO_PRICES = [
    { effectiveFrom: '2026-11-15', micros: RAISED },
    { effectiveFrom: '2026-11-01', micros: RATES },
  ];

  test('picks the latest start date on or before the day', () => {
    expect(ratesForDay(TWO_PRICES, '2026-10-31')).toBeNull();
    expect(ratesForDay(TWO_PRICES, '2026-11-14')).toEqual(RATES);
    expect(ratesForDay(TWO_PRICES, '2026-11-15')).toEqual(RAISED);
  });

  test('bills each day at the price in force that day', () => {
    const { totals, byEvent } = summarizeWhatsAppSpend(
      [row({ day: '2026-11-10', count: 2 }), row({ day: '2026-11-20', count: 1 })],
      TWO_PRICES,
    );
    expect(totals.amountMicros).toBe(2 * 20_000 + 1 * 30_000);
    expect(byEvent[0]).toMatchObject({ rateMicros: 30_000, rateVaries: true });
  });

  test('a later price does not change an earlier period', () => {
    const before = summarizeWhatsAppSpend([row({ day: '2026-11-10', count: 3 })], [TWO_PRICES[1]!]);
    const after = summarizeWhatsAppSpend([row({ day: '2026-11-10', count: 3 })], TWO_PRICES);
    expect(after.totals.amountMicros).toBe(before.totals.amountMicros);
    expect(after.byEvent[0]?.rateVaries).toBe(false);
  });

  test('messages before the first price are billable but unpriced (0)', () => {
    const { totals } = summarizeWhatsAppSpend([row({ day: '2026-10-20', count: 4 })], TWO_PRICES);
    expect(totals).toMatchObject({ billable: 4, unpriced: 4, amountMicros: 0 });
  });
});

describe('rateForCategory', () => {
  test('maps Meta categories to client prices; service is free', () => {
    expect(rateForCategory('authentication_international', RATES)).toBe(10_000);
    expect(rateForCategory('marketing', RATES)).toBe(50_000);
    expect(rateForCategory('service', RATES)).toBe(0);
  });
});
