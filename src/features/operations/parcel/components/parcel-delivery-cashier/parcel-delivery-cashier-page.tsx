import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ParcelStatus, PaymentMethod } from '@/db/schemas/enums';
import { formatDateTime } from '@/lib/dates';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ParcelSearchRow,
  useFinalizeDoorstepAtOfficeMutation,
  useGetParcelDetailsQuery,
  useSearchParcelsQuery,
} from '../../api/parcel.api';
import { getOutstandingPrincipalPsw } from '../../utils';
import { ParcelSessionGuard } from '../parcel-session-guard';
import { DeliveryCashierTable } from './delivery-cashier-table';
import { FinalizeDeliveryDialog } from './finalize-delivery-dialog';

export function ParcelDeliveryCashierPage() {
  const user = useAuthStore((state) => state.user);
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
  const { data: details } = useGetParcelDetailsQuery(selectedParcel?.id ?? '', {
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

  const onFinalize = async () => {
    if (!selectedParcel || !companyId || !branchId) return;
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

  return (
    <div className="w-full space-y-4 p-4">
      <ParcelSessionGuard>
        <DeliveryCashierTable
          companyId={companyId}
          branchId={branchId}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearchSubmit={() => {
            const term = searchInput.trim();
            setQuery((prev) => ({
              ...prev,
              page: 1,
              search: term.length ? term : undefined,
            }));
          }}
          data={listQuery.data?.data ?? []}
          meta={listQuery.data?.meta}
          loading={listQuery.isLoading}
          onRequestChange={(next) =>
            setQuery((prev) => ({
              ...prev,
              ...next,
              search: prev.search,
              filters: {
                companyId,
                destinationId: branchId,
                status: ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
              },
            }))
          }
          onFinalize={setSelectedParcel}
        />

        <FinalizeDeliveryDialog
          parcel={selectedParcel}
          deliveryAddress={deliveryAddress}
          assignedRiderLabel={assignedRiderLabel}
          deliveryAtLabel={deliveryAtLabel}
          configuredDeliveryFeePsw={configuredDeliveryFeePsw}
          outstanding={outstanding}
          hasToBePaidOutstanding={hasToBePaidOutstanding}
          outstandingTotalPsw={outstandingTotalPsw}
          principalAmount={principalAmount}
          onPrincipalAmountChange={setPrincipalAmount}
          deliveryFeeAmount={deliveryFeeAmount}
          onDeliveryFeeAmountChange={setDeliveryFeeAmount}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          isFinalizing={isFinalizing}
          isFinalizeConfirmOpen={isFinalizeConfirmOpen}
          onFinalizeConfirmOpenChange={setIsFinalizeConfirmOpen}
          onClose={closeFinalizeDialog}
          onFinalize={onFinalize}
        />
      </ParcelSessionGuard>
    </div>
  );
}
