import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import {
  isOtpExceptionReason,
  OTP_AUTHORIZATION_WORKFLOW_LABELS,
  type OtpApprovalParcel,
  type OtpAuthorizationTarget,
  type OtpAuthorizationWorkflow,
} from '@/shared/shipments/receiver-otp-exception';
import { useAuthorizeParcelWithoutOtpMutation } from '../otp-authorization-api';

export type AuthorizePickupFormProps = {
  parcel: OtpApprovalParcel;
  onApproved: (message: string) => void;
  queueRequest?: { id: string; workflow: OtpAuthorizationWorkflow; target: OtpAuthorizationTarget };
};

export function useAuthorizePickupForm({
  parcel,
  onApproved,
  queueRequest,
}: AuthorizePickupFormProps) {
  const [selectedWorkflow, setWorkflow] = useState<OtpAuthorizationWorkflow>('receiver_cashier');
  const [handoverTarget, setTarget] = useState<OtpAuthorizationTarget>(
    queueRequest?.target ?? 'main',
  );
  const [reason, setReason] = useState('');
  const [authorize, { isLoading }] = useAuthorizeParcelWithoutOtpMutation();
  const collectorId = handoverTarget === 'main' ? parcel.receiverId : parcel.secondReceiverId;
  const workflow = queueRequest?.workflow ?? selectedWorkflow;
  const canApprove = !isLoading && !!collectorId && isOtpExceptionReason(reason);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canApprove || !collectorId) return;

    try {
      const approval = await authorize({
        id: parcel.id,
        workflow,
        handoverTarget,
        reason,
        expectedReceiverId: parcel.receiverId,
        expectedCollectorId: collectorId,
        expectedOtpRequestId: queueRequest?.id,
      }).unwrap();
      const until = new Date(approval.expiresAt).toLocaleTimeString();
      const screen = OTP_AUTHORIZATION_WORKFLOW_LABELS[workflow];
      onApproved(
        `Approved until ${until}. Ask the operator to select the approved collector and check admin approval in ${screen}.`,
      );
    } catch (error) {
      toast.error(getErrorMessage(error, '') || 'Unable to approve handover');
    }
  }

  return {
    workflow,
    setWorkflow,
    handoverTarget,
    setTarget,
    reason,
    setReason,
    isLoading,
    canApprove,
    submit,
  };
}
