import { toPesewas } from '@/server/utils/gh-money';
import { BadRequest } from '../../utils/http-error';

import { computeGhanaTaxesFromPesewas } from '../../utils/tax/ghana';
import {
  createBookingWithParcelsAndPaymentsRepo,
  type CreateBookingWithParcelsInput,
  type CreateBookingWithParcelsOutput,
} from './booking-with-parcels.repository';
import { ParcelStatus, PaymentMethod, PaymentResponsibility } from '@/db/schemas';
import { assertActiveSessionSvc } from '../cashiers/service';
import { recordAuditLog } from '../audit/logger';
import { getCustomerCreditSummarySvc, getCustomerSvc } from '../customers/service';
import { getParcelChargeValidationError } from '@/shared/shipments/parcel-charge-policy';

export type CreateBookingWithParcelsBody = {
  senderId: string;
  companyId: string;
  sourceId: string;
  sourceLocationId?: string | null;
  status: number;
  createdBy: string;
  cashierSessionId?: string | null;
  bookingCode?: string | null;
  requireActiveCashierSession?: boolean;
  parcels: Array<{
    destinationId: string;
    pickupLocationId?: string | null;
    receiverId: string;
    status: number;
    parcelDetails: string;
    parcelContent: string;
    parcelValueCedis?: number | string | null;
    chargeCedis?: number | string | null;
    plannedToBePaidCedis?: number | string | null;
    method: PaymentMethod;
    trackingCode?: string | null;
    senderPaymentCedis?: number | string | null;
    senderPaymentMethod?: PaymentMethod;
    paymentResponsibility?: PaymentResponsibility;
    cashierUserId: string;
    branchId: string;
    callSender?: boolean;
  }>;
};

export function deferBookingToSenderCashier(
  body: CreateBookingWithParcelsBody,
): CreateBookingWithParcelsBody {
  return {
    ...body,
    status: ParcelStatus.CREATED,
    cashierSessionId: null,
    requireActiveCashierSession: false,
    parcels: body.parcels.map((parcel) => ({
      ...parcel,
      status: ParcelStatus.CREATED,
      method: PaymentMethod.CASH,
      senderPaymentCedis: 0,
      senderPaymentMethod: undefined,
    })),
  };
}

export async function createBookingWithParcelsSvc(
  body: CreateBookingWithParcelsBody,
): Promise<CreateBookingWithParcelsOutput> {
  if (
    !body.senderId ||
    !body.companyId ||
    !body.sourceId ||
    body.status == null ||
    !body.createdBy
  ) {
    throw BadRequest('Missing required booking fields');
  }
  if (!Array.isArray(body.parcels) || body.parcels.length === 0) {
    throw BadRequest('At least one parcel is required');
  }

  const normalizedParcels = normalizeParcels(body);

  normalizedParcels.forEach((parcel, index) => {
    const chargeCedis = Number(parcel.chargeCedis ?? 0);
    const plannedToBePaidCedis = Number(parcel.plannedToBePaidCedis ?? 0);
    const validationError = getParcelChargeValidationError({
      chargeCedis,
      plannedToBePaidCedis,
    });
    if (validationError) {
      throw BadRequest(`Parcel ${index + 1}: ${validationError}`);
    }

    const senderPaymentCedis = Number(parcel.senderPaymentCedis ?? 0);
    if (!Number.isFinite(senderPaymentCedis) || senderPaymentCedis < 0) {
      throw BadRequest(`Parcel ${index + 1}: Enter a valid sender payment amount`);
    }
    if (senderPaymentCedis + plannedToBePaidCedis > chargeCedis) {
      throw BadRequest(
        `Parcel ${index + 1}: Sender payment and receiver to-be-paid cannot exceed the parcel charge`,
      );
    }
  });

  const creditParcels = normalizedParcels.filter(
    (parcel) => parcel.method === PaymentMethod.CREDIT && Number(parcel.chargeCedis ?? 0) > 0,
  );

  if (creditParcels.length > 0) {
    const sender = await getCustomerSvc(body.senderId, body.companyId);
    if (!sender.creditEligible) {
      throw BadRequest('Sender is not eligible for credit booking');
    }

    const requestedCreditPsw = creditParcels.reduce(
      (sum, parcel) => sum + Number(toPesewas(parcel.chargeCedis ?? 0)),
      0,
    );
    if (requestedCreditPsw > 0) {
      const summary = await getCustomerCreditSummarySvc({
        customerId: body.senderId,
        companyId: body.companyId,
      });
      const hasLimit = summary.creditLimitPsw > 0;
      if (hasLimit && summary.balancePsw + requestedCreditPsw > summary.creditLimitPsw) {
        throw BadRequest('Credit limit exceeded for sender');
      }
    }
  }

  const primaryParcel = body.parcels[0];
  if (!primaryParcel?.cashierUserId || !primaryParcel?.branchId) {
    throw BadRequest('Cashier user and branch are required for parcel booking');
  }

  const hasMixedCashierOrBranch = body.parcels.some(
    (parcel) =>
      parcel.cashierUserId !== primaryParcel.cashierUserId ||
      parcel.branchId !== primaryParcel.branchId,
  );
  if (hasMixedCashierOrBranch) {
    throw BadRequest('All parcels in one booking must belong to the same cashier and branch');
  }

  const activeSession = body.requireActiveCashierSession
    ? await assertActiveSessionSvc({
        cashierId: primaryParcel.cashierUserId,
        branchId: primaryParcel.branchId,
      })
    : null;
  const resolvedCashierSessionId: string | null = activeSession
    ? (body.cashierSessionId ?? activeSession.id)
    : null;

  const input: CreateBookingWithParcelsInput = {
    senderId: body.senderId,
    companyId: body.companyId,
    sourceId: body.sourceId,
    sourceLocationId: body.sourceLocationId ?? null,
    status: body.status,
    createdBy: body.createdBy,
    cashierSessionId: resolvedCashierSessionId,
    // bookingCode: body.bookingCode ?? null,
    parcels: normalizedParcels.map((p) => {
      const chargePsw =
        p.chargeCedis != null
          ? Number(toPesewas(p.chargeCedis))
          : Number(
              (p.senderPaymentCedis != null ? toPesewas(p.senderPaymentCedis) : 0n) +
                (p.plannedToBePaidCedis != null ? toPesewas(p.plannedToBePaidCedis) : 0n),
            );
      const plannedToBePaidPsw =
        p.plannedToBePaidCedis != null ? Number(toPesewas(p.plannedToBePaidCedis)) : 0;
      // A cashier creating a parcel with nothing owed by the sender (fully receiver-pay,
      // or a split already covered) has no sender-cashier step left to do — skip straight
      // to PROCESSED. Non-cashier bookings still defer everything to Sender Payments.
      const status =
        body.requireActiveCashierSession &&
        p.status === ParcelStatus.CREATED &&
        chargePsw <= plannedToBePaidPsw
          ? ParcelStatus.PROCESSED
          : p.status;

      return {
        destinationId: p.destinationId,
        pickupLocationId: p.pickupLocationId ?? null,
        receiverId: p.receiverId,
        status,
        parcelDetails: p.parcelDetails,
        parcelContent: p.parcelContent,
        parcelValuePsw: p.parcelValueCedis != null ? Number(toPesewas(p.parcelValueCedis)) : 0,
        chargePsw,
        plannedToBePaidPsw,
        method: p.method,
        trackingCode: p.trackingCode ?? null,
        senderPaymentPsw:
          p.senderPaymentCedis != null ? Number(toPesewas(p.senderPaymentCedis)) : 0,
        senderPaymentMethod: p.senderPaymentMethod ?? undefined,
        cashierUserId: p.cashierUserId,
        branchId: p.branchId,
        callSender: p.callSender ?? false,
      };
    }),
  };

  const created = await createBookingWithParcelsAndPaymentsRepo(input, (psw) => {
    const t = computeGhanaTaxesFromPesewas(BigInt(psw));
    return {
      principal: Number(t.principal),
      net: Number(t.net),
      vat: Number(t.vat),
      getfund: Number(t.getfund),
      nhil: Number(t.nhil),
      covid: Number(t.covid),
      totalTax: Number(t.totalTax),
    };
  });

  await recordAuditLog({
    companyId: body.companyId,
    actorUserId: body.createdBy,
    entityType: 'booking',
    entityId: created.bookingId,
    action: 'BOOKING_WITH_PARCELS_CREATED',
    message: 'Booking with parcels created',
    metadata: {
      senderId: body.senderId,
      sourceId: body.sourceId,
      parcelsCount: body.parcels.length,
      paymentCount: created.payments.length,
    },
  });

  return created;
}

function normalizeParcels(body: CreateBookingWithParcelsBody) {
  return body.parcels.map((parcel, index) => {
    const normalizedContent = parcel.parcelContent.trim();
    const normalizedDetails = parcel.parcelDetails.trim();

    if (!normalizedDetails.length) {
      throw BadRequest(`Parcel details are required for parcel ${index + 1}`);
    }
    if (!normalizedContent.length) {
      throw BadRequest(`Parcel content is required for parcel ${index + 1}`);
    }
    if (normalizedDetails.length > 255) {
      throw BadRequest(`Parcel details must be 255 characters or less for parcel ${index + 1}`);
    }
    if (normalizedContent.length > 255) {
      throw BadRequest(`Parcel content must be 255 characters or less for parcel ${index + 1}`);
    }

    const paymentResponsibility =
      parcel.paymentResponsibility ??
      (Number(parcel.senderPaymentCedis ?? 0) > 0
        ? Number(parcel.plannedToBePaidCedis ?? 0) > 0
          ? PaymentResponsibility.SPLIT
          : PaymentResponsibility.SENDER
        : Number(parcel.plannedToBePaidCedis ?? 0) > 0
          ? PaymentResponsibility.RECIPIENT
          : PaymentResponsibility.SENDER);

    return {
      ...parcel,
      parcelContent: normalizedContent,
      parcelDetails: normalizedDetails,
      paymentResponsibility,
    };
  });
}
