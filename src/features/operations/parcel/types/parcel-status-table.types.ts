import type { ParcelSearchRow } from '../api/parcel.api';
import type { PaginationMeta, PaginationRequestDto } from '@/server/types/pagination.types';
import type { PaymentType } from '../components/parcel-status/payment-type-filter';

export type ParcelStatusTableProps = {
  rows: ParcelSearchRow[];
  loading: boolean;
  isSaving: boolean;
  companyId: string | null;
  branchId: string | null;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: () => void;
  includeSavedOutcomes: boolean;
  onIncludeSavedOutcomesChange: (value: boolean) => void;
  onResendNotification: (parcel: ParcelSearchRow) => void;
  onCallOutcome: (parcel: ParcelSearchRow) => void;
  onReturnToPickup: (parcel: ParcelSearchRow) => Promise<void>;
  onMarkCalled: (parcel: ParcelSearchRow) => Promise<void>;
  selectedParcelIds: Set<string>;
  onToggleParcel: (parcelId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onBatchCallOutcome: () => void;
  meta?: PaginationMeta;
  onRequestChange: (request: PaginationRequestDto) => void;
  paymentType: PaymentType;
  onPaymentTypeChange: (value: PaymentType) => void;
};
