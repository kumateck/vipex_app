import { describe, expect, test } from 'bun:test';
import { assertParcelChargeAgentSelections } from '@/server/features/shipments/parcel-charge-agents.rules';
import {
  deferBookingToSenderCashier,
  type CreateBookingWithParcelsBody,
} from '@/server/features/shipments/booking-with-parcels.service';

describe('parcel charge-agent selections', () => {
  test('supports different agents per parcel and legacy requests without attribution', () => {
    expect(() =>
      assertParcelChargeAgentSelections(
        [
          { chargeAgentUserId: 'agent-a' },
          { chargeAgentUserId: 'agent-b' },
          {},
          { chargeAgentUserId: null },
        ],
        new Set(['agent-a', 'agent-b']),
      ),
    ).not.toThrow();
  });

  test.each(['', 'unknown', 'inactive', 'other-branch', 'other-company'])(
    'rejects ineligible selection %s with the parcel index',
    (id) => {
      expect(() =>
        assertParcelChargeAgentSelections(
          [{ chargeAgentUserId: 'agent-a' }, { chargeAgentUserId: id }],
          new Set(['agent-a']),
        ),
      ).toThrow('Parcel 2: Select an active charge agent');
    },
  );

  test('sender cashier handoff retains the explicitly selected charge agent', () => {
    const input = {
      status: 1,
      parcels: [{ status: 1, chargeAgentUserId: 'agent-a', senderPaymentCedis: 30 }],
    } as CreateBookingWithParcelsBody;
    expect(deferBookingToSenderCashier(input).parcels[0]?.chargeAgentUserId).toBe('agent-a');
    expect(input.parcels[0]?.senderPaymentCedis).toBe(30);
  });
});
