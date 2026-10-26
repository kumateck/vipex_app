import { listPaymentsForParcelRepo } from '@/server/features/payments/repository';
import { getParcelSvc } from '@/server/features/shipments/parcels.service';
import type { AuthUser } from '@/server/plugins/auth';
import { NotFound } from '@/server/utils/http-error';
import { canReadReceiptReprintTax } from './receipt-reprint-access';
import { buildSenderReceiptReprintTax } from './receipt-reprint-tax';

export async function getReceiptReprintTaxSvc(parcelId: string, user: AuthUser) {
  const parcel = await getParcelSvc(parcelId);
  if (!canReadReceiptReprintTax(user, parcel)) throw NotFound('Parcel not found');

  return buildSenderReceiptReprintTax(parcel.method, await listPaymentsForParcelRepo(parcelId));
}
