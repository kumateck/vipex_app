import { describe, expect, test } from 'bun:test';
import type { RiderDoorstepRecord } from '@mobile/types/parcels';
import { getRiderHandoverReceiver } from './rider-handover-receiver';

const delivery = { receiverId: 'main', secondReceiverId: 'cashier-added' } as RiderDoorstepRecord;
describe('rider receiver selection', () => {
  test('main selection preserves the saved second receiver association', () => {
    expect(getRiderHandoverReceiver('main', delivery)).toEqual({
      error: null,
      input: { handoverTarget: 'main' },
    });
  });
  test('selects only the second receiver already linked by the cashier', () => {
    expect(getRiderHandoverReceiver('second', delivery)).toEqual({
      error: null,
      input: { handoverTarget: 'second', secondReceiverId: 'cashier-added' },
    });
  });
  test('requires the cashier to add a missing second receiver', () => {
    const result = getRiderHandoverReceiver('second', { ...delivery, secondReceiverId: null });
    expect(result.error).toContain('delivery cashier');
    expect(result.input.secondReceiverId).toBeUndefined();
  });
  test('does not accept the main receiver as the second receiver', () => {
    expect(
      getRiderHandoverReceiver('second', { ...delivery, secondReceiverId: 'main' }).error,
    ).toBeTruthy();
  });
});
