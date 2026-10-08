export type {
  ParcelSearchRow,
  ParcelStorageClearanceRow,
  ParcelStorageClearanceDetail,
} from '../../../api/parcel.api';
export type StorageClearanceMode = 'history' | 'approvals' | 'execution';
export type StorageClearanceAction = 'approve' | 'reject' | 'return' | 'execute';

export type StorageClearanceCreateState = ReturnType<
  typeof import('../hooks').useStorageClearanceCreate
>;
