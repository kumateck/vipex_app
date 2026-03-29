import { toPesewas } from '@/server/utils/gh-money';
import { BadRequest } from '../../utils/http-error';

import { computeGhanaTaxesFromPesewas } from '../../utils/tax/ghana';
import {
  createBookingWithParcelsAndPaymentsRepo,
  type CreateBookingWithParcelsInput,
  type CreateBookingWithParcelsOutput,
} from './booking-with-parcels.repository';
import { PaymentMethod } from '@/db/schemas';
import { assertActiveSessionSvc } from '../cashiers/service';
import { recordAuditLog } from '../audit/logger';
import { getCustomerCreditSummarySvc, getCustomerSvc } from '../customers/service';
import {
  createParcelContentRepo,
  createParcelDetailRepo,
  findParcelContentByNameRepo,
  findParcelDetailByNameRepo,
  getParcelContentRepo,
} from '../parcel-masters/repository';

export type CreateBookingWithParcelsBody = {
  senderId: string;
  companyId: string;
  sourceId: string;
  status: number;
  createdBy: string;
  cashierSessionId?: string | null;
  bookingCode?: string | null;
  parcels: Array<{
    destinationId: string;
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
    cashierUserId: string;
    branchId: string;
  }>;
};

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

  const normalizedParcels = await linkParcelMastersAndNormalizeParcels(body);

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

  const hasImmediateSenderPayments = body.parcels.some(
    (parcel) => Number(parcel.senderPaymentCedis ?? 0) > 0,
  );

  let resolvedCashierSessionId: string | null = body.cashierSessionId ?? null;
  if (hasImmediateSenderPayments) {
    const activeSession = await assertActiveSessionSvc({
      cashierId: primaryParcel.cashierUserId,
      branchId: primaryParcel.branchId,
    });

    const hasMixedCashierOrBranch = body.parcels.some(
      (parcel) =>
        parcel.cashierUserId !== primaryParcel.cashierUserId ||
        parcel.branchId !== primaryParcel.branchId,
    );
    if (hasMixedCashierOrBranch) {
      throw BadRequest('All parcels in one booking must belong to the same cashier and branch');
    }

    resolvedCashierSessionId = body.cashierSessionId ?? activeSession.id;
  }

  const input: CreateBookingWithParcelsInput = {
    senderId: body.senderId,
    companyId: body.companyId,
    sourceId: body.sourceId,
    status: body.status,
    createdBy: body.createdBy,
    cashierSessionId: resolvedCashierSessionId,
    // bookingCode: body.bookingCode ?? null,
    parcels: normalizedParcels.map((p) => ({
      destinationId: p.destinationId,
      receiverId: p.receiverId,
      status: p.status,
      parcelDetails: p.parcelDetails,
      parcelContent: p.parcelContent,
      parcelValuePsw: p.parcelValueCedis != null ? Number(toPesewas(p.parcelValueCedis)) : 0,
      chargePsw:
        p.chargeCedis != null
          ? Number(toPesewas(p.chargeCedis))
          : Number(
              (p.senderPaymentCedis != null ? toPesewas(p.senderPaymentCedis) : 0n) +
                (p.plannedToBePaidCedis != null ? toPesewas(p.plannedToBePaidCedis) : 0n),
            ),
      plannedToBePaidPsw:
        p.plannedToBePaidCedis != null ? Number(toPesewas(p.plannedToBePaidCedis)) : 0,
      method: p.method,
      trackingCode: p.trackingCode ?? null,
      senderPaymentPsw: p.senderPaymentCedis != null ? Number(toPesewas(p.senderPaymentCedis)) : 0,
      senderPaymentMethod: p.senderPaymentMethod ?? undefined,
      cashierUserId: p.cashierUserId,
      branchId: p.branchId,
    })),
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

async function linkParcelMastersAndNormalizeParcels(body: CreateBookingWithParcelsBody) {
  const contentCache = new Map<string, { name: string; basePricePsw: number }>();
  const detailCache = new Map<string, { name: string }>();

  return Promise.all(
    body.parcels.map(async (parcel) => {
      const normalizedContent = parcel.parcelContent.trim();
      const normalizedDetails = parcel.parcelDetails.trim();
      let normalizedChargeCedis = parcel.chargeCedis;

      if (normalizedContent.length > 0) {
        const contentKey = normalizedContent.toLowerCase();
        let cachedContent = contentCache.get(contentKey);

        if (!cachedContent) {
          const existing = await findParcelContentByNameRepo(body.companyId, normalizedContent);
          if (existing) {
            const current = await getParcelContentRepo(body.companyId, existing.id);
            cachedContent = {
              name: current?.name ?? normalizedContent,
              basePricePsw: Number(current?.basePricePsw ?? 0),
            };
          } else {
            const chargePsw = Number(
              toPesewas(
                parcel.chargeCedis != null && String(parcel.chargeCedis).trim().length > 0
                  ? parcel.chargeCedis
                  : 0,
              ),
            );
            const created = await createParcelContentRepo({
              companyId: body.companyId,
              name: normalizedContent,
              description: null,
              basePricePsw: chargePsw,
              taxInclusive: true,
              active: true,
              sortOrder: 0,
              createdBy: body.createdBy,
            });
            if (created) {
              cachedContent = { name: normalizedContent, basePricePsw: chargePsw };
            }
          }

          if (cachedContent) {
            contentCache.set(contentKey, cachedContent);
          }
        }

        if (
          cachedContent &&
          (normalizedChargeCedis == null || String(normalizedChargeCedis).trim().length === 0)
        ) {
          normalizedChargeCedis = (cachedContent.basePricePsw / 100).toFixed(2);
        }
      }

      if (normalizedDetails.length > 0) {
        const detailsKey = normalizedDetails.toLowerCase();
        let cachedDetails = detailCache.get(detailsKey);

        if (!cachedDetails) {
          const existing = await findParcelDetailByNameRepo(body.companyId, normalizedDetails);
          if (existing) {
            cachedDetails = { name: normalizedDetails };
          } else {
            const created = await createParcelDetailRepo({
              companyId: body.companyId,
              name: normalizedDetails,
              description: null,
              active: true,
              sortOrder: 0,
              createdBy: body.createdBy,
            });
            if (created) {
              cachedDetails = { name: normalizedDetails };
            }
          }
          if (cachedDetails) detailCache.set(detailsKey, cachedDetails);
        }
      }

      return {
        ...parcel,
        parcelContent: normalizedContent,
        parcelDetails: normalizedDetails,
        chargeCedis: normalizedChargeCedis,
      };
    }),
  );
}
