import { eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcels } from '@/db/schemas';
import { BadRequest } from '@/server/utils/http-error';
import {
  isReceiverCashierSignature,
  type ReceiverCashierSignature,
} from '@/shared/shipments/receiver-cashier-signature';
import { signalReceiverHandoverChange } from '../receiver-handover-changes';
import { lockParcel, getPending, type Action } from './scope';

export async function captureReceiverHandoverSignature(
  input: Action & { signature: ReceiverCashierSignature },
) {
  if (!isReceiverCashierSignature(input.signature)) throw BadRequest('Capture a usable signature');
  const result = await db.transaction(async (tx) => {
    const parcel = await lockParcel(input, tx);
    const pending = getPending(parcel, input.handoverId);
    if (pending.capture) return { id: parcel.id, signedAt: pending.capture.capturedAt };
    const capturedAt = new Date().toISOString();
    await tx
      .update(parcels)
      .set({
        pendingReceiverHandover: {
          ...pending,
          capture: { ...input.signature, capturedAt, capturedBy: input.actorId },
        },
        updatedAt: new Date(capturedAt),
      })
      .where(eq(parcels.id, parcel.id));
    return { id: parcel.id, signedAt: capturedAt };
  });
  signalReceiverHandoverChange(input);
  return result;
}
