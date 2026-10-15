import { db } from '@/db/config';
import { Conflict } from '@/server/utils/http-error';
import { ParcelStatus } from '@/db/schemas/enums';
import { getOpenReconciliationCaseBlockingDeliveryRepo } from './parcel-reconciliation-cases.repository';
import { getParcelRepo } from './parcels.repository';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export async function assertNoOpenParcelReconciliationCaseForDelivery(
  parcelId: string,
  executor: DbExecutor = db,
) {
  const parcel = await getParcelRepo(parcelId, executor);
  if (parcel?.status === ParcelStatus.RETURN_TO_SOURCE) {
    throw Conflict('Parcel is marked for return to its source branch');
  }
  const openCase = await getOpenReconciliationCaseBlockingDeliveryRepo(parcelId, executor);
  if (openCase) {
    throw Conflict('Parcel has an open reconciliation case; resolve it before delivery');
  }
}
