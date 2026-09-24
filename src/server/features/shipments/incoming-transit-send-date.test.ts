import { describe, expect, test } from 'bun:test';
import { incomingTransitSendDateBounds } from './incoming-transit-send-date';

describe('incoming transit send date', () => {
  test('covers the selected UTC calendar day', () => {
    expect(incomingTransitSendDateBounds('2026-09-22')).toEqual({
      start: new Date('2026-09-22T00:00:00.000Z'),
      end: new Date('2026-09-23T00:00:00.000Z'),
    });
  });

  test('accepts leap day and rejects invalid calendar dates', () => {
    expect(incomingTransitSendDateBounds('2024-02-29').end.toISOString()).toBe(
      '2024-03-01T00:00:00.000Z',
    );
    expect(() => incomingTransitSendDateBounds('2026-02-29')).toThrow();
    expect(() => incomingTransitSendDateBounds('22-09-2026')).toThrow();
  });
});
