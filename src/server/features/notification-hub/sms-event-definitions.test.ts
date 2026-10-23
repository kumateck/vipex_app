import { describe, expect, test } from 'bun:test';
import { SMS_EVENT_DEFINITIONS } from './sms-event-definitions';

describe('call outcome SMS variables', () => {
  test('every SMS event supports the location name and telephone without duplicate tokens', () => {
    for (const event of SMS_EVENT_DEFINITIONS) {
      expect(event.variables).toContain('location');
      expect(event.variables).toContain('locationName');
      expect(event.variables).toContain('locationPhone');
      expect(new Set(event.variables).size).toBe(event.variables.length);
    }
  });
  test('all call outcome templates support the destination branch phone', () => {
    const callOutcomeEvents = SMS_EVENT_DEFINITIONS.filter((event) =>
      event.code.startsWith('parcel_status_call_'),
    );
    expect(callOutcomeEvents).toHaveLength(4);
    for (const event of callOutcomeEvents) expect(event.variables).toContain('branchPhone');
  });
});
