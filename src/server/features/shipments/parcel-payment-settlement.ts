import { Conflict, NotFound } from '@/server/utils/http-error';
import { DeliveryMode, PaymentComponent } from '@/db/schemas';
import { ParcelStatus } from '@/db/schemas/enums';
import { db } from '@/db/config';
import { getDeliveryByParcelRepo } from '../deliveries/repository';
import { listPaymentsForParcelRepo } from '../payments/repository';
import { getParcelRepo } from './parcels.repository';
type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export type ParcelPaymentSettlement = {
  parcelId: string;
  requiredPrincipalPsw: number;
  requiredDeliveryFeePsw: number;
  requiredTotalPsw: number;
  paidPrincipalPsw: number;
  paidDeliveryFeePsw: number;
  paidTotalPsw: number;
  outstandingPsw: number;
};

export async function getParcelPaymentSettlement(
  parcelId: string,
  executor: DbExecutor = db,
): Promise<ParcelPaymentSettlement> {
  const parcel = await getParcelRepo(parcelId, executor);
  if (!parcel) throw NotFound('Parcel not found');

  const [delivery, payments] = await Promise.all([
    getDeliveryByParcelRepo(parcelId, executor),
    listPaymentsForParcelRepo(parcelId, executor),
  ]);

  const requiredPrincipalPsw = Number(parcel.chargePsw ?? 0);
  const shouldRequireDoorstepFee =
    delivery &&
    delivery.mode === DeliveryMode.DOORSTEP &&
    parcel.status !== ParcelStatus.AWAITING_PICKUP &&
    parcel.status !== ParcelStatus.DELIVERED_BY_OFFICE;
  const requiredDeliveryFeePsw = shouldRequireDoorstepFee ? Number(delivery?.chargePsw ?? 0) : 0;
  const requiredTotalPsw = requiredPrincipalPsw + requiredDeliveryFeePsw;

  const paidPrincipalPsw = payments
    .filter((payment) => payment.component === PaymentComponent.PRINCIPAL)
    .reduce((sum, payment) => sum + Number(payment.grossAmountPsw ?? 0), 0);
  const paidDeliveryFeePsw = payments
    .filter((payment) => payment.component === PaymentComponent.DELIVERY_FEE)
    .reduce((sum, payment) => sum + Number(payment.grossAmountPsw ?? 0), 0);
  const paidTotalPsw = paidPrincipalPsw + paidDeliveryFeePsw;
  const outstandingPsw = requiredTotalPsw - paidTotalPsw;

  return {
    parcelId,
    requiredPrincipalPsw,
    requiredDeliveryFeePsw,
    requiredTotalPsw,
    paidPrincipalPsw,
    paidDeliveryFeePsw,
    paidTotalPsw,
    outstandingPsw,
  };
}

export async function assertParcelFullyPaid(
  parcelId: string,
  executor: DbExecutor = db,
): Promise<ParcelPaymentSettlement> {
  const settlement = await getParcelPaymentSettlement(parcelId, executor);

  if (settlement.paidTotalPsw !== settlement.requiredTotalPsw) {
    if (settlement.outstandingPsw > 0) {
      throw Conflict(
        `Parcel cannot be completed until fully paid. Outstanding amount: ${(settlement.outstandingPsw / 100).toFixed(2)} GHS`,
      );
    }
    throw Conflict(
      `Parcel payment exceeds required total by ${(Math.abs(settlement.outstandingPsw) / 100).toFixed(2)} GHS`,
    );
  }

  return settlement;
}
