import { DeliveryMode } from '@/db/schemas/enums';
import {
  joinParts,
  money,
  payerLabel,
  paymentComponentLabel,
  paymentMethodLabel,
} from './parcel-history-format';
import type { ParcelHistoryDraft } from './parcel-history.types';
import type {
  listParcelConsignmentMovesRepo,
  listParcelDeliveryEventsRepo,
  listParcelPaymentEventsRepo,
} from './parcel-history-core.repository';

type Rows<T extends (...args: never[]) => unknown> = Awaited<ReturnType<T>>;
type Draft = ParcelHistoryDraft;

export type ParcelRecordSource = {
  id: string;
  sourceId: string;
  destinationId: string;
  createdAt: Date;
  createdBy: string | null;
  receivedAt: Date | null;
  receivedBy: string | null;
  confirmedAt: Date | null;
  confirmedBy: string | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
  deleteReason: string | null;
};

export function mapParcelRecord(
  parcel: ParcelRecordSource,
  opts: { hasArrivalEvent: boolean; hasDeletionEvent: boolean },
) {
  const drafts: Draft[] = [
    {
      id: 'parcel:created',
      occurredAt: parcel.createdAt,
      category: 'created',
      title: 'Parcel booked',
      actorId: parcel.createdBy,
      branchId: parcel.sourceId,
    },
  ];
  if (parcel.receivedAt && !opts.hasArrivalEvent) {
    drafts.push({
      id: 'parcel:received',
      occurredAt: parcel.receivedAt,
      category: 'custody',
      title: 'Received at destination',
      actorId: parcel.receivedBy,
      branchId: parcel.destinationId,
    });
  }
  if (parcel.confirmedAt) {
    drafts.push({
      id: 'parcel:confirmed',
      occurredAt: parcel.confirmedAt,
      category: 'delivery',
      title: 'Handover confirmed',
      actorId: parcel.confirmedBy,
      branchId: parcel.destinationId,
    });
  }
  if (parcel.isDeleted && parcel.deletedAt && !opts.hasDeletionEvent) {
    drafts.push({
      id: 'parcel:deleted',
      occurredAt: parcel.deletedAt,
      category: 'edit',
      title: 'Parcel deleted',
      description: parcel.deleteReason && `Reason: ${parcel.deleteReason}`,
      actorId: parcel.deletedBy,
    });
  }
  return drafts;
}

export function mapConsignmentMoves(rows: Rows<typeof listParcelConsignmentMovesRepo>) {
  return rows.flatMap((row): Draft[] => [
    {
      id: `consignment:${row.consignmentId}:added`,
      occurredAt: row.addedAt,
      category: 'custody',
      title: `Added to consignment ${row.code}`,
      actorId: row.createdBy,
      branchId: row.sourceId,
    },
    ...(row.arrivedAt
      ? [
          {
            id: `consignment:${row.consignmentId}:arrived`,
            occurredAt: row.arrivedAt,
            category: 'custody',
            title: `Scanned in from consignment ${row.code}`,
            actorId: row.arrivedBy,
            branchId: row.destinationId,
          } satisfies Draft,
        ]
      : []),
    ...(row.removedAt
      ? [
          {
            id: `consignment:${row.consignmentId}:removed`,
            occurredAt: row.removedAt,
            category: 'custody',
            title: `Removed from consignment ${row.code}`,
            branchId: row.sourceId,
          } satisfies Draft,
        ]
      : []),
  ]);
}

export function mapPayments(rows: Rows<typeof listParcelPaymentEventsRepo>) {
  return rows.flatMap((row): Draft[] => [
    {
      id: `payment:${row.id}:received`,
      occurredAt: row.receivedAt,
      category: 'payment',
      title: `Payment received ${money(row.grossAmountPsw)}`,
      description: joinParts([
        paymentComponentLabel(row.component),
        payerLabel(row.payer),
        paymentMethodLabel(row.method),
        row.receiptNo && `Receipt ${row.receiptNo}`,
      ]),
      actorId: row.cashierUserId,
      branchId: row.branchId,
    },
    ...(row.voidedAt
      ? [
          {
            id: `payment:${row.id}:voided`,
            occurredAt: row.voidedAt,
            category: 'payment',
            title: `Payment voided ${money(row.grossAmountPsw)}`,
            description: joinParts([
              row.receiptNo && `Receipt ${row.receiptNo}`,
              row.voidReason && `Reason: ${row.voidReason}`,
            ]),
            actorId: row.voidedBy,
            branchId: row.branchId,
          } satisfies Draft,
        ]
      : []),
  ]);
}

export function mapDeliveries(rows: Rows<typeof listParcelDeliveryEventsRepo>) {
  return rows.flatMap((row) => {
    const home = row.mode === DeliveryMode.DOORSTEP;
    const rider = { label: 'Rider', userId: row.riderUserId };
    const drafts: Draft[] = [
      {
        id: `delivery:${row.id}:created`,
        occurredAt: row.createdAt,
        category: 'delivery',
        title: home ? 'Home delivery set up' : 'Office delivery record created',
        description: joinParts([
          row.dropoffAddress && `Address: ${row.dropoffAddress}`,
          row.chargePsw > 0 && `Delivery fee ${money(row.chargePsw)}`,
        ]),
        actorId: row.createdBy,
      },
    ];
    const add = (
      key: string,
      at: Date | null,
      draft: Omit<Draft, 'id' | 'occurredAt' | 'category'>,
    ) => {
      if (at)
        drafts.push({
          id: `delivery:${row.id}:${key}`,
          occurredAt: at,
          category: 'delivery',
          ...draft,
        });
    };
    add('assigned', row.riderAssignedAt, { title: 'Rider assigned', subject: rider });
    add('receiver-called', row.receiverCalledConfirmedAt, {
      title: 'Receiver call confirmed',
      actorId: row.receiverCalledConfirmedBy,
    });
    add('rider-completed', row.riderCompletedAt, {
      title: 'Rider handed parcel to customer',
      actorId: row.riderUserId,
    });
    add('returned', row.returnedAt, {
      title: 'Rider returned parcel to office',
      actorId: row.riderUserId,
    });
    add('collection', row.riderCollectionRecordedAt, {
      title: 'Rider cash collection recorded',
      description: joinParts([
        `Parcel charge ${money(row.riderCollectedPrincipalPsw)}`,
        `Delivery fee ${money(row.riderCollectedDeliveryFeePsw)}`,
      ]),
      subject: rider,
    });
    add('delivered', row.deliveredAt, {
      title: home ? 'Delivered at home' : 'Delivered at office',
      subject: home ? rider : null,
    });
    add('confirmed', row.confirmedAt, { title: 'Delivery confirmed', actorId: row.confirmedBy });
    return drafts;
  });
}
