import { BadRequest, Forbidden } from '../../utils/http-error';

import { PaymentComponent, Payer, CashierType, PaymentMethod } from '@/db/schemas';
import { ParcelStatus } from '@/db/schemas/enums';
import { db } from '@/db/config';
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
import { updateParcelRepo } from '../shipments/parcels.repository';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

function getErrorCode(error: unknown, depth = 0): string | undefined {
  if (!error || typeof error !== 'object' || depth > 6) return undefined;
  const err = error as { code?: unknown; cause?: unknown };
  if (typeof err.code === 'string' && err.code.length > 0) return err.code;
  return getErrorCode(err.cause, depth + 1);
}

function serializeErrorChain(error: unknown, depth = 0): Array<Record<string, unknown>> {
  if (!error || typeof error !== 'object' || depth > 8) return [];
  const err = error as {
    name?: unknown;
    message?: unknown;
    code?: unknown;
    command?: unknown;
    detail?: unknown;
    hint?: unknown;
    schema?: unknown;
    table?: unknown;
    column?: unknown;
    constraint?: unknown;
    cause?: unknown;
  };

  const node: Record<string, unknown> = {
    depth,
    name: err.name,
    message: err.message,
    code: err.code,
    command: err.command,
    detail: err.detail,
    hint: err.hint,
    schema: err.schema,
    table: err.table,
    column: err.column,
    constraint: err.constraint,
  };

  return [node, ...serializeErrorChain(err.cause, depth + 1)];
}

function debugPaymentServiceError(
  scope: string,
  input: Record<string, unknown>,
  error: unknown,
): void {
  console.error(
    '[payments][debug]',
    JSON.stringify(
      {
        scope,
        input,
        errorCode: getErrorCode(error),
        errorChain: serializeErrorChain(error),
      },
      null,
      2,
    ),
  );
}

async function markParcelProcessedIfPending(
  parcelId: string,
  currentStatus: number,
  executor: DbExecutor,
): Promise<boolean> {
  if (currentStatus !== ParcelStatus.CREATED) return false;
  const updated = await updateParcelRepo(parcelId, { status: ParcelStatus.PROCESSED }, executor);
  return Boolean(updated);
}

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
  try {
    const result = await db.transaction(async (tx) => {
      if (!input.amountCedis && input.amountCedis !== 0) throw BadRequest('Amount is required');
      if (!input.companyId || !input.branchId || !input.cashierUserId) {
        throw BadRequest('Authenticated company, branch and cashier context are required');
      }

      const parcel = await getParcelSvc(input.parcelId, tx);
      if (parcel.companyId !== input.companyId) {
        throw BadRequest('Parcel does not belong to the authenticated company');
      }
      if (parcel.isDeleted) {
        throw BadRequest('Cannot collect payment for deleted parcel');
      }
      if (input.cashierType === CashierType.SENDING && parcel.sourceId !== input.branchId) {
        throw Forbidden(
          'Sender cashier can only collect payment for parcels created in their branch',
        );
      }

      await assertActiveSessionSvc({
        cashierId: input.cashierUserId,
        branchId: input.branchId,
        executor: tx,
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

      const settlement = await getParcelPaymentSettlement(input.parcelId, tx);
      const parcelPayments = await listPaymentsForParcelRepo(input.parcelId, tx);
      const parcelPrincipalPaidPsw = settlement.paidPrincipalPsw;
      const parcelDeliveryFeePaidPsw = settlement.paidDeliveryFeePsw;
      const parcelTotalPaidPsw = settlement.paidTotalPsw;
      const parcelChargePsw = settlement.requiredPrincipalPsw;
      const doorstepChargePsw = settlement.requiredDeliveryFeePsw;
      const parcelAllowedTotalPsw = settlement.requiredTotalPsw;
      const senderExpectedPsw = Math.max(
        Number(parcel.chargePsw ?? 0) - Number(parcel.plannedToBePaidPsw ?? 0),
        0,
      );
      const senderPaidAlreadyPsw = parcelPayments
        .filter(
          (payment) =>
            payment.component === PaymentComponent.PRINCIPAL && payment.payer === Payer.SENDER,
        )
        .reduce((sum, payment) => sum + Number(payment.grossAmountPsw ?? 0), 0);

      if (input.component === PaymentComponent.PRINCIPAL) {
        if (input.cashierType === CashierType.SENDING) {
          if (input.payer !== Payer.SENDER) {
            throw BadRequest('Sender cashier can only collect sender payments');
          }
          const senderAfter = senderPaidAlreadyPsw + amountPsw;
          if (senderAfter > senderExpectedPsw) {
            const remainingSenderPsw = Math.max(senderExpectedPsw - senderPaidAlreadyPsw, 0);
            const wasAutoProcessed =
              remainingSenderPsw === 0
                ? await markParcelProcessedIfPending(input.parcelId, parcel.status, tx)
                : false;
            if (wasAutoProcessed) {
              return {
                kind: 'autoProcessed' as const,
                response: {
                  id: `auto-processed:${input.parcelId}`,
                  amounts: {
                    grossPsw: 0,
                    netPsw: 0,
                    vatPsw: 0,
                    getfundPsw: 0,
                    nhilPsw: 0,
                    covidPsw: 0,
                    taxTotalPsw: 0,
                    grossCedis: 0,
                    netCedis: 0,
                    vatCedis: 0,
                    getfundCedis: 0,
                    nhilCedis: 0,
                    covidCedis: 0,
                    taxTotalCedis: 0,
                  },
                  message:
                    'Sender allocation is already fully paid. Parcel has been marked as PROCESSED.',
                },
              };
            }
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
        },
        tx,
      );

      return {
        kind: 'paymentCreated' as const,
        created,
        tax,
      };
    });

    if (result.kind === 'autoProcessed') {
      return result.response;
    }

    const { created, tax } = result;
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
  } catch (error) {
    debugPaymentServiceError('createPaymentSvc', input as Record<string, unknown>, error);
    throw error;
  }
}

export async function listPaymentsForParcelSvc(parcelId: string): Promise<PaymentRow[]> {
  return listPaymentsForParcelRepo(parcelId);
}

export async function sumPrincipalPaidForParcelSvc(parcelId: string): Promise<number> {
  return sumPaymentsForParcelComponentRepo(parcelId, PaymentComponent.PRINCIPAL);
}
