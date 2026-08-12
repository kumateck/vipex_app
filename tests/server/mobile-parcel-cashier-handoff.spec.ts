import { describe, expect, test } from 'bun:test';
import { ParcelStatus, PaymentMethod, PaymentResponsibility } from '@/db/schemas';
import {
  deferBookingToSenderCashier,
  type CreateBookingWithParcelsBody,
} from '@/server/features/shipments/booking-with-parcels.service';

function createBody(
  paymentResponsibility: PaymentResponsibility,
  plannedToBePaidCedis: number,
): CreateBookingWithParcelsBody {
  return {
    senderId: 'sender-id',
    companyId: 'company-id',
    sourceId: 'source-id',
    status: ParcelStatus.PROCESSED,
    createdBy: 'cashier-user-id',
    cashierSessionId: 'cashier-session-id',
    requireActiveCashierSession: true,
    parcels: [
      {
        destinationId: 'destination-id',
        receiverId: 'receiver-id',
        status: ParcelStatus.PROCESSED,
        parcelDetails: 'One box',
        parcelContent: 'Clothes',
        chargeCedis: 30,
        plannedToBePaidCedis,
        method: PaymentMethod.MTN,
        senderPaymentCedis: 30,
        senderPaymentMethod: PaymentMethod.MTN,
        paymentResponsibility,
        cashierUserId: 'cashier-user-id',
        branchId: 'source-id',
      },
    ],
  };
}

describe('mobile parcel sender cashier handoff', () => {
  test.each([
    [PaymentResponsibility.SENDER, 0],
    [PaymentResponsibility.RECIPIENT, 30],
  ])('defers responsibility %s without payment or cashier session', (responsibility, due) => {
    const deferred = deferBookingToSenderCashier(createBody(responsibility, due));

    expect(deferred.status).toBe(ParcelStatus.CREATED);
    expect(deferred.cashierSessionId).toBeNull();
    expect(deferred.requireActiveCashierSession).toBe(false);
    expect(deferred.parcels[0]).toMatchObject({
      status: ParcelStatus.CREATED,
      method: PaymentMethod.CASH,
      plannedToBePaidCedis: due,
      senderPaymentCedis: 0,
      paymentResponsibility: responsibility,
    });
    expect(deferred.parcels[0]?.senderPaymentMethod).toBeUndefined();
  });
});
