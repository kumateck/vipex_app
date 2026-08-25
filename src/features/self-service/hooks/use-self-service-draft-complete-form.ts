import { useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { sanitizeString } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import {
  CustomerType,
  useFindCustomersByTelephoneQuery,
  useGetCustomerByIdQuery,
} from '@/features/customers/api';
import { BranchType } from '@/db/schemas/enums';
import type { ParcelBookingFormValues } from '@/features/operations/parcel/components/parcel-create';
import type { SelfServiceDraft } from '../api/self-service-agent.api';

function buildFormValues(draft?: SelfServiceDraft): ParcelBookingFormValues {
  return {
    sender: {
      telephone: draft?.senderPhone ?? '',
      telephone2: draft?.senderPhone2 ?? '',
      customerId: '',
      fullname: draft?.senderFullname ?? '',
    },
    status: 0,
    parcels: [
      {
        destinationBranchId: draft?.destinationBranchId ?? '',
        destinationLocationId: draft?.destinationLocationId ?? '',
        destinationLocationName: '',
        parcelDetails: '',
        parcelContent: draft?.parcelContent ?? '',
        parcelValue: draft ? String(draft.parcelValuePsw / 100) : '0',
        charge: '',
        paymentResponsibility: 'SENDER',
        senderSettlementMode: 'PAY_NOW',
        senderPartialPayment: '',
        callSender: draft?.callSender ?? false,
        receiver: {
          telephone: draft?.receiverPhone ?? '',
          telephone2: draft?.receiverPhone2 ?? '',
          customerId: '',
          fullname: draft?.receiverFullname ?? '',
        },
      },
    ],
  };
}

export function useSelfServiceDraftCompleteForm(draft: SelfServiceDraft | undefined) {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const userBranchId = user?.branch?.id ?? '';

  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const destinationBranchOptions = branchOptions.filter(
    (branch) => branch.id !== userBranchId && branch.type !== BranchType.HEADOFFICE,
  );

  const { data: matchedSenders = [] } = useFindCustomersByTelephoneQuery(
    { telephone: draft?.senderPhone ?? '', limit: 1 },
    { skip: !draft?.senderPhone },
  );
  const matchedSenderId = matchedSenders[0]?.id ?? '';
  const { data: matchedSenderCustomer } = useGetCustomerByIdQuery(matchedSenderId, {
    skip: !matchedSenderId,
  });
  const senderIsCreditEligible =
    !!matchedSenderCustomer &&
    matchedSenderCustomer.customerType === CustomerType.Business &&
    matchedSenderCustomer.creditEligible;

  const form = useForm<ParcelBookingFormValues>({
    defaultValues: buildFormValues(),
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (draft) form.reset(buildFormValues(draft));
  }, [draft, form]);

  const { control, clearErrors, setValue } = form;
  const destinationBranchId = sanitizeString(
    useWatch({ control, name: 'parcels.0.destinationBranchId' }),
  );
  const destinationLocationId = sanitizeString(
    useWatch({ control, name: 'parcels.0.destinationLocationId' }),
  );
  const parcelChargeValue = sanitizeString(useWatch({ control, name: 'parcels.0.charge' }));
  const paymentResponsibility = sanitizeString(
    useWatch({ control, name: 'parcels.0.paymentResponsibility' }) ?? 'SENDER',
  );
  const senderSettlementMode = sanitizeString(
    useWatch({ control, name: 'parcels.0.senderSettlementMode' }) ?? 'PAY_NOW',
  );
  const previousBranchId = useRef(destinationBranchId);
  // The draft-driven reset above sets an initial destinationBranchId (the
  // customer's pick) - keep the "branch changed" ref in sync with it so that
  // reset doesn't look like a user-initiated branch change and wipe out the
  // prefilled location right after it's set.
  useEffect(() => {
    if (draft) previousBranchId.current = draft.destinationBranchId ?? '';
  }, [draft]);

  const { data: locationOptions = [], isLoading: isLoadingLocations } = useListLocationOptionsQuery(
    destinationBranchId && companyId ? { companyId, branchId: destinationBranchId } : undefined,
    { skip: !destinationBranchId || !companyId },
  );

  useEffect(() => {
    const senderPays = paymentResponsibility === 'SENDER';
    if ((!senderPays || !senderIsCreditEligible) && senderSettlementMode === 'CREDIT') {
      setValue('parcels.0.senderSettlementMode', 'PAY_NOW', { shouldDirty: true });
    }
  }, [paymentResponsibility, senderIsCreditEligible, senderSettlementMode, setValue]);

  useEffect(() => {
    if (previousBranchId.current === destinationBranchId) return;
    previousBranchId.current = destinationBranchId;
    setValue('parcels.0.destinationLocationId', '', { shouldDirty: true });
    setValue('parcels.0.destinationLocationName', '', { shouldDirty: true });
    clearErrors('parcels.0.destinationLocationId');
  }, [clearErrors, destinationBranchId, setValue]);

  useEffect(() => {
    if (
      !destinationBranchId ||
      isLoadingLocations ||
      locationOptions.length !== 1 ||
      destinationLocationId
    ) {
      return;
    }
    const onlyLocation = locationOptions[0];
    if (!onlyLocation) return;
    setValue('parcels.0.destinationLocationId', onlyLocation.id, { shouldDirty: true });
    setValue('parcels.0.destinationLocationName', onlyLocation.name, { shouldDirty: true });
    clearErrors('parcels.0.destinationLocationId');
  }, [
    clearErrors,
    destinationBranchId,
    destinationLocationId,
    isLoadingLocations,
    locationOptions,
    setValue,
  ]);

  const locationPlaceholder = !destinationBranchId
    ? 'Select destination branch first'
    : isLoadingLocations
      ? 'Loading locations...'
      : locationOptions.length
        ? 'Select location'
        : 'No locations available';

  return {
    form,
    control,
    clearErrors,
    setValue,
    destinationBranchId,
    destinationBranchOptions,
    locationOptions,
    isLoadingLocations,
    locationPlaceholder,
    paymentResponsibility,
    parcelChargeValue,
    senderIsCreditEligible,
  };
}
