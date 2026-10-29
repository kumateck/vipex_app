import { describe, expect, test } from 'bun:test';
import {
  buildConfirmedCashierStickerPayment,
  loadStickerPaymentForPrint,
} from '@/features/operations/parcel/utils';
import type { VerifiedStickerPayment } from '@/shared/printing';

const parcel = { bookingCode: 'B1', trackingCode: 'T1' };

describe('post-collection printing uses the completed cashier transaction', () => {
  test.each([0, 30])(
    'does not make another verification request for confirmed receiver balance %s',
    async (receiverToPayCedis) => {
      const confirmed = buildConfirmedCashierStickerPayment({ ...parcel, receiverToPayCedis });
      let requests = 0;
      const result = await loadStickerPaymentForPrint(parcel, confirmed, async () => {
        requests++;
        throw new Error('Secondary verification unavailable');
      });
      expect(requests).toBe(0);
      expect(result).toEqual({
        ...parcel,
        status: receiverToPayCedis > 0 ? 'TO BE PAID' : 'PAID',
        amountCedis: receiverToPayCedis,
      });
    },
  );
  test('initial booking/reprint data without a cashier result still loads the saved state', async () => {
    let requests = 0;
    const result = await loadStickerPaymentForPrint(parcel, undefined, async () => {
      requests++;
      return { ...parcel, status: 'CREDIT', amountCedis: 0 };
    });
    expect(requests).toBe(1);
    expect(result.status).toBe('CREDIT');
  });
  test('does not accept a confirmation for another parcel or an unknown state', async () => {
    for (const confirmed of [
      { ...parcel, trackingCode: 'other', status: 'PAID', amountCedis: 0 },
      { ...parcel, status: 'PENDING', amountCedis: 0 },
    ]) {
      await expect(
        loadStickerPaymentForPrint(parcel, confirmed as VerifiedStickerPayment, async () => {
          throw new Error('Unexpected lookup');
        }),
      ).rejects.toThrow();
    }
  });
  test.each([NaN, Infinity, -1])(
    'never converts an invalid balance %s to PAID',
    async (receiverToPayCedis) => {
      const confirmed = buildConfirmedCashierStickerPayment({ ...parcel, receiverToPayCedis });
      await expect(
        loadStickerPaymentForPrint(parcel, confirmed, async () => confirmed),
      ).rejects.toThrow();
    },
  );
});
