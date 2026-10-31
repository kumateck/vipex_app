import { useEffect, useState } from 'react';
import type { CompleteSelfServiceDraftInput, SelfServiceDraft } from '../types';
import {
  useParcelChargeAgents,
  useReceivingLocationOptions,
} from '@mobile/features/parcel-create/hooks';
import { getRequiredPickupLocationError } from '@/shared/shipments/pickup-location';
import { useAuth } from '@mobile/providers/auth-provider';

export function useSelfServiceCompletionForm(
  draft: SelfServiceDraft,
  canComplete: boolean,
  onComplete: (input: CompleteSelfServiceDraftInput) => Promise<unknown>,
) {
  const { session } = useAuth();
  const companyId = session.user?.company?.id ?? session.user?.companyId;
  const [parcelDetails, setParcelDetails] = useState('');
  const [chargeCedis, setChargeCedis] = useState('');
  const [chargeAgentUserId, setChargeAgentUserId] = useState('');
  const [pickupLocationId, setPickupLocationId] = useState(draft.destinationLocationId ?? '');
  const chargeAgents = useParcelChargeAgents('self-service', canComplete);
  const [paymentResponsibility, setPaymentResponsibility] = useState<
    'SENDER' | 'RECEIVER' | 'SPLIT'
  >('SENDER');
  const [senderPartialPaymentCedis, setSenderPartialPaymentCedis] = useState('');
  const [callSenderSelection, setCallSenderSelection] = useState<{
    draftId: string;
    value: boolean;
  } | null>(null);
  const callSender =
    callSenderSelection?.draftId === draft.id ? callSenderSelection.value : draft.callSender;
  const setCallSender = (value: boolean) => setCallSenderSelection({ draftId: draft.id, value });
  const destinationId = draft.destinationBranchId ?? '';
  const {
    locationOptions,
    isLoadingLocations: locationsLoading,
    locationsFailed,
    retryLocations,
  } = useReceivingLocationOptions(companyId, destinationId, canComplete);
  useEffect(() => {
    setPickupLocationId(draft.destinationLocationId ?? '');
  }, [draft.id, draft.destinationBranchId, draft.destinationLocationId]);

  useEffect(() => {
    if (
      locationsLoading ||
      locationsFailed ||
      locationOptions.some((location) => location.id === pickupLocationId)
    )
      return;
    setPickupLocationId(locationOptions.length === 1 ? locationOptions[0]!.id : '');
  }, [locationOptions, locationsLoading, locationsFailed, pickupLocationId]);
  const locationError = getRequiredPickupLocationError({
    destinationId,
    pickupLocationId,
    options: locationOptions,
    loading: locationsLoading,
    failed: locationsFailed,
  });

  const valid = Boolean(
    canComplete &&
      !locationError &&
      parcelDetails.trim() &&
      Number(chargeCedis) >= 0 &&
      !chargeAgents.loading &&
      !chargeAgents.failed &&
      chargeAgents.options.some((agent) => agent.value === chargeAgentUserId),
  );

  const submit = () => {
    if (!valid) return;
    return onComplete({
      id: draft.id,
      destinationId,
      pickupLocationId,
      parcelDetails: parcelDetails.trim(),
      chargeCedis,
      chargeAgentUserId,
      paymentResponsibility,
      senderSettlementMode: 'PAY_NOW',
      senderPartialPaymentCedis:
        paymentResponsibility === 'SPLIT' ? senderPartialPaymentCedis : null,
      callSender,
    });
  };
  return {
    parcelDetails,
    setParcelDetails,
    chargeCedis,
    setChargeCedis,
    pickupLocationId,
    setPickupLocationId,
    locationOptions,
    locationsLoading,
    locationsFailed,
    locationError,
    retryLocations,
    paymentResponsibility,
    setPaymentResponsibility,
    senderPartialPaymentCedis,
    setSenderPartialPaymentCedis,
    callSender,
    setCallSender,
    valid,
    submit,
    chargeAgent: {
      value: chargeAgentUserId,
      onChange: setChargeAgentUserId,
      options: chargeAgents.options,
      loading: chargeAgents.loading,
      failed: chargeAgents.failed,
      onRetry: chargeAgents.retry,
    },
  };
}
