import { describe, expect, test } from 'bun:test';
import { act } from 'react-test-renderer';
import { useBatchHandover } from '@/features/operations/parcel-batch-handover/hooks/shared';
import type { BatchHandoverApi } from '@/features/operations/parcel-batch-handover/types';
import type {
  BatchConfirmation,
  BatchPickupParcel,
} from '@/shared/shipments/parcel-batch-handover';
import { encodeHandoverSignature } from '@/shared/shipments/handover-signature';
import { renderHook } from './render-hook';

const rows: BatchPickupParcel[] = ['first', 'second', 'third'].map((id) => ({
  id,
  receiverId: 'receiver',
  principalPsw: 0,
  storagePsw: 0,
  bookingCode: id,
  trackingCode: id,
  receiverName: 'Receiver',
  parcelDetails: 'Box',
  queueNumber: 1,
  needsAssociate: false,
  pickupLocationName: null,
  receivingOfficeName: null,
  blockedReason: null,
}));

describe('batch signature client confirmation', () => {
  test.each([false, true])(
    'submits the selected list with a local or saved remote signature, remote=%s',
    async (remote) => {
      const submitted: BatchConfirmation[] = [];
      const api: BatchHandoverApi = {
        search: async () => ({ rows, next: null, staff: [] }),
        requestOtp: async () => ({
          id: 'batch',
          expiresAt: new Date(Date.now() + 600000).toISOString(),
          resendAt: new Date().toISOString(),
        }),
        verifyOtp: async () => ({
          verificationToken: 'proof',
          expiresAt: new Date(Date.now() + 600000).toISOString(),
        }),
        confirm: async (input) => {
          submitted.push(input);
          return { parcelIds: input.items.map(({ id }) => id), alreadyConfirmed: false };
        },
        errorMessage: (_error, fallback) => fallback,
      };
      const view = await renderHook(() => useBatchHandover(api));
      try {
        await act(async () => view.current.setDraft('0241234567'));
        await act(async () => {
          await view.current.search();
        });
        await act(async () => {
          view.current.toggle(rows[0]!);
          view.current.toggle(rows[1]!);
        });
        await act(async () => {
          await view.current.sendOtp();
        });
        await act(async () => view.current.setOtp('123456'));
        await act(async () => {
          await view.current.verifyOtp();
        });
        expect(view.current.signaturePreparation).toMatchObject({
          id: 'batch',
          verificationToken: 'proof',
          telephone: '0241234567',
        });
        expect(view.current.signaturePreparation?.items.map(({ id }) => id)).toEqual([
          'first',
          'second',
        ]);
        await act(async () => {
          await view.current.confirm();
        });
        expect(submitted).toHaveLength(0);
        if (!remote)
          await act(async () =>
            view.current.setSignature({
              source: 'touchscreen',
              signatureImage: encodeHandoverSignature(
                [
                  [
                    { x: 3, y: 5 },
                    { x: 22, y: 30 },
                  ],
                ],
                90,
                50,
              ),
            }),
          );
        await act(async () => {
          await view.current.confirm(remote);
        });
        expect(submitted).toHaveLength(1);
        expect(submitted[0]!.items.map(({ id }) => id)).toEqual(['first', 'second']);
        expect(Boolean(submitted[0]!.signature)).toBe(!remote);
        expect(view.current.completedCount).toBe(2);
      } finally {
        await view.unmount();
      }
    },
  );
});
