import { DeliveryMode, PaymentComponent } from '@/db/schemas';
import { ParcelStatus } from '@/db/schemas/enums';
import { getActiveTaxProfileWithComponentsRepo } from '../accounting/repository';
import { getDeliveryByParcelRepo } from '../deliveries/repository';
import { listPaymentsForParcelRepo } from '../payments/repository';
import { getParcelRepo } from './parcels.repository';
import { computeGhanaTaxesFromPesewas } from '@/server/utils/tax/ghana';
import { computeTaxFromProfilePrincipalPsw } from '@/server/utils/tax/profile-engine';
import { BadRequest, Forbidden, NotFound } from '@/server/utils/http-error';
import { buildHomeDeliveryReceiptAmounts } from './home-delivery-receipt-amounts';

export async function getHomeDeliveryReceiptSvc(input: {
  parcelId: string;
  companyId: string | null;
  branchId: string | null;
}) {
  if (!input.companyId || !input.branchId) throw Forbidden('Company and branch are required');
  const parcel = await getParcelRepo(input.parcelId);
  if (!parcel || parcel.isDeleted) throw NotFound('Parcel not found');
  if (parcel.companyId !== input.companyId || parcel.destinationId !== input.branchId) {
    throw Forbidden('Parcel is outside your branch');
  }
  if (![ParcelStatus.ADDRESS_COLLECTED, ParcelStatus.RETURNED_TO_OFFICE].includes(parcel.status)) {
    throw BadRequest('Parcel is not available for home delivery dispatch');
  }

  const [delivery, payments, profile] = await Promise.all([
    getDeliveryByParcelRepo(parcel.id),
    listPaymentsForParcelRepo(parcel.id),
    getActiveTaxProfileWithComponentsRepo({ companyId: input.companyId }),
  ]);
  if (!delivery || delivery.isDeleted || delivery.mode !== DeliveryMode.DOORSTEP) {
    throw BadRequest('Parcel has no active home delivery fee');
  }

  const chargePsw = Math.max(Number(parcel.chargePsw), 0);
  const deliveryFeePsw = Math.max(Number(delivery.chargePsw), 0);
  const paidPsw = (component: PaymentComponent) =>
    payments
      .filter((payment) => payment.component === component && !payment.voidedAt)
      .reduce((sum, payment) => sum + Number(payment.grossAmountPsw), 0);
  const amounts = buildHomeDeliveryReceiptAmounts({
    chargePsw,
    deliveryFeePsw,
    paidPrincipalPsw: paidPsw(PaymentComponent.PRINCIPAL),
    paidDeliveryFeePsw: paidPsw(PaymentComponent.DELIVERY_FEE),
  });

  let netPsw: number;
  let taxTotalPsw: number;
  let taxRows: Array<{ label: string; amountPsw: number }>;
  if (profile?.components.length) {
    const tax = computeTaxFromProfilePrincipalPsw(BigInt(amounts.grossPsw), profile.components);
    netPsw = Number(tax.net);
    taxTotalPsw = Number(tax.totalTax);
    taxRows = tax.components.map((component) => ({
      label: component.key,
      amountPsw: Number(component.amountPsw),
    }));
  } else {
    const tax = computeGhanaTaxesFromPesewas(BigInt(amounts.grossPsw));
    netPsw = Number(tax.net);
    taxTotalPsw = Number(tax.totalTax);
    taxRows = [
      { label: 'GETFUND', amountPsw: Number(tax.getfund) },
      { label: 'NHIL', amountPsw: Number(tax.nhil) },
      { label: 'VAT', amountPsw: Number(tax.vat) },
      { label: 'COVID', amountPsw: Number(tax.covid) },
    ];
  }

  return {
    bookingCode: parcel.bookingCode,
    trackingCode: parcel.trackingCode,
    ...amounts,
    netPsw,
    taxTotalPsw,
    taxRows,
  };
}
