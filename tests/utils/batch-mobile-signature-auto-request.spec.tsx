import { describe, expect, mock, test } from 'bun:test';
import { useState } from 'react';
import { act } from 'react-test-renderer';
import { renderHook } from './render-hook';

const requests: unknown[] = [];
const cancels: unknown[] = [];
const resolved = <T,>(value: T) => ({ unwrap: async () => value });

mock.module('@/features/operations/parcel-batch-handover/services', () => ({
  useGetBatchSignatureQuery: () => ({
    currentData: undefined,
    isFetching: false,
    isError: false,
    refetch: () => resolved(undefined),
  }),
  useRequestBatchSignatureMutation: () => [
    (body: unknown) => {
      requests.push(body);
      return resolved({ requestId: 'request' });
    },
    { isLoading: false },
  ],
  useCancelBatchSignatureMutation: () => [
    (body: unknown) => {
      cancels.push(body);
      return resolved({ cancelled: true });
    },
    { isLoading: false },
  ],
}));

const { useBatchMobileSignature } = await import(
  '@/features/operations/parcel-batch-handover/hooks/web/use-batch-mobile-signature'
);

type Flow = Parameters<typeof useBatchMobileSignature>[1];

function flowWith(token?: string, busy = false): Flow {
  return {
    busy,
    completedCount: 0,
    setSignature: () => undefined,
    confirm: async () => undefined,
    signaturePreparation: token
      ? {
          id: 'batch',
          verificationToken: token,
          telephone: '0241234567',
          items: [],
        }
      : undefined,
  } as unknown as Flow;
}

describe('batch mobile signature auto-request', () => {
  test('publishes the request to mobile once per OTP verification', async () => {
    requests.length = 0;
    const view = await renderHook(() => {
      const [flow, setFlow] = useState(flowWith);
      useBatchMobileSignature('receiver-cashier', flow);
      return setFlow;
    });
    const set = (flow: Flow) => act(async () => view.current(() => flow));
    try {
      expect(requests).toHaveLength(0);
      await set(flowWith('proof', true));
      expect(requests).toHaveLength(0);
      await set(flowWith('proof'));
      expect(requests).toHaveLength(1);
      expect(requests[0]).toMatchObject({ workflow: 'receiver-cashier', id: 'batch' });
      await set(flowWith('proof'));
      expect(requests).toHaveLength(1);
      await set(flowWith('new-proof'));
      expect(requests).toHaveLength(2);
    } finally {
      await view.unmount();
    }
  });
});
