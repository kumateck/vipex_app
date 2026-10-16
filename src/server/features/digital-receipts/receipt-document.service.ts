import {
  buildInvoiceA5Props,
  computeParcelReceiptTax,
} from '@/features/operations/parcel/utils/build-invoice-a5-props';
import { buildHomeDeliveryReceiptA5Props } from '@/features/operations/parcel/utils/build-home-delivery-receipt-props';
import { buildParcelTrackingUrl } from '@/features/operations/parcel/utils/tracking-url';
import type { ReceiptKind } from '@/shared/digital-receipts/channels';
import { BadRequest, NotFound } from '@/server/utils/http-error';
import { listPaymentsForParcelRepo } from '../payments/repository';
import { summarizeSenderReceiptPayments } from '../receipt-reprint/receipt-reprint-tax';
import { summarizeReceiverReceiptPayments } from '../receipt-reprint/receiver-receipt-payments';
import { buildHomeDeliveryReceiptSvc } from '../shipments/home-delivery-receipt.service';
import { getParcelRepo } from '../shipments/parcels.repository';
import {
  buildReceiverPaymentReceiptData,
  buildSenderReceiptData,
  summarizeReceiptData,
} from './receipt-data';
import { getParcelReceiptRowRepo } from './repository';
import type { ReceiptDocument } from './render/render-receipt-html';

export type ReceiptSummary = {
  amountPaidCedis: number;
  balanceCedis: number;
  destinationBranch: string;
  /** Pickup location, or the drop-off address for home delivery. */
  destinationLocation: string;
};

export type BuiltReceipt = {
  kind: ReceiptKind;
  bookingCode: string;
  issuedAt: string;
  summary: ReceiptSummary;
  document: ReceiptDocument;
};

async function buildInvoiceReceipt(
  companyId: string,
  parcelId: string,
  kind: Exclude<ReceiptKind, 'home_delivery'>,
): Promise<BuiltReceipt> {
  const [row, payments] = await Promise.all([
    getParcelReceiptRowRepo(companyId, parcelId),
    listPaymentsForParcelRepo(parcelId),
  ]);
  if (!row) throw NotFound('Parcel not found');

  let data;
  if (kind === 'receiver_payment') {
    const recorded = summarizeReceiverReceiptPayments(payments);
    if (!recorded || !row.confirmedAt) throw BadRequest('Recorded receiver payment is unavailable');
    data = buildReceiverPaymentReceiptData(row, recorded, {
      issuedAt: row.confirmedAt.toISOString(),
      // Card evidence identifies a second-receiver handover when it was recorded.
      receivedByName:
        row.secondCardId || row.secondCardNumber
          ? row.secondReceiverNameSnapshot
          : row.receiverNameSnapshot,
    });
  } else {
    data = buildSenderReceiptData(row, summarizeSenderReceiptPayments(payments));
  }

  const amountPaidCedis = data.amountPaidCedis ?? data.senderPaidCedis;
  return {
    kind,
    bookingCode: data.bookingCode,
    issuedAt: data.issuedAt,
    summary: summarizeReceiptData(data),
    document: {
      template: 'invoice-a5',
      props: buildInvoiceA5Props(data, {
        amountPaidCedis,
        tax: computeParcelReceiptTax(data),
        qrUrl: buildParcelTrackingUrl(data.trackingCode),
      }),
    },
  };
}

async function buildHomeDeliveryReceipt(
  companyId: string,
  parcelId: string,
  issuedAt: Date,
): Promise<BuiltReceipt> {
  const parcel = await getParcelRepo(parcelId);
  if (!parcel || parcel.isDeleted || parcel.companyId !== companyId) {
    throw NotFound('Parcel not found');
  }
  const receipt = await buildHomeDeliveryReceiptSvc(parcel, companyId);
  return {
    kind: 'home_delivery',
    bookingCode: receipt.bookingCode,
    issuedAt: issuedAt.toISOString(),
    summary: {
      amountPaidCedis: (receipt.paidPrincipalPsw + receipt.paidDeliveryFeePsw) / 100,
      balanceCedis: receipt.totalDuePsw / 100,
      destinationBranch: receipt.destinationName ?? '-',
      destinationLocation: receipt.dropoffAddress ?? '-',
    },
    document: {
      template: 'home-delivery-a5',
      props: buildHomeDeliveryReceiptA5Props(receipt, { issuedAt: issuedAt.toISOString() }),
    },
  };
}

/**
 * Builds the same receipt the counter prints, from current recorded data.
 * `issuedAt` is only used where the printed copy uses the print time
 * (home delivery); other receipts carry their recorded booking/payment time.
 */
export async function buildReceiptSvc(input: {
  companyId: string;
  parcelId: string;
  kind: ReceiptKind;
  issuedAt: Date;
}): Promise<BuiltReceipt> {
  if (input.kind === 'home_delivery') {
    return buildHomeDeliveryReceipt(input.companyId, input.parcelId, input.issuedAt);
  }
  return buildInvoiceReceipt(input.companyId, input.parcelId, input.kind);
}
