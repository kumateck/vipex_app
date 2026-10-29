import { useEffect, useState } from 'react';
import type { CompleteSelfServiceDraftInput, SelfServiceDraft } from '../types';
import { useParcelChargeAgents } from '@mobile/features/parcel-create/hooks';
import { listReceivingLocations } from '@mobile/features/parcel-create/services';
import type { LocationOption } from '@mobile/types/booking';
import { useAuth } from '@mobile/providers/auth-provider';

export function useSelfServiceCompletionForm(
  draft: SelfServiceDraft,
  canComplete: boolean,
  onComplete: (input: CompleteSelfServiceDraftInput) => Promise<unknown>,
) {
  const { session, withAuth } = useAuth();
  const companyId = session.user?.company?.id ?? session.user?.companyId;
  const [parcelDetails, setParcelDetails] = useState('');
  const [chargeCedis, setChargeCedis] = useState('');
  const [chargeAgentUserId, setChargeAgentUserId] = useState('');
  const [pickupLocationId, setPickupLocationId] = useState(draft.destinationLocationId ?? '');
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsFailed, setLocationsFailed] = useState(false);
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
  useEffect(() => {
    setPickupLocationId(draft.destinationLocationId ?? '');
  }, [draft.id, draft.destinationBranchId, draft.destinationLocationId]);

  useEffect(() => {
    setLocationOptions([]);
    setLocationsFailed(false);
    if (!canComplete || !companyId || !destinationId) return;
    let cancelled = false;
    setLocationsLoading(true);
    withAuth((token) => listReceivingLocations(token, { companyId, branchId: destinationId }))
      .then((options) => {
        if (cancelled) return;
        setLocationOptions(options);
        setPickupLocationId((current) =>
          options.some((location) => location.id === current) ? current : (options[0]?.id ?? ''),
        );
      })
      .catch(() => {
        if (!cancelled) setLocationsFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLocationsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [canComplete, companyId, destinationId, withAuth]);

  const valid = Boolean(
    destinationId &&
      locationOptions.some((location) => location.id === pickupLocationId) &&
      !locationsLoading &&
      !locationsFailed &&
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
