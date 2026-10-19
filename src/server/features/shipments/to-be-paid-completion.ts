import { PaymentResponsibility } from '@/db/schemas/enums';
import { BadRequest } from '@/server/utils/http-error';

export type CompletionParcel = {
  paymentResponsibility?: number;
  senderPaymentCedis?: number | string | null;
  chargeCedis?: number | string | null;
  plannedToBePaidCedis?: number | string | null;
};

export function assertToBePaidCompletion(parcels: readonly CompletionParcel[]) {
  if (
    parcels.length === 0 ||
    parcels.some(
      (parcel) =>
        parcel.paymentResponsibility !== PaymentResponsibility.RECIPIENT ||
        Number(parcel.senderPaymentCedis ?? 0) !== 0 ||
        Number(parcel.chargeCedis ?? 0) <= 0 ||
        Number(parcel.plannedToBePaidCedis ?? 0) !== Number(parcel.chargeCedis ?? 0),
    )
  ) {
    throw BadRequest('Immediate completion is only available for fully receiver-paid parcels');
  }
}
