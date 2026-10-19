import { useState } from 'react';
import type { CompleteSelfServiceDraftInput, SelfServiceDraft } from '../types';
import { useParcelChargeAgents } from '@mobile/features/parcel-create/hooks';

export function useSelfServiceCompletionForm(
  draft: SelfServiceDraft,
  canComplete: boolean,
  onComplete: (input: CompleteSelfServiceDraftInput) => Promise<unknown>,
) {
  const [parcelDetails, setParcelDetails] = useState('');
  const [chargeCedis, setChargeCedis] = useState('');
  const [chargeAgentUserId, setChargeAgentUserId] = useState('');
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
  const valid = Boolean(
    destinationId &&
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
      pickupLocationId: draft.destinationLocationId,
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
