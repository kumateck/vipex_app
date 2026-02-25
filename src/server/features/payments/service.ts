import { BadRequest } from '../../utils/http-error';

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
  await assertActiveSessionSvc({
    cashierId: input.cashierUserId,
    branchId: input.branchId,
  });

  const grossPsw = toPesewas(input.amountCedis);

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
      grossPsw: tax.principal,
      netPsw: tax.net,
      vatPsw: tax.vat,
      getfundPsw: tax.getfund,
      nhilPsw: tax.nhil,
      covidPsw: tax.covid,
      taxTotalPsw: tax.totalTax,
    },
  };
}

export async function listPaymentsForParcelSvc(parcelId: string): Promise<PaymentRow[]> {
  return listPaymentsForParcelRepo(parcelId);
}

export async function sumPrincipalPaidForParcelSvc(parcelId: string): Promise<number> {
  return sumPaymentsForParcelComponentRepo(parcelId, PaymentComponent.PRINCIPAL);
}
