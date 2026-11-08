import { describe, expect, test } from 'bun:test';
import {
  fetchMetaWhatsAppSpend,
  metaSpendWindow,
  summarizeMetaPricing,
} from './meta-pricing-analytics';

const CONFIG = {
  accessToken: 'secret-token',
  phoneNumberId: '1',
  wabaId: 'WABA1',
  apiVersion: 'v24.0',
};

describe('metaSpendWindow', () => {
  test('covers whole UTC days and never ends in the future', () => {
    const now = Date.parse('2026-11-08T12:00:00Z');
    expect(metaSpendWindow('2026-11-01', '2026-11-30', now)).toEqual({
      start: Date.parse('2026-11-01T00:00:00Z') / 1000,
      end: now / 1000,
    });
    expect(metaSpendWindow('2026-10-01', '2026-10-31', now).end).toBe(
      Date.parse('2026-11-01T00:00:00Z') / 1000,
    );
  });
});

describe('summarizeMetaPricing', () => {
  test('sums cost and volume per category', () => {
    const summary = summarizeMetaPricing({
      currency: 'USD',
      pricing_analytics: {
        data: [
          {
            data_points: [
              { pricing_category: 'UTILITY', volume: 10, cost: 0.04 },
              { pricing_category: 'UTILITY', volume: 5, cost: 0.02 },
              { pricing_category: 'AUTHENTICATION', volume: 20, cost: 0.08 },
            ],
          },
        ],
      },
    });
    expect(summary.currency).toBe('USD');
    expect(summary.total).toBeCloseTo(0.14);
    expect(summary.byCategory[0]).toEqual({ category: 'authentication', volume: 20, cost: 0.08 });
  });
});

describe('fetchMetaWhatsAppSpend', () => {
  test('needs the WhatsApp Business Account ID', async () => {
    const result = await fetchMetaWhatsAppSpend({
      config: { ...CONFIG, wabaId: '' },
      from: '2026-11-01',
      to: '2026-11-02',
    });
    expect(result.available).toBe(false);
  });

  test('calls the WABA pricing_analytics field and redacts the token in errors', async () => {
    let calledUrl = '';
    const request = (async (url: string) => {
      calledUrl = url;
      return new Response(
        JSON.stringify({ error: { code: 100, message: 'bad token secret-token' } }),
        { status: 400 },
      );
    }) as unknown as typeof fetch;
    const result = await fetchMetaWhatsAppSpend(
      { config: CONFIG, from: '2020-01-01', to: '2020-01-31' },
      request,
    );
    expect(decodeURIComponent(calledUrl)).toContain(
      'https://graph.facebook.com/v24.0/WABA1?fields=currency,pricing_analytics.start(',
    );
    expect(result).toEqual({
      available: false,
      error: 'Meta returned 400 (code 100): bad token [REDACTED]',
    });
  });
});
