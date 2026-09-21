import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { isTenDigitPhone, normalizePhoneDigits, phoneLengthMessage } from '@/lib/phone';
import { ParcelStatus } from '@/db/schemas/enums';
import { useCreateCustomerMutation } from '@/features/customers/api';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ParcelSearchRow,
  useSendParcelStatusCallNotificationMutation,
  useSearchParcelsQuery,
  useUpdateParcelMutation,
} from '../../api/parcel.api';
import { ParcelCallOutcomeDialog } from './parcel-call-outcome-dialog';
import { ParcelStatusTable } from './parcel-status-table';
import type { ContactOutcome } from './types';

export function ParcelStatusPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;

  const [searchInput, setSearchInput] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [selectedParcel, setSelectedParcel] = useState<ParcelSearchRow | null>(null);
  const [outcome, setOutcome] = useState<ContactOutcome>('follow_up');
  const [useSecondReceiver, setUseSecondReceiver] = useState(false);
  const [secondReceiverName, setSecondReceiverName] = useState('');
  const [secondReceiverPhone, setSecondReceiverPhone] = useState('');
  const [sendSms, setSendSms] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);

  const [updateParcel, { isLoading: isUpdatingParcel }] = useUpdateParcelMutation();
  const [createCustomer, { isLoading: isCreatingCustomer }] = useCreateCustomerMutation();
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
        ],
        assignedToCurrentUser: true,
      },
    },
    { skip: !companyId || !branchId },
  );

  const rows = useMemo(() => {
    const source = arrivedQuery.data?.data ?? [];
    return source.toSorted((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [arrivedQuery.data?.data]);

  const loading = arrivedQuery.isLoading;
  const isSaving = isUpdatingParcel || isCreatingCustomer || isSendingNotification;

  async function refreshQueues() {
    await arrivedQuery.refetch();
  }

  const openCallOutcome = (parcel: ParcelSearchRow) => {
    setSelectedParcel(parcel);
    setOutcome('follow_up');
    setUseSecondReceiver(false);
    setSecondReceiverName('');
    setSecondReceiverPhone('');
    setSendSms(true);
    setSendEmail(false);
  };

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

  async function handleSaveOutcome() {
    if (!selectedParcel) return;

    // 'follow_up' has no explicit branch — it maps to the CUSTOMER_CONTACTED
    // default below, same as before.
    let nextStatus: number = ParcelStatus.CUSTOMER_CONTACTED;
    if (outcome === 'pickup') nextStatus = ParcelStatus.AWAITING_PICKUP;
    if (outcome === 'delivery') nextStatus = ParcelStatus.HOME_DELIVERY_REQUESTED;

    let secondReceiverId = selectedParcel.secondReceiverId ?? null;

    if (useSecondReceiver) {
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
      const created = await createCustomer({
        fullname: name,
        telephone: phone,
      }).unwrap();
      secondReceiverId = created.id;
    }

    await updateParcel({
      id: selectedParcel.id,
      status: nextStatus,
      secondReceiverId,
    }).unwrap();

    if (sendSms || sendEmail) {
      const notification = await sendCallNotification({
        parcelId: selectedParcel.id,
        outcome,
        sendSms,
        sendEmail,
        includeSecondReceiver: useSecondReceiver || Boolean(secondReceiverId),
      }).unwrap();

      if (notification.failedCount > 0) {
        toast.warning(
          `Outcome saved. Notifications sent: ${notification.sentCount}, failed: ${notification.failedCount}.`,
        );
      } else {
        toast.success(`Outcome saved. Notifications sent: ${notification.sentCount}.`);
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
        onSearchSubmit={() => setSubmittedSearch(searchInput.trim())}
        onCallOutcome={openCallOutcome}
        onReturnToPickup={handleReturnToPickup}
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
        onClose={() => setSelectedParcel(null)}
        onSave={handleSaveOutcome}
      />
    </div>
  );
}
