import { BadRequest, Forbidden } from '../../../utils/http-error';
import { PaymentComponent, Payer, CashierType } from '@/db/schemas';
import { createPaymentRepo } from '../repository';
import { toPesewas } from '@/server/utils/gh-money';
import { assertActiveSessionSvc } from '../../cashiers/service';
import { recordAuditLog } from '../../audit/logger';
import { getParcelSvc } from '../../shipments/parcels.service';
import { getParcelPaymentSettlement } from '../../shipments/parcel-payment-settlement';
import { updateParcelRepo } from '../../shipments/parcels.repository';
import { recordPaymentTaxJournalItemSvc } from '../../accounting/service';
import type { DbExecutor, PaymentCreateInput } from '../types/payment.types';
import { toPaymentAmounts, computeProfileTaxBreakdown } from '../utils/payment-tax';
import { assertCreditPrincipalNotCollected } from '../utils';

export const STORAGE_PAYMENT_NOTE_PREFIX = 'STORAGE_CHARGE';

export async function createPaymentCore(input: PaymentCreateInput, executor: DbExecutor) {
  if (!input.amountCedis && input.amountCedis !== 0) throw BadRequest('Amount is required');
  if (!input.companyId || !input.branchId || !input.cashierUserId) {
    throw BadRequest('Authenticated company, branch and cashier context are required');
  }

  const parcel = await getParcelSvc(input.parcelId, executor);
  if (parcel.companyId !== input.companyId) {
    throw BadRequest('Parcel does not belong to the authenticated company');
  }
  if (parcel.isDeleted) {
    throw BadRequest('Cannot collect payment for deleted parcel');
  }
  assertCreditPrincipalNotCollected(parcel.method, input.component);
  if (input.cashierType === CashierType.SENDING && parcel.sourceId !== input.branchId) {
    throw Forbidden('Sender cashier can only collect payment for parcels created in their branch');
  }

  await assertActiveSessionSvc({
    cashierId: input.cashierUserId,
    branchId: input.branchId,
    executor,
  });

  const grossPsw = toPesewas(input.amountCedis);
  const amountPsw = Number(grossPsw);
  if (amountPsw <= 0) {
    throw BadRequest('Amount must be greater than 0');
  }
  const receivedAt = input.receivedAt ? new Date(input.receivedAt) : new Date();
  if (Number.isNaN(receivedAt.getTime())) {
    throw BadRequest('Invalid receivedAt datetime');
  }

  const settlement = await getParcelPaymentSettlement(input.parcelId, executor);
  const parcelPrincipalPaidPsw = settlement.paidPrincipalPsw;
  const parcelDeliveryFeePaidPsw = settlement.paidDeliveryFeePsw;
  const parcelTotalPaidPsw = settlement.paidTotalPsw;
  const parcelChargePsw = settlement.requiredPrincipalPsw;
  const doorstepChargePsw = settlement.requiredDeliveryFeePsw;
  const parcelAllowedTotalPsw = settlement.requiredTotalPsw;
  if (input.component === PaymentComponent.PRINCIPAL) {
    if (input.cashierType === CashierType.SENDING) {
      if (input.payer !== Payer.SENDER) {
        throw BadRequest('Sender cashier can only collect sender payments');
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
      throw BadRequest(
        'Delivery fee payment is allowed only for doorstep delivery with a configured charge',
      );
    }

    const deliveryFeeAfter = parcelDeliveryFeePaidPsw + amountPsw;
    if (deliveryFeeAfter > doorstepChargePsw) {
      const remainingPsw = Math.max(doorstepChargePsw - parcelDeliveryFeePaidPsw, 0);
      throw BadRequest(
        `Delivery fee payment exceeds configured doorstep charge. Remaining delivery fee is ${(remainingPsw / 100).toFixed(2)} GHS`,
      );
    }
  }

  if (
    input.component !== PaymentComponent.OTHER &&
    parcelTotalPaidPsw + amountPsw > parcelAllowedTotalPsw
  ) {
    const remainingPsw = Math.max(parcelAllowedTotalPsw - parcelTotalPaidPsw, 0);
    throw BadRequest(
      `Payment exceeds parcel total allowed amount. Remaining collectable amount is ${(remainingPsw / 100).toFixed(2)} GHS`,
    );
  }

  const tax =
    input.component === PaymentComponent.PRINCIPAL
      ? await computeProfileTaxBreakdown({
          companyId: input.companyId,
          principalPsw: grossPsw,
          executor,
          at: receivedAt,
        })
      : {
          principal: grossPsw,
          net: grossPsw,
          vat: 0n,
          getfund: 0n,
          nhil: 0n,
          covid: 0n,
          totalTax: 0n,
          residual: 0n,
          taxComponentKeys: [],
        };

  const created = await createPaymentRepo(
    {
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
      receivedAt,
      notes: input.notes ?? null,
      receiptNo: input.receiptNo ?? null,
      momoTransactionId: input.momoTransactionId ?? null,
    },
    executor,
  );

  if (input.component === PaymentComponent.PRINCIPAL) {
    const remainingPrincipalPsw = Math.max(
      parcelChargePsw - (parcelPrincipalPaidPsw + amountPsw),
      0,
    );
    await updateParcelRepo(
      input.parcelId,
      {
        plannedToBePaidPsw: remainingPrincipalPsw,
      },
      executor,
    );
  }

  if (input.component === PaymentComponent.PRINCIPAL && Number(tax.totalTax) > 0) {
    await recordPaymentTaxJournalItemSvc(
      {
        companyId: input.companyId,
        branchId: input.branchId,
        sourceId: created.id,
        postingDate: receivedAt,
        taxBasePsw: Number(tax.principal),
        taxTotalPsw: Number(tax.totalTax),
        vatPsw: Number(tax.vat),
        getfundPsw: Number(tax.getfund),
        nhilPsw: Number(tax.nhil),
        covidPsw: Number(tax.covid),
        recordedByUserId: input.cashierUserId,
      },
      executor,
    );
  }

  return {
    kind: 'paymentCreated' as const,
    response: {
      id: created.id,
      amounts: toPaymentAmounts(tax),
    },
  };
}

export async function auditPaymentCreated(input: PaymentCreateInput, paymentId: string) {
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.cashierUserId,
    entityType: 'payment',
    entityId: paymentId,
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
}
