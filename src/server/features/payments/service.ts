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
import {
  computeTaxFromProfilePrincipalPsw,
  sumComponentByKey,
} from '@/server/utils/tax/profile-engine';
import { assertActiveSessionSvc } from '../cashiers/service';
import { recordAuditLog } from '../audit/logger';
import { getParcelStorageSettlementSvc, getParcelSvc } from '../shipments/parcels.service';
import {
  assertNoOutstandingStorageForHandover,
  assertValidStorageCollectionAmount,
} from '../shipments/storage-accrual-guards';
import {
  assertParcelFullyPaid,
  getParcelPaymentSettlement,
} from '../shipments/parcel-payment-settlement';
import { updateParcelRepo } from '../shipments/parcels.repository';
import { endPickupQueueForParcelSvc } from '../pickup-queues/service';
import { recordPaymentTaxJournalItemSvc } from '../accounting/service';
import { getActiveTaxProfileWithComponentsRepo } from '../accounting/repository';
import {
  assertReceiverOtpVerifiedSvc,
  consumeReceiverOtpTokenSvc,
} from '../parcel-receiver-otp/service';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;
const STORAGE_PAYMENT_NOTE_PREFIX = 'STORAGE_CHARGE';
export type PaymentCreateInput = {
  companyId: string;
  branchId: string;
  parcelId: string;
  component: PaymentComponent;
  payer: Payer;
  cashierType: CashierType;
  method: PaymentMethod;
  cashierUserId: string;
  amountCedis: number | string;
  receivedAt?: string;
  notes?: string | null;
  receiptNo?: string | null;
  momoTransactionId?: string | null;
};

type PaymentAmounts = {
  grossPsw: number;
  netPsw: number;
  vatPsw: number;
  getfundPsw: number;
  nhilPsw: number;
  covidPsw: number;
  taxTotalPsw: number;
  grossCedis: number;
  netCedis: number;
  vatCedis: number;
  getfundCedis: number;
  nhilCedis: number;
  covidCedis: number;
  taxTotalCedis: number;
};

export type PaymentCreateResponse = {
  id: string;
  amounts: PaymentAmounts;
  message?: string;
};

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

function toPaymentAmounts(tax: {
  principal: bigint;
  net: bigint;
  vat: bigint;
  getfund: bigint;
  nhil: bigint;
  covid: bigint;
  totalTax: bigint;
}): PaymentAmounts {
  return {
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
  };
}

function normalizeTaxKey(value: string) {
  return value
    .replace(/[\s_-]+/g, '')
    .trim()
    .toLowerCase();
}

async function computeProfileTaxBreakdown(input: {
  companyId: string;
  principalPsw: bigint;
  executor: DbExecutor;
  at?: Date;
}) {
  const activeProfile = await getActiveTaxProfileWithComponentsRepo(
    { companyId: input.companyId, at: input.at },
    input.executor,
  );

  if (!activeProfile || activeProfile.components.length === 0) {
    return {
      principal: input.principalPsw,
      net: input.principalPsw,
      vat: 0n,
      getfund: 0n,
      nhil: 0n,
      covid: 0n,
      totalTax: 0n,
      profileId: activeProfile?.profileId ?? null,
      profileName: activeProfile?.profileName ?? null,
    };
  }

  const breakdown = computeTaxFromProfilePrincipalPsw(input.principalPsw, activeProfile.components);
  const normalized = breakdown.components.map((component) => ({
    ...component,
    normalizedKey: normalizeTaxKey(component.key),
  }));
  const normalizedView = normalized.map((component) => ({
    key: component.normalizedKey,
    amountPsw: component.amountPsw,
  }));

  const vat = sumComponentByKey(normalizedView, 'vat');
  const getfund =
    sumComponentByKey(normalizedView, 'getfund') +
    sumComponentByKey(normalizedView, 'getfl') +
    sumComponentByKey(normalizedView, 'getfundlevy');
  const nhil =
    sumComponentByKey(normalizedView, 'nhil') + sumComponentByKey(normalizedView, 'nhillevy');
  const covid =
    sumComponentByKey(normalizedView, 'covid') +
    sumComponentByKey(normalizedView, 'covid19levy') +
    sumComponentByKey(normalizedView, 'covidlevy');

  return {
    principal: breakdown.principal,
    net: breakdown.net,
    vat,
    getfund,
    nhil,
    covid,
    totalTax: breakdown.totalTax,
    profileId: activeProfile.profileId,
    profileName: activeProfile.profileName,
  };
}

async function createPaymentCore(input: PaymentCreateInput, executor: DbExecutor) {
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

async function auditPaymentCreated(input: PaymentCreateInput, paymentId: string) {
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

export async function createPaymentWithExecutorSvc(
  input: PaymentCreateInput,
  executor: DbExecutor,
): Promise<PaymentCreateResponse> {
  const result = await createPaymentCore(input, executor);
  if (result.kind === 'paymentCreated') {
    await auditPaymentCreated(input, result.response.id);
  }
  return result.response;
}

export async function createPaymentSvc(input: PaymentCreateInput): Promise<PaymentCreateResponse> {
  try {
    return await db.transaction((tx) => createPaymentWithExecutorSvc(input, tx));
  } catch (error) {
    debugPaymentServiceError('createPaymentSvc', input as Record<string, unknown>, error);
    throw error;
  }
}

export async function collectSenderPaymentAndProcessSvc(input: {
  companyId: string;
  branchId: string;
  parcelId: string;
  method: PaymentMethod;
  cashierUserId: string;
  amountCedis?: number | string | null;
  momoTransactionId?: string | null;
}) {
  try {
    const hasAmount =
      input.amountCedis !== undefined &&
      input.amountCedis !== null &&
      Number(input.amountCedis) > 0;

    const result = await db.transaction(async (tx) => {
      const activeSession = await assertActiveSessionSvc({
        cashierId: input.cashierUserId,
        branchId: input.branchId,
        executor: tx,
      });

      let payment: PaymentCreateResponse | null = null;
      if (hasAmount) {
        const created = await createPaymentCore(
          {
            companyId: input.companyId,
            branchId: input.branchId,
            parcelId: input.parcelId,
            component: PaymentComponent.PRINCIPAL,
            payer: Payer.SENDER,
            cashierType: CashierType.SENDING,
            method: input.method,
            cashierUserId: input.cashierUserId,
            amountCedis: input.amountCedis as number | string,
            momoTransactionId: input.momoTransactionId ?? null,
          },
          tx,
        );
        payment = created.response;
      }

      const parcel = await getParcelSvc(input.parcelId, tx);
      let statusChanged = false;
      const patch: Partial<Parameters<typeof updateParcelRepo>[1]> = {};
      if (parcel.status === ParcelStatus.CREATED) {
        patch.status = ParcelStatus.PROCESSED;
      }
      if (!parcel.cashierSessionId) {
        patch.cashierSessionId = activeSession.id;
      }

      if (Object.keys(patch).length > 0) {
        const updated = await updateParcelRepo(input.parcelId, patch, tx);
        statusChanged = patch.status === ParcelStatus.PROCESSED && Boolean(updated);
      }

      return { payment, statusChanged };
    });

    if (result.payment && !result.payment.id.startsWith('auto-processed:')) {
      await auditPaymentCreated(
        {
          companyId: input.companyId,
          branchId: input.branchId,
          parcelId: input.parcelId,
          component: PaymentComponent.PRINCIPAL,
          payer: Payer.SENDER,
          cashierType: CashierType.SENDING,
          method: input.method,
          cashierUserId: input.cashierUserId,
          amountCedis: input.amountCedis as number | string,
        },
        result.payment.id,
      );
    }

    return {
      parcelId: input.parcelId,
      status: ParcelStatus.PROCESSED,
      statusChanged: result.statusChanged,
      payment: result.payment,
      message: result.payment?.message ?? 'Sender payment flow completed.',
    };
  } catch (error) {
    debugPaymentServiceError(
      'collectSenderPaymentAndProcessSvc',
      input as Record<string, unknown>,
      error,
    );
    throw error;
  }
}

export async function collectReceiverPaymentAndDeliverSvc(input: {
  companyId: string;
  branchId: string;
  parcelId: string;
  method: PaymentMethod;
  cashierUserId: string;
  confirmedBy: string;
  secondReceiverId?: string | null;
  cardId?: string | null;
  cardNumber?: string | null;
  secondCardId?: string | null;
  secondCardNumber?: string | null;
  amountCedis?: number | string | null;
  storageAmountCedis?: number | string | null;
  receiverOtpVerificationToken: string;
  receiverOtpTarget: 'main' | 'second';
  momoTransactionId?: string | null;
}) {
  try {
    const verifiedOtp = await assertReceiverOtpVerifiedSvc({
      parcelId: input.parcelId,
      targetReceiver: input.receiverOtpTarget,
      verificationToken: input.receiverOtpVerificationToken,
    });

    const hasAmount =
      input.amountCedis !== undefined &&
      input.amountCedis !== null &&
      Number(input.amountCedis) > 0;
    const hasStorageAmount =
      input.storageAmountCedis !== undefined &&
      input.storageAmountCedis !== null &&
      Number(input.storageAmountCedis) > 0;

    const result = await db.transaction(async (tx) => {
      let payment: PaymentCreateResponse | null = null;
      let storagePayment: PaymentCreateResponse | null = null;
      if (hasAmount) {
        const created = await createPaymentCore(
          {
            companyId: input.companyId,
            branchId: input.branchId,
            parcelId: input.parcelId,
            component: PaymentComponent.PRINCIPAL,
            payer: Payer.RECIPIENT,
            cashierType: CashierType.TOBEPAID,
            method: input.method,
            cashierUserId: input.cashierUserId,
            amountCedis: input.amountCedis as number | string,
            momoTransactionId: input.momoTransactionId ?? null,
          },
          tx,
        );
        payment = created.response;
      }

      const storageBefore = await getParcelStorageSettlementSvc(input.parcelId, tx);
      const storageAmountPsw = hasStorageAmount
        ? Number(toPesewas(input.storageAmountCedis as number | string))
        : 0;
      if (hasStorageAmount) {
        assertValidStorageCollectionAmount({
          outstandingPsw: storageBefore.outstandingPsw,
          collectionPsw: storageAmountPsw,
        });
      }
      if (hasStorageAmount) {
        const storagePaymentResult = await createPaymentCore(
          {
            companyId: input.companyId,
            branchId: input.branchId,
            parcelId: input.parcelId,
            component: PaymentComponent.OTHER,
            payer: Payer.RECIPIENT,
            cashierType: CashierType.TOBEPAID,
            method: input.method,
            cashierUserId: input.cashierUserId,
            amountCedis: input.storageAmountCedis as number | string,
            notes: `${STORAGE_PAYMENT_NOTE_PREFIX}: Receiver storage accrual payment`,
          },
          tx,
        );
        storagePayment = storagePaymentResult.response;
      }

      const storageAfter = await getParcelStorageSettlementSvc(input.parcelId, tx);
      assertNoOutstandingStorageForHandover(storageAfter.outstandingPsw);

      await assertParcelFullyPaid(input.parcelId, tx);
      await updateParcelRepo(
        input.parcelId,
        {
          status: ParcelStatus.DELIVERED_BY_OFFICE,
          confirmedBy: input.confirmedBy,
          confirmedAt: new Date(),
          secondReceiverId: input.secondReceiverId ?? null,
          cardId: input.cardId ?? null,
          cardNumber: input.cardNumber ?? null,
          secondCardId: input.secondCardId ?? null,
          secondCardNumber: input.secondCardNumber ?? null,
        },
        tx,
      );
      await endPickupQueueForParcelSvc(
        { parcelId: input.parcelId, endedBy: input.cashierUserId },
        tx,
      );

      return { payment, storagePayment, storageBefore, storageAfter };
    });

    await consumeReceiverOtpTokenSvc(verifiedOtp.id);

    if (result.payment && !result.payment.id.startsWith('auto-processed:')) {
      await auditPaymentCreated(
        {
          companyId: input.companyId,
          branchId: input.branchId,
          parcelId: input.parcelId,
          component: PaymentComponent.PRINCIPAL,
          payer: Payer.RECIPIENT,
          cashierType: CashierType.TOBEPAID,
          method: input.method,
          cashierUserId: input.cashierUserId,
          amountCedis: input.amountCedis as number | string,
        },
        result.payment.id,
      );
    }

    return {
      parcelId: input.parcelId,
      status: ParcelStatus.DELIVERED_BY_OFFICE,
      payment: result.payment,
      storagePayment: result.storagePayment,
      storageSettlement: result.storageAfter,
      message: 'Receiver cashier flow completed.',
    };
  } catch (error) {
    debugPaymentServiceError(
      'collectReceiverPaymentAndDeliverSvc',
      input as Record<string, unknown>,
      error,
    );
    throw error;
  }
}

export async function listPaymentsForParcelSvc(parcelId: string): Promise<PaymentRow[]> {
  return listPaymentsForParcelRepo(parcelId);
}

export async function sumPrincipalPaidForParcelSvc(parcelId: string): Promise<number> {
  return sumPaymentsForParcelComponentRepo(parcelId, PaymentComponent.PRINCIPAL);
}
