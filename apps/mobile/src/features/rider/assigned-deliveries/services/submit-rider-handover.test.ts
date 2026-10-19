import { describe, expect, test } from 'bun:test';
import { submitRiderHandover } from './submit-rider-handover';
import type { DeliveryHandoverInput } from '../types';

const base = { signatureImage: 'signed', principalAmountCedis: 10, deliveryFeeAmountCedis: 5 };
describe('submit selected rider handover', () => {
  for (const handover of [
    { ...base, handoverTarget: 'main' },
    { ...base, handoverTarget: 'second', secondReceiverId: 'cashier-added' },
  ] satisfies DeliveryHandoverInput[]) {
    test(`passes ${handover.handoverTarget} selection with signature and collections`, async () => {
      const result = await submitRiderHandover(handover, 'rider', async (body) => {
        expect(body).toEqual({ ...handover, riderUserId: 'rider' });
        expect('secondReceiver' in body).toBe(false);
        return { id: 'delivery' };
      });
      expect(result.id).toBe('delivery');
    });
  }
});
