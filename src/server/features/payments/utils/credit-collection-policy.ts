import { PaymentComponent, PaymentMethod } from '@/db/schemas/enums';
import { BadRequest, Conflict } from '@/server/utils/http-error';

export function assertCreditPrincipalNotCollected(parcelMethod: number, component: number) {
  if (parcelMethod === PaymentMethod.CREDIT && component === PaymentComponent.PRINCIPAL) {
    throw Conflict(
      'This parcel is on customer credit. Record credit repayments through the customer credit account; printing must not collect another parcel payment.',
    );
  }
}

export function assertCreditBookingUncollected(
  method: number,
  senderPayment: number,
  receiverDue: number,
) {
  if (method === PaymentMethod.CREDIT && (senderPayment !== 0 || receiverDue !== 0)) {
    throw BadRequest(
      'Credit bookings must charge the full amount to the sender credit account with no parcel payment or receiver balance.',
    );
  }
}
