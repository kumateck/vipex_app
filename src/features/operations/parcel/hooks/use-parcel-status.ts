import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { ParcelStatus } from '@/db/schemas/enums';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ParcelSearchRow,
  useRecordCallCenterContactMutation,
  useSearchParcelsQuery,
  useUpdateParcelMutation,
} from '../api/parcel.api';
import { canChangeCallOutcome } from '../components/parcel-status/utils';
import { useParcelCallOutcome } from './use-parcel-call-outcome';
import { useParcelBulkCallOutcome } from './use-parcel-bulk-call-outcome';
import { useParcelCallNotificationResend } from './use-parcel-call-notification-resend';

export function useParcelStatus() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;

  const [searchInput, setSearchInput] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [paymentType, setPaymentType] = useState<'all' | 'paid' | 'to_be_paid' | 'partial'>('all');
  const [selectedParcelIds, setSelectedParcelIds] = useState<Set<string>>(new Set());
  const [includeSavedOutcomes, setIncludeSavedOutcomes] = useState(false);
  const [updateParcel, { isLoading: isUpdatingParcel }] = useUpdateParcelMutation();
  const [recordContact, { isLoading: isRecordingContact }] = useRecordCallCenterContactMutation();
  const baseQuery = useMemo(
    () => ({
      page,
      pageSize,
      search: submittedSearch.trim().length > 0 ? submittedSearch.trim() : undefined,
    }),
    [page, pageSize, submittedSearch],
  );

  const arrivedQuery = useSearchParcelsQuery(
    {
      ...baseQuery,
      filters: {
        companyId,
        destinationId: branchId,
        statuses: [
          ParcelStatus.ARRIVED_AT_DESTINATION,
          ParcelStatus.RETURNED_TO_OFFICE,
          ParcelStatus.CUSTOMER_CONTACTED,
          ParcelStatus.AWAITING_PICKUP,
          ParcelStatus.HOME_DELIVERY_REQUESTED,
          ParcelStatus.ADDRESS_COLLECTED,
          ParcelStatus.DISPATCHED,
          ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
        ],
        assignedToCurrentUser: true,
        callCenterUncalledOnly: !includeSavedOutcomes,
        paymentType: paymentType === 'all' ? undefined : paymentType,
      },
    },
    { skip: !companyId || !branchId },
  );

  const rows = arrivedQuery.data?.data ?? [];

  const loading = arrivedQuery.isLoading;
  async function refreshQueues() {
    await arrivedQuery.refetch();
  }

  const handleTableRequestChange = (request: { page?: number; pageSize?: number }) => {
    setPage(request.page ?? 1);
    setPageSize(request.pageSize ?? 20);
  };

  const single = useParcelCallOutcome(refreshQueues);
  const resend = useParcelCallNotificationResend();
  const bulk = useParcelBulkCallOutcome(async () => {
    setSelectedParcelIds(new Set());
    await refreshQueues();
  });
  const isSaving =
    isUpdatingParcel || isRecordingContact || single.isSaving || bulk.isSaving || resend.isSaving;
  const toggleParcel = (id: string, checked: boolean) => {
    setSelectedParcelIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const selectAll = (checked: boolean) =>
    setSelectedParcelIds(
      checked
        ? new Set(
            rows
              .filter((row) => !row.callCenterCalledAt && canChangeCallOutcome(row.status))
              .map((row) => row.id),
          )
        : new Set(),
    );

  async function handleReturnToPickup(parcel: ParcelSearchRow) {
    try {
      await updateParcel({
        id: parcel.id,
        status: ParcelStatus.AWAITING_PICKUP,
      }).unwrap();

      toast.success('Parcel moved to Awaiting Pickup');
      await refreshQueues();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to move parcel to pickup');
    }
  }

  async function handleMarkCalled(parcel: ParcelSearchRow) {
    try {
      await recordContact({ id: parcel.id }).unwrap();
      toast.success('Call recorded');
      await refreshQueues();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to record call');
    }
  }

  return {
    single,
    bulk,
    resend,
    tableProps: {
      rows,
      loading,
      isSaving,
      companyId,
      branchId,
      searchInput,
      onSearchInputChange: setSearchInput,
      onSearchSubmit: () => {
        setSelectedParcelIds(new Set());
        setPage(1);
        setSubmittedSearch(searchInput.trim());
      },
      onCallOutcome: single.open,
      onResendNotification: resend.open,
      includeSavedOutcomes,
      onIncludeSavedOutcomesChange: (value: boolean) => {
        setIncludeSavedOutcomes(value);
        setPage(1);
        setSelectedParcelIds(new Set());
      },
      onReturnToPickup: handleReturnToPickup,
      onMarkCalled: handleMarkCalled,
      selectedParcelIds,
      onToggleParcel: toggleParcel,
      onSelectAll: selectAll,
      onBatchCallOutcome: () => bulk.open(rows.filter((row) => selectedParcelIds.has(row.id))),
      meta: arrivedQuery.data?.meta,
      onRequestChange: handleTableRequestChange,
      paymentType,
      onPaymentTypeChange: (value: typeof paymentType) => {
        setPage(1);
        setPaymentType(value);
        setSelectedParcelIds(new Set());
      },
    },
  };
}
