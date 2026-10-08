import type { ParcelSearchRow } from '../../../api/parcel.api';
import type { PaginationMeta } from '@/server/types/pagination.types';

export type ShelfPickupParcel = Pick<
  ParcelSearchRow,
  | 'id'
  | 'bookingCode'
  | 'trackingCode'
  | 'receiverName'
  | 'receiverPhone'
  | 'parcelDetails'
  | 'storageChargePsw'
> & { pickerStaffId: string | null; pickerStaffName: string | null };
export type ShelfPickupList = { data: ShelfPickupParcel[]; meta: PaginationMeta };
export type ShelfPickupStaff = { id: string; fullname: string };
export type ShelfPickupScope = {
  companyId: string;
  branchId: string;
  locationId?: string | null;
  userId: string;
};
