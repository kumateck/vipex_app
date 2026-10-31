import { fromPesewas, toPesewas } from '@/server/utils/gh-money';
import { ParcelStatus } from '@/db/schemas';
import { BadRequest } from '../../../utils/http-error';
import { createParcelRepo } from '../parcels.repository';
import { getParcelChargeValidationError } from '@/shared/shipments/parcel-charge-policy';
import { db } from '@/db/config';
import { resolveReceivingPickupLocationsRepo } from '../../locations';

export async function createParcelSvc(input: {
  companyId: string;
  sourceId: string;
  destinationId: string;
  pickupLocationId?: string | null;
  bookingId: string;
  bookingCode: string;
  trackingCode: string;
  senderId: string;
  receiverId: string;
  status: number;
  parcelDetails: string;
  parcelContent: string;
  parcelValueCedis?: number | string | null;
  chargeCedis?: number | string | null;
  plannedToBePaidCedis?: number | string | null;
  method: number;
  createdBy?: string | null;
  cashierSessionId?: string | null;
}): Promise<{ id: string }> {
  if (
    !input.companyId ||
    !input.sourceId ||
    !input.destinationId ||
    !input.bookingId ||
    !input.bookingCode ||
    !input.trackingCode
  ) {
    throw BadRequest('Missing required fields');
  }
  if (input.status === ParcelStatus.RETURN_TO_SOURCE) {
    throw BadRequest('Use the destination branch return action to record a return to source');
  }
  const parcelValuePsw = input.parcelValueCedis != null ? toPesewas(input.parcelValueCedis) : 0n;
  const plannedToBePaidPsw =
    input.plannedToBePaidCedis != null ? toPesewas(input.plannedToBePaidCedis) : 0n;
  const chargePsw = input.chargeCedis != null ? toPesewas(input.chargeCedis) : plannedToBePaidPsw;
  const chargeValidationError = getParcelChargeValidationError({
    chargeCedis: fromPesewas(chargePsw),
    plannedToBePaidCedis: fromPesewas(plannedToBePaidPsw),
  });
  if (chargeValidationError) throw BadRequest(chargeValidationError);
  const created = await db.transaction(async (tx) => {
    const [location] = await resolveReceivingPickupLocationsRepo(input.companyId, [input], tx);
    return createParcelRepo(
      {
        companyId: input.companyId,
        sourceId: input.sourceId,
        destinationId: input.destinationId,
        pickupLocationId: location!.pickupLocationId,
        bookingId: input.bookingId,
        bookingCode: input.bookingCode,
        trackingCode: input.trackingCode,
        senderId: input.senderId,
        receiverId: input.receiverId,
        status: input.status,
        parcelDetails: input.parcelDetails,
        parcelContent: input.parcelContent,
        parcelValuePsw: Number(parcelValuePsw),
        chargePsw: Number(chargePsw),
        plannedToBePaidPsw: Number(plannedToBePaidPsw),
        method: input.method,
        createdBy: input.createdBy ?? null,
        cashierSessionId: input.cashierSessionId ?? null,
      },
      tx,
    );
  });
  return { id: created.id };
}
