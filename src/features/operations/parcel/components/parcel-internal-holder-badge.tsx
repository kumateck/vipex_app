import { Badge } from '@/components/ui/badge';
import type { ParcelInternalHolderSnapshot, ParcelSearchRow } from '../api/parcel.api';

type HolderLike =
  | Pick<
      ParcelSearchRow,
      | 'currentHolderType'
      | 'currentHolderBranchName'
      | 'currentHolderLocationName'
      | 'currentHolderWarehouseName'
    >
  | ParcelInternalHolderSnapshot
  | null
  | undefined;

function holderTypeLabel(value: number | null | undefined) {
  if (value === 0) return 'Branch';
  if (value === 1) return 'Location';
  if (value === 2) return 'Warehouse';
  return null;
}

export function getParcelInternalHolderLabel(holder: HolderLike) {
  if (!holder) return null;
  const type = 'holderType' in holder ? holder.holderType : (holder.currentHolderType ?? null);
  if (type == null) return null;
  const branchName =
    'branchName' in holder ? holder.branchName : (holder.currentHolderBranchName ?? null);
  const locationName =
    'locationName' in holder ? holder.locationName : (holder.currentHolderLocationName ?? null);
  const warehouseName =
    'warehouseName' in holder ? holder.warehouseName : (holder.currentHolderWarehouseName ?? null);

  if (type === 2 && warehouseName) return `Warehouse: ${warehouseName}`;
  if (type === 1 && locationName) return `Location: ${locationName}`;
  if (type === 0 && branchName) return `Branch: ${branchName}`;

  const fallbackType = holderTypeLabel(type);
  return fallbackType ? `${fallbackType}: -` : null;
}

export function ParcelInternalHolderBadge({ holder }: { holder: HolderLike }) {
  const label = getParcelInternalHolderLabel(holder);
  if (!label) {
    return <Badge variant="secondary">Main Branch</Badge>;
  }

  return <Badge variant="secondary">{label}</Badge>;
}
