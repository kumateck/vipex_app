import { BadRequest, Forbidden } from '../../utils/http-error';

import { PaymentComponent, Payer, CashierType, PaymentMethod } from '@/db/schemas';
import {
  createPaymentRepo,
  listPaymentsForParcelRepo,
  sumPaymentsForParcelComponentRepo,
  type PaymentRow,
} from './repository';
import { toPesewas } from '@/server/utils/gh-money';
import { computeGhanaTaxesFromPesewas } from '@/server/utils/tax/ghana';
import { assertActiveSessionSvc } from '../cashiers/service';
import { recordAuditLog } from '../audit/logger';
import { getParcelSvc } from '../shipments/parcels.service';
import { getParcelPaymentSettlement } from '../shipments/parcel-payment-settlement';

export async function createPaymentSvc(input: {
  companyId: string;
  branchId: string;
  parcelId: string;
  component: PaymentComponent; // PRINCIPAL (taxable) or DELIVERY_FEE (non-taxable)
  payer: Payer;
  cashierType: CashierType;
  method: PaymentMethod;
  cashierUserId: string;
  amountCedis: number | string;
  receivedAt?: string;
  notes?: string | null;
  receiptNo?: string | null;
}) {
  if (!input.amountCedis && input.amountCedis !== 0) throw BadRequest('Amount is required');
  if (!input.companyId || !input.branchId || !input.cashierUserId) {
    throw BadRequest('Authenticated company, branch and cashier context are required');
  }

  const parcel = await getParcelSvc(input.parcelId);
  if (parcel.companyId !== input.companyId) {
    throw BadRequest('Parcel does not belong to the authenticated company');
  }
  if (parcel.isDeleted) {
    throw BadRequest('Cannot collect payment for deleted parcel');
  }
  if (input.cashierType === CashierType.SENDING && parcel.sourceId !== input.branchId) {
    throw Forbidden('Sender cashier can only collect payment for parcels created in their branch');
  }

  await assertActiveSessionSvc({
    cashierId: input.cashierUserId,
    branchId: input.branchId,
  });

  const grossPsw = toPesewas(input.amountCedis);
  const amountPsw = Number(grossPsw);
  if (amountPsw <= 0) {
    throw BadRequest('Amount must be greater than 0');
  }

  const settlement = await getParcelPaymentSettlement(input.parcelId);
  const parcelPayments = await listPaymentsForParcelRepo(input.parcelId);
  const parcelPrincipalPaidPsw = settlement.paidPrincipalPsw;
  const parcelDeliveryFeePaidPsw = settlement.paidDeliveryFeePsw;
  const parcelTotalPaidPsw = settlement.paidTotalPsw;
  const parcelChargePsw = settlement.requiredPrincipalPsw;
  const doorstepChargePsw = settlement.requiredDeliveryFeePsw;
  const parcelAllowedTotalPsw = settlement.requiredTotalPsw;
  const senderExpectedPsw = Math.max(Number(parcel.chargePsw ?? 0) - Number(parcel.plannedToBePaidPsw ?? 0), 0);
  const senderPaidAlreadyPsw = parcelPayments
    .filter((payment) => payment.component === PaymentComponent.PRINCIPAL && payment.payer === Payer.SENDER)
    .reduce((sum, payment) => sum + Number(payment.grossAmountPsw ?? 0), 0);

  if (input.component === PaymentComponent.PRINCIPAL) {
    if (input.cashierType === CashierType.SENDING) {
      if (input.payer !== Payer.SENDER) {
        throw BadRequest('Sender cashier can only collect sender payments');
      }
      const senderAfter = senderPaidAlreadyPsw + amountPsw;
      if (senderAfter > senderExpectedPsw) {
        const remainingSenderPsw = Math.max(senderExpectedPsw - senderPaidAlreadyPsw, 0);
        throw BadRequest(
          `Sender cashier cannot collect more than sender allocation. Remaining sender amount is ${(remainingSenderPsw / 100).toFixed(2)} GHS`,
        );
      }
    }

    const principalAfter = parcelPrincipalPaidPsw + amountPsw;
    if (principalAfter > parcelChargePsw) {
      const remainingPsw = Math.max(parcelChargePsw - parcelPrincipalPaidPsw, 0);
      throw BadRequest(
        `Principal payment exceeds parcel charge. Remaining principal is ${(remainingPsw / 100).toFixed(2)} GHS`,
      );
    }
  }

  if (input.component === PaymentComponent.DELIVERY_FEE) {
    if (doorstepChargePsw <= 0) {
      throw BadRequest('Delivery fee payment is allowed only for doorstep delivery with a configured charge');
    }

    const deliveryFeeAfter = parcelDeliveryFeePaidPsw + amountPsw;
    if (deliveryFeeAfter > doorstepChargePsw) {
      const remainingPsw = Math.max(doorstepChargePsw - parcelDeliveryFeePaidPsw, 0);
      throw BadRequest(
        `Delivery fee payment exceeds configured doorstep charge. Remaining delivery fee is ${(remainingPsw / 100).toFixed(2)} GHS`,
      );
    }
  }

  if (parcelTotalPaidPsw + amountPsw > parcelAllowedTotalPsw) {
    const remainingPsw = Math.max(parcelAllowedTotalPsw - parcelTotalPaidPsw, 0);
    throw BadRequest(
      `Payment exceeds parcel total allowed amount. Remaining collectable amount is ${(remainingPsw / 100).toFixed(2)} GHS`,
    );
  }

  const tax =
    input.component === PaymentComponent.PRINCIPAL
      ? computeGhanaTaxesFromPesewas(grossPsw)
      : {
          principal: grossPsw,
          net: grossPsw,
          vat: 0n,
          getfund: 0n,
          nhil: 0n,
          covid: 0n,
          totalTax: 0n,
          residual: 0n,
        };

  const created = await createPaymentRepo({
    companyId: input.companyId,
    branchId: input.branchId,
    parcelId: input.parcelId,
    component: input.component,
    payer: input.payer,
    cashierType: input.cashierType,
    method: input.method,
    cashierUserId: input.cashierUserId,
    grossAmountPsw: Number(tax.principal),
    netAmountPsw: Number(tax.net),
    vatPsw: Number(tax.vat),
    getfundPsw: Number(tax.getfund),
    nhilPsw: Number(tax.nhil),
    covidPsw: Number(tax.covid),
    taxTotalPsw: Number(tax.totalTax),
    receivedAt: input.receivedAt ? new Date(input.receivedAt) : new Date(),
    notes: input.notes ?? null,
    receiptNo: input.receiptNo ?? null,
  });
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.cashierUserId,
    entityType: 'payment',
    entityId: created.id,
    action: 'PAYMENT_CREATED',
    message: 'Payment captured',
    metadata: {
      parcelId: input.parcelId,
      component: input.component,
      payer: input.payer,
      cashierType: input.cashierType,
      method: input.method,
      amountCedis: input.amountCedis,
      branchId: input.branchId,
    },
  });
  return {
    id: created.id,
    amounts: {
      grossPsw: Number(tax.principal),
      netPsw: Number(tax.net),
      vatPsw: Number(tax.vat),
      getfundPsw: Number(tax.getfund),
      nhilPsw: Number(tax.nhil),
      covidPsw: Number(tax.covid),
      taxTotalPsw: Number(tax.totalTax),
      grossCedis: Number(tax.principal) / 100,
      netCedis: Number(tax.net) / 100,
      vatCedis: Number(tax.vat) / 100,
      getfundCedis: Number(tax.getfund) / 100,
      nhilCedis: Number(tax.nhil) / 100,
      covidCedis: Number(tax.covid) / 100,
      taxTotalCedis: Number(tax.totalTax) / 100,
    },
  };
}

export async function listPaymentsForParcelSvc(parcelId: string): Promise<PaymentRow[]> {
  return listPaymentsForParcelRepo(parcelId);
}

export async function sumPrincipalPaidForParcelSvc(parcelId: string): Promise<number> {
  return sumPaymentsForParcelComponentRepo(parcelId, PaymentComponent.PRINCIPAL);
}
