import { ParcelHolderType } from '@/db/schemas/enums';

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
