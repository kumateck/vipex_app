import { ParcelHolderType, ParcelInternalTransferStatus } from '@/db/schemas/enums';
import type { ParcelInternalTransferRow } from '../../api/parcel.api';

export function holderTypeLabel(value: number) {
  switch (value) {
    case ParcelHolderType.BRANCH:
      return 'Main Branch';
    case ParcelHolderType.LOCATION:
      return 'Location';
    case ParcelHolderType.WAREHOUSE:
      return 'Warehouse';
    default:
      return `Holder ${value}`;
  }
}

export function transferStatusLabel(value: number) {
  switch (value) {
    case ParcelInternalTransferStatus.PENDING:
      return 'Pending';
    case ParcelInternalTransferStatus.ACKNOWLEDGED:
      return 'Acknowledged';
    case ParcelInternalTransferStatus.CANCELLED:
      return 'Cancelled';
    default:
      return `Status ${value}`;
  }
}

export function holderSummary(
  row: Pick<
    ParcelInternalTransferRow,
    | 'sourceHolderType'
    | 'sourceLocationName'
    | 'sourceWarehouseName'
    | 'destinationHolderType'
    | 'destinationLocationName'
    | 'destinationWarehouseName'
  >,
  side: 'source' | 'destination',
) {
  const type = side === 'source' ? row.sourceHolderType : row.destinationHolderType;
  const name =
    side === 'source'
      ? (row.sourceLocationName ?? row.sourceWarehouseName)
      : (row.destinationLocationName ?? row.destinationWarehouseName);
  return name ? `${holderTypeLabel(type)}: ${name}` : holderTypeLabel(type);
}
