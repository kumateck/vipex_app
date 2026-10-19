import { describe, expect, test } from 'bun:test';
import { SMS_EVENT_DEFINITIONS } from './sms-event-definitions';

describe('call outcome SMS variables', () => {
  test('all call outcome templates support the destination branch phone', () => {
    const callOutcomeEvents = SMS_EVENT_DEFINITIONS.filter((event) =>
      event.code.startsWith('parcel_status_call_'),
    );
    expect(callOutcomeEvents).toHaveLength(4);
    for (const event of callOutcomeEvents) expect(event.variables).toContain('branchPhone');
  });
});
