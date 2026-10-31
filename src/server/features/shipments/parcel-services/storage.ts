import { PaymentComponent } from '@/db/schemas';
import { db } from '@/db/config';
import { listPaymentsForParcelRepo } from '../../payments/repository';
import { sumParcelStorageWaiversPswRepo } from '../parcels.repository';
import { STORAGE_PAYMENT_NOTE_PREFIX, type DbExecutor } from './helpers';
import { getCompanyParcelAgeingPolicy, computeStorageAccrualPsw } from './ageing';
import { getParcelSvc } from './queries';

export async function getParcelStorageSettlementSvc(
  parcelId: string,
  executor: DbExecutor = db,
): Promise<{
  parcelId: string;
  accruedPsw: number;
  paidPsw: number;
  waivedPsw: number;
  outstandingPsw: number;
}> {
  const parcel = await getParcelSvc(parcelId, executor);
  const policy = await getCompanyParcelAgeingPolicy(parcel.companyId);
  const accruedPsw = computeStorageAccrualPsw({
    status: parcel.status,
    receivedAt: parcel.receivedAt,
    policy,
    now: new Date(),
  });

  const [payments, waivedPsw] = await Promise.all([
    listPaymentsForParcelRepo(parcelId, executor),
    sumParcelStorageWaiversPswRepo(parcelId, executor),
  ]);

  const paidPsw = payments
    .filter(
      (payment) =>
        payment.component === PaymentComponent.OTHER &&
        (payment.notes ?? '').startsWith(STORAGE_PAYMENT_NOTE_PREFIX),
    )
    .reduce((sum, payment) => sum + Number(payment.grossAmountPsw ?? 0), 0);

  const outstandingPsw = Math.max(accruedPsw - paidPsw - waivedPsw, 0);

  return {
    parcelId,
    accruedPsw,
    paidPsw,
    waivedPsw,
    outstandingPsw,
  };
}
