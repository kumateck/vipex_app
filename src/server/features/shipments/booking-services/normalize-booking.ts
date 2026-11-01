import { BadRequest } from '../../../utils/http-error';
import { PaymentResponsibility } from '@/db/schemas';
import { type CreateBookingWithParcelsBody } from './booking-input';

export function normalizeParcels(body: CreateBookingWithParcelsBody) {
  return body.parcels.map((parcel, index) => {
    const normalizedContent = parcel.parcelContent.trim();
    const normalizedDetails = parcel.parcelDetails.trim();

    if (!normalizedDetails.length) {
      throw BadRequest(`Parcel details are required for parcel ${index + 1}`);
    }
    if (!normalizedContent.length) {
      throw BadRequest(`Parcel content is required for parcel ${index + 1}`);
    }
    if (normalizedDetails.length > 255) {
      throw BadRequest(`Parcel details must be 255 characters or less for parcel ${index + 1}`);
    }
    if (normalizedContent.length > 255) {
      throw BadRequest(`Parcel content must be 255 characters or less for parcel ${index + 1}`);
    }

    const paymentResponsibility =
      parcel.paymentResponsibility ??
      (Number(parcel.senderPaymentCedis ?? 0) > 0
        ? Number(parcel.plannedToBePaidCedis ?? 0) > 0
          ? PaymentResponsibility.SPLIT
          : PaymentResponsibility.SENDER
        : Number(parcel.plannedToBePaidCedis ?? 0) > 0
          ? PaymentResponsibility.RECIPIENT
          : PaymentResponsibility.SENDER);

    return {
      ...parcel,
      parcelContent: normalizedContent,
      parcelDetails: normalizedDetails,
      paymentResponsibility,
    };
  });
}
