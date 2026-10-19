import type { RiderDoorstepRecord } from '@mobile/types/parcels';
import type { DeliveryHandoverInput } from '../types';

export function getRiderHandoverReceiver(
  target: 'main' | 'second',
  delivery: RiderDoorstepRecord,
): {
  error: string | null;
  input: Pick<DeliveryHandoverInput, 'handoverTarget' | 'secondReceiverId'>;
} {
  if (target === 'main') return { error: null, input: { handoverTarget: 'main' } };
  if (!delivery.secondReceiverId || delivery.secondReceiverId === delivery.receiverId)
    return {
      error: 'Ask the delivery cashier to add a second receiver, then refresh this delivery.',
      input: { handoverTarget: 'second' },
    };
  return {
    error: null,
    input: { handoverTarget: 'second', secondReceiverId: delivery.secondReceiverId },
  };
}
