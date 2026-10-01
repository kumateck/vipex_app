import { ParcelStatus } from '@/db/schemas/enums';
import { fromPesewas } from '@/server/utils/gh-money';
import { NotFound } from '@/server/utils/http-error';
import { getPublicParcelByTrackingRepo } from './public-tracking.repository';

const STATUS_LABELS: Record<number, string> = {
  [ParcelStatus.CREATED]: 'Created',
  [ParcelStatus.PROCESSED]: 'Processed',
  [ParcelStatus.IN_TRANSIT]: 'In transit',
  [ParcelStatus.ARRIVED_AT_DESTINATION]: 'Arrived at destination office',
  [ParcelStatus.CUSTOMER_CONTACTED]: 'Customer contacted',
  [ParcelStatus.AWAITING_PICKUP]: 'Awaiting pickup',
  [ParcelStatus.DELIVERED_BY_OFFICE]: 'Delivered at office',
  [ParcelStatus.HOME_DELIVERY_REQUESTED]: 'Home delivery requested',
  [ParcelStatus.ADDRESS_COLLECTED]: 'Delivery address collected',
  [ParcelStatus.DISPATCHED]: 'Dispatched for delivery',
  [ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER]: 'Given to customer',
  [ParcelStatus.DELIVERED_AT_HOME]: 'Delivered at home',
  [ParcelStatus.RETURNED_TO_OFFICE]: 'Returned to office',
  [ParcelStatus.RETURNED_TO_SENDER]: 'Returned to sender',
  [ParcelStatus.CANCELLED]: 'Cancelled',
  [ParcelStatus.DISCREPANCY]: 'Processing exception',
  [ParcelStatus.AGED_IN_WAREHOUSE]: 'Held in warehouse',
  [ParcelStatus.DISPOSED_BY_SALE]: 'Disposed by sale',
  [ParcelStatus.DISPOSED_BY_DESTRUCTION]: 'Disposed by destruction',
  [ParcelStatus.DISPOSED_BY_DONATION]: 'Disposed by donation',
  [ParcelStatus.RETURN_TO_SOURCE]: 'Returning to source',
};

type StatusEvent = { metadata: unknown; createdAt: Date };

function statusFromEvent(event: StatusEvent): number | null {
  if (!event.metadata || typeof event.metadata !== 'object') return null;
  const patch = (event.metadata as { patch?: { status?: unknown } }).patch;
  const status = patch?.status;
  return typeof status === 'number' && STATUS_LABELS[status] ? status : null;
}

function iso(date: Date | null): string | null {
  return date?.toISOString() ?? null;
}

export function toPublicTrackingResponse(
  row: Awaited<ReturnType<typeof getPublicParcelByTrackingRepo>>,
) {
  if (!row) return null;
  const statusEvents = row.events
    .map((event) => ({ status: statusFromEvent(event), occurredAt: event.createdAt }))
    .filter((event): event is { status: number; occurredAt: Date } => event.status !== null);
  const processedEvent = statusEvents.find((event) => event.status === ParcelStatus.PROCESSED);
  const sentEvent = statusEvents.find((event) => event.status === ParcelStatus.IN_TRANSIT);

  return {
    trackingCode: row.trackingCode,
    receiptCode: row.receiptCode,
    consignmentCode: row.consignmentCode,
    sourceBranch: row.sourceBranchName,
    destinationBranch: row.destinationBranchName,
    processingTime: iso(processedEvent?.occurredAt ?? row.createdAt),
    sentTime: iso(sentEvent?.occurredAt ?? row.sentAt),
    reachedDestinationAt: iso(row.receivedAt),
    sender: { name: row.senderName },
    receiver: { name: row.receiverName, secondName: row.secondReceiverName },
    packaging: row.parcelDetails,
    contents: row.parcelContent,
    parcelValueCedis: fromPesewas(BigInt(row.parcelValuePsw)),
    receiverToPayCedis: fromPesewas(BigInt(row.plannedToBePaidPsw)),
    senderPaidCedis: fromPesewas(
      BigInt(row.chargePsw) > BigInt(row.plannedToBePaidPsw)
        ? BigInt(row.chargePsw) - BigInt(row.plannedToBePaidPsw)
        : 0n,
    ),
    totalChargeCedis: fromPesewas(BigInt(row.chargePsw)),
    status: { code: row.status, label: STATUS_LABELS[row.status] ?? 'Unknown' },
    updatedAt: iso(row.updatedAt),
    timeline: [
      {
        status: ParcelStatus.CREATED,
        label: STATUS_LABELS[ParcelStatus.CREATED],
        occurredAt: iso(row.createdAt),
      },
      ...statusEvents.map((event) => ({
        status: event.status,
        label: STATUS_LABELS[event.status],
        occurredAt: iso(event.occurredAt),
      })),
      ...(row.receivedAt &&
      !statusEvents.some((event) => event.status === ParcelStatus.ARRIVED_AT_DESTINATION)
        ? [
            {
              status: ParcelStatus.ARRIVED_AT_DESTINATION,
              label: STATUS_LABELS[ParcelStatus.ARRIVED_AT_DESTINATION],
              occurredAt: iso(row.receivedAt),
            },
          ]
        : []),
    ],
  };
}

export async function getPublicParcelTrackingSvc(input: string) {
  const trackingCode = input.trim();
  const row = await getPublicParcelByTrackingRepo(trackingCode);
  if (!row) throw NotFound('Parcel not found for the supplied tracking code');
  return toPublicTrackingResponse(row);
}
