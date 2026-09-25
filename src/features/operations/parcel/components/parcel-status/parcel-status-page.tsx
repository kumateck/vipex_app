import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { isTenDigitPhone, normalizePhoneDigits, phoneLengthMessage } from '@/lib/phone';
import { ParcelStatus } from '@/db/schemas/enums';
import { useResolveSecondReceiverMutation } from '@/features/customers/api';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ParcelSearchRow,
  useSaveBulkCallOutcomeMutation,
  useRecordCallCenterContactMutation,
  useSendParcelStatusCallNotificationMutation,
  useSearchParcelsQuery,
  useUpdateParcelMutation,
} from '../../api/parcel.api';
import { ParcelCallOutcomeDialog } from './parcel-call-outcome-dialog';
import { ParcelBulkCallOutcomeDialog } from './parcel-bulk-call-outcome-dialog';
import { ParcelStatusTable } from './parcel-status-table';
import type { ContactOutcome } from './types';
import { useMainReceiverChange } from './use-main-receiver-change';
import { canChangeCallOutcome } from './utils';

export function ParcelStatusPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;

  const [searchInput, setSearchInput] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [selectedParcel, setSelectedParcel] = useState<ParcelSearchRow | null>(null);
  const [selectedParcelIds, setSelectedParcelIds] = useState<Set<string>>(new Set());
  const [batchParcels, setBatchParcels] = useState<ParcelSearchRow[] | null>(null);
  const [outcome, setOutcome] = useState<ContactOutcome>('follow_up');
  const [useSecondReceiver, setUseSecondReceiver] = useState(false);
  const [secondReceiverName, setSecondReceiverName] = useState('');
  const [secondReceiverPhone, setSecondReceiverPhone] = useState('');
  const [sendSms, setSendSms] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const mainReceiverChange = useMainReceiverChange(Boolean(selectedParcel));

  const [updateParcel, { isLoading: isUpdatingParcel }] = useUpdateParcelMutation();
  const [saveBulkCallOutcome, { isLoading: isSavingBulk }] = useSaveBulkCallOutcomeMutation();
  const [recordContact, { isLoading: isRecordingContact }] = useRecordCallCenterContactMutation();
  const [resolveSecondReceiver, { isLoading: isCreatingCustomer }] =
    useResolveSecondReceiverMutation();
  const [sendCallNotification, { isLoading: isSendingNotification }] =
    useSendParcelStatusCallNotificationMutation();

  const baseQuery = useMemo(
    () => ({
      page: 1,
      pageSize: 20,
      search: submittedSearch.trim().length > 0 ? submittedSearch.trim() : undefined,
    }),
    [submittedSearch],
  );

  const arrivedQuery = useSearchParcelsQuery(
    {
      ...baseQuery,
      filters: {
        companyId,
        destinationId: branchId,
        // Keep already-contacted parcels in the queue too — until a real
        // outcome (pickup/delivery) is chosen, staff still need to see and
        // act on them here rather than have them silently disappear.
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
        callCenterUncalledOnly: true,
      },
    },
    { skip: !companyId || !branchId },
  );

  const rows = useMemo(() => {
    const source = arrivedQuery.data?.data ?? [];
    return source
      .filter((parcel) => !parcel.callCenterCalledAt)
      .toSorted((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      });
  }, [arrivedQuery.data?.data]);

  const loading = arrivedQuery.isLoading;
  const isSaving =
    isUpdatingParcel ||
    isCreatingCustomer ||
    isSendingNotification ||
    isSavingBulk ||
    isRecordingContact ||
    mainReceiverChange.isSaving;

  async function refreshQueues() {
    await arrivedQuery.refetch();
  }

  const openCallOutcome = (parcel: ParcelSearchRow) => {
    setSelectedParcel(parcel);
    setOutcome(
      parcel.status === ParcelStatus.HOME_DELIVERY_REQUESTED
        ? 'delivery'
        : parcel.status === ParcelStatus.AWAITING_PICKUP
          ? 'pickup'
          : 'follow_up',
    );
    setUseSecondReceiver(false);
    setSecondReceiverName('');
    setSecondReceiverPhone('');
    setSendSms(true);
    setSendEmail(false);
    mainReceiverChange.reset();
  };

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
        ? new Set(rows.filter((row) => canChangeCallOutcome(row.status)).map((row) => row.id))
        : new Set(),
    );

  const openBatchCallOutcome = () => {
    const selected = rows.filter((row) => selectedParcelIds.has(row.id));
    if (selected.length === 0) return;
    setOutcome('follow_up');
    setBatchParcels(selected);
  };

  async function handleSaveBulkOutcome() {
    if (!batchParcels?.length) return;
    try {
      const result = await saveBulkCallOutcome({
        parcelIds: batchParcels.map((parcel) => parcel.id),
        outcome,
      }).unwrap();
      toast.success(`Outcome saved for ${result.updatedCount} parcel(s)`);
      setBatchParcels(null);
      setSelectedParcelIds(new Set());
      await refreshQueues();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to save bulk call outcomes');
    }
  }

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

  async function handleSaveOutcome() {
    if (!selectedParcel) return;

    let secondReceiverId = selectedParcel.secondReceiverId ?? null;

    if (useSecondReceiver && !mainReceiverChange.enabled) {
      const name = secondReceiverName.trim();
      const phone = normalizePhoneDigits(secondReceiverPhone);
      if (name.length === 0 || phone.length === 0) {
        toast.error('Second receiver name and telephone are required');
        return;
      }
      if (!isTenDigitPhone(phone)) {
        toast.error(phoneLengthMessage('Second receiver telephone'));
        return;
      }
      const created = await resolveSecondReceiver({
        fullname: name,
        telephone: phone,
      }).unwrap();
      secondReceiverId = created.id;
    }

    try {
      if (mainReceiverChange.enabled) {
        await mainReceiverChange.save({ parcelId: selectedParcel.id, outcome });
        secondReceiverId = null;
      } else {
        await recordContact({
          id: selectedParcel.id,
          outcome,
          secondReceiverId,
        }).unwrap();
      }
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to save call outcome');
      return;
    }

    if (sendSms || sendEmail) {
      try {
        const notification = await sendCallNotification({
          parcelId: selectedParcel.id,
          outcome,
          sendSms,
          sendEmail,
          includeSecondReceiver:
            !mainReceiverChange.enabled && (useSecondReceiver || Boolean(secondReceiverId)),
        }).unwrap();
        if (notification.failedCount > 0) {
          toast.warning(
            `Outcome saved. Notifications sent: ${notification.sentCount}, failed: ${notification.failedCount}.`,
          );
        } else {
          toast.success(`Outcome saved. Notifications sent: ${notification.sentCount}.`);
        }
      } catch (error) {
        toast.warning(
          `Outcome saved, but notification failed: ${getApplicationErrorMessage(error, '') || 'Please try again later'}`,
        );
      }
    } else {
      toast.success('Parcel contact outcome saved');
    }

    setSelectedParcel(null);
    await refreshQueues();
  }

  return (
    <div className="w-full space-y-4 p-4">
      <ParcelStatusTable
        rows={rows}
        loading={loading}
        isSaving={isSaving}
        companyId={companyId}
        branchId={branchId}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearchSubmit={() => {
          setSelectedParcelIds(new Set());
          setSubmittedSearch(searchInput.trim());
        }}
        onCallOutcome={openCallOutcome}
        onReturnToPickup={handleReturnToPickup}
        onMarkCalled={handleMarkCalled}
        selectedParcelIds={selectedParcelIds}
        onToggleParcel={toggleParcel}
        onSelectAll={selectAll}
        onBatchCallOutcome={openBatchCallOutcome}
      />

      <ParcelCallOutcomeDialog
        selectedParcel={selectedParcel}
        outcome={outcome}
        onOutcomeChange={setOutcome}
        useSecondReceiver={useSecondReceiver}
        onUseSecondReceiverChange={setUseSecondReceiver}
        secondReceiverName={secondReceiverName}
        onSecondReceiverNameChange={setSecondReceiverName}
        secondReceiverPhone={secondReceiverPhone}
        onSecondReceiverPhoneChange={setSecondReceiverPhone}
        sendSms={sendSms}
        onSendSmsChange={setSendSms}
        sendEmail={sendEmail}
        onSendEmailChange={setSendEmail}
        isSaving={isSaving}
        mainReceiverChange={mainReceiverChange}
        onClose={() => setSelectedParcel(null)}
        onSave={handleSaveOutcome}
      />
      <ParcelBulkCallOutcomeDialog
        parcels={batchParcels}
        outcome={outcome}
        onOutcomeChange={setOutcome}
        onClose={() => setBatchParcels(null)}
        onSave={handleSaveBulkOutcome}
        isSaving={isSavingBulk}
      />
    </div>
  );
}
