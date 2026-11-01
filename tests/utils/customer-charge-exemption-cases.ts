import { expect } from 'bun:test';
import {
  createBookingWithParcelsSvc,
  type CreateBookingWithParcelsBody,
} from '@/server/features/shipments/booking-with-parcels.service';
export const exemptionBooking = (
  type: number,
  side: 'sender' | 'receiver' = 'receiver',
): CreateBookingWithParcelsBody => ({
  senderId: side === 'sender' ? `customer-${type}` : 'customer-0',
  companyId: 'company',
  sourceId: 'source',
  status: 0,
  createdBy: 'officer',
  requireActiveCashierSession: false,
  parcels: [
    {
      destinationId: 'destination',
      receiverId: side === 'receiver' ? `customer-${type}` : 'customer-0',
      status: 0,
      parcelDetails: 'One box',
      parcelContent: 'Clothes',
      chargeCedis: type > 1 ? 0 : 20,
      plannedToBePaidCedis: 0,
      method: 0,
      cashierUserId: 'officer',
      branchId: 'source',
      relatedStaffId: type === 5 ? 'ama' : undefined,
    },
  ],
});
export async function createExemptParcel(type = 2) {
  return (await createBookingWithParcelsSvc(exemptionBooking(type))).parcels[0]!.id;
}
export async function expectExemptionGuard(query: () => Promise<unknown>) {
  try {
    await query();
    throw new Error('Expected database charge guard to reject');
  } catch (error) {
    let cause = error as { code?: string; cause?: unknown };
    while (cause.cause) cause = cause.cause as typeof cause;
    expect(cause.code).toBe('23514');
  }
}
