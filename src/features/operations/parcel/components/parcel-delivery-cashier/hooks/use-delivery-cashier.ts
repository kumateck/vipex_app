import { useHomeDeliveryPickup } from '../../../home-delivery-pickup';
import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ParcelStatus, PaymentMethod } from '@/db/schemas/enums';
import { formatDateTime } from '@/lib/dates';
import { useAuthStore } from '@/stores/auth-store';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  type ParcelSearchRow,
  useFinalizeDoorstepAtOfficeMutation,
  useGetParcelDetailsQuery,
  useSearchParcelsQuery,
} from '../../../api/parcel.api';
import { getOutstandingPrincipalPsw } from '../../../utils';
import type { PaginationRequestDto } from '@/server/types/pagination.types';

export function useDeliveryCashier() {
  const { onReturnToPickup, isReturningToPickup } = useHomeDeliveryPickup();
  const user = useAuthStore((state) => state.user);
  const canManageSecondReceivers = (user?.permissions ?? []).includes(
    PermissionKeys.CanManageParcelSecondReceiver,
  );
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;
  const cashierUserId = user?.id ?? '';

  const [searchInput, setSearchInput] = useState('');
  const [selectedParcel, setSelectedParcel] = useState<ParcelSearchRow | null>(null);
  const [isFinalizeConfirmOpen, setIsFinalizeConfirmOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>(String(PaymentMethod.CASH));
  const [principalAmount, setPrincipalAmount] = useState('');
  const [deliveryFeeAmount, setDeliveryFeeAmount] = useState('');
  const [query, setQuery] = useState<{
    page?: number;
    pageSize?: number;
    search?: string;
    sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
    filters?: { companyId?: string | null; destinationId?: string | null; status?: number | null };
  }>({
    page: 1,
    pageSize: 20,
    filters: {
      companyId,
      destinationId: branchId,
      status: ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
    },
  });

  const listQuery = useSearchParcelsQuery(query, { skip: !companyId || !branchId });
  const {
    currentData: details,
    isFetching: isRefreshing,
    isError: hasDetailsError,
  } = useGetParcelDetailsQuery(selectedParcel?.id ?? '', {
    skip: !selectedParcel?.id,
  });
  const [finalizeAtOffice, { isLoading: isFinalizing }] = useFinalizeDoorstepAtOfficeMutation();

  const deliveryAddress =
    details?.delivery?.dropoffAddress ?? selectedParcel?.dropoffAddress ?? '-';
  const configuredDeliveryFeePsw =
    (details?.delivery?.chargePsw ?? selectedParcel?.deliveryFeePsw ?? 0) > 0
      ? (details?.delivery?.chargePsw ?? selectedParcel?.deliveryFeePsw ?? 0)
      : 0;

  useEffect(() => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      filters: {
        companyId,
        destinationId: branchId,
        status: ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
      },
    }));
  }, [companyId, branchId]);

  const outstanding = useMemo(() => {
    if (!details) return { principalPsw: 0, deliveryFeePsw: 0 };
    const deliveryFeePaid = details.payments
      .filter((payment) => payment.component === 1)
      .reduce((sum, payment) => sum + payment.grossAmountPsw, 0);
    return {
      principalPsw: getOutstandingPrincipalPsw(details.parcel.chargePsw, details.payments),
      deliveryFeePsw: Math.max((details.delivery?.chargePsw ?? 0) - deliveryFeePaid, 0),
    };
  }, [details]);

  const hasToBePaidOutstanding = outstanding.principalPsw > 0;
  const outstandingTotalPsw = outstanding.principalPsw + outstanding.deliveryFeePsw;
  const assignedRiderLabel = selectedParcel?.riderName ?? 'Unassigned';

  useEffect(() => {
    if (!selectedParcel) return;
    setPrincipalAmount((outstanding.principalPsw / 100).toFixed(2));
    setDeliveryFeeAmount((outstanding.deliveryFeePsw / 100).toFixed(2));
  }, [selectedParcel, outstanding]);

  const deliveryAtLabel =
    details?.delivery?.deliveredAt || selectedParcel?.confirmedAt
      ? formatDateTime(details?.delivery?.deliveredAt ?? selectedParcel?.confirmedAt ?? '')
      : '-';

  const onSearch = useCallback(() => {
    const term = searchInput.trim();
    setQuery((previous) => ({ ...previous, page: 1, search: term.length ? term : undefined }));
  }, [searchInput]);
  const onRequestChange = useCallback(
    (
      next: PaginationRequestDto<{
        companyId?: string | null;
        destinationId?: string | null;
        status?: number | null;
      }>,
    ) => {
      setQuery((previous) => ({
        ...previous,
        ...next,
        search: previous.search,
        filters: {
          companyId,
          destinationId: branchId,
          status: ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
        },
      }));
    },
    [companyId, branchId],
  );

  const onFinalize = async () => {
    if (!selectedParcel || !companyId || !branchId || isRefreshing || hasDetailsError || !details)
      return;
    try {
      await finalizeAtOffice({
        parcelId: selectedParcel.id,
        cashierUserId,
        branchId,
        companyId,
        principalAmountCedis: Number(principalAmount) > 0 ? principalAmount : null,
        deliveryFeeAmountCedis: Number(deliveryFeeAmount) > 0 ? deliveryFeeAmount : null,
        method: Number(paymentMethod),
      }).unwrap();
      toast.success('Delivery finalized and marked DELIVERED_AT_HOME');
      setIsFinalizeConfirmOpen(false);
      setSelectedParcel(null);
      await listQuery.refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to finalize');
    }
  };

  const closeFinalizeDialog = () => {
    setIsFinalizeConfirmOpen(false);
    setSelectedParcel(null);
  };

  return {
    canManageSecondReceivers,
    companyId,
    branchId,
    searchInput,
    setSearchInput,
    onSearch,
    onRequestChange,
    listQuery,
    selectedParcel,
    setSelectedParcel,
    deliveryAddress,
    assignedRiderLabel,
    deliveryAtLabel,
    configuredDeliveryFeePsw,
    outstanding,
    hasToBePaidOutstanding,
    outstandingTotalPsw,
    principalAmount,
    setPrincipalAmount,
    deliveryFeeAmount,
    setDeliveryFeeAmount,
    paymentMethod,
    setPaymentMethod,
    isFinalizing,
    isRefreshing: isRefreshing || hasDetailsError || !details,
    isFinalizeConfirmOpen,
    setIsFinalizeConfirmOpen,
    closeFinalizeDialog,
    onFinalize,
    onReturnToPickup,
    isReturningToPickup,
  };
}
