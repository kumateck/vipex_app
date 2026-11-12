import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import {
  isOtpExceptionReason,
  MAX_OTP_EXCEPTION_REASON_LENGTH,
  OTP_AUTHORIZATION_MINUTES,
  type OtpAuthorizationTarget,
  type OtpAuthorizationWorkflow,
} from '@/shared/shipments/receiver-otp-exception';
import { useAuthorizeParcelWithoutOtpMutation } from './otp-authorization-api';

export type ApprovalParcel = {
  id: string;
  receiverId: string;
  receiverNameSnapshot: string;
  secondReceiverId: string | null;
  secondReceiverNameSnapshot: string | null;
};

export function AuthorizePickupForm({
  parcel,
  onApproved,
}: {
  parcel: ApprovalParcel;
  onApproved: (message: string) => void;
}) {
  const id = useId();
  const [workflow, setWorkflow] = useState<OtpAuthorizationWorkflow>('receiver_cashier');
  const [handoverTarget, setTarget] = useState<OtpAuthorizationTarget>('main');
  const [reason, setReason] = useState('');
  const [authorize, { isLoading }] = useAuthorizeParcelWithoutOtpMutation();
  const collectorId = handoverTarget === 'main' ? parcel.receiverId : parcel.secondReceiverId;

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!collectorId || isLoading || !isOtpExceptionReason(reason)) return;
        try {
          const approval = await authorize({
            id: parcel.id,
            workflow,
            handoverTarget,
            reason,
            expectedReceiverId: parcel.receiverId,
            expectedCollectorId: collectorId,
          }).unwrap();
          const until = new Date(approval.expiresAt).toLocaleTimeString();
          const screen =
            workflow === 'receiver_cashier' ? 'Receiver Cashier' : 'Waiting for Pickup';
          onApproved(
            `Approved until ${until}. Ask the operator to select the approved collector and check admin approval in ${screen}.`,
          );
        } catch (error) {
          toast.error(getErrorMessage(error, '') || 'Unable to approve handover');
        }
      }}
    >
      <p className="text-sm text-muted-foreground">
        Verify the collector’s identity and record how you verified it. Approval is valid once for{' '}
        {OTP_AUTHORIZATION_MINUTES} minutes.
      </p>
      <Label htmlFor={`${id}-workflow`}>Workflow</Label>
      <select
        id={`${id}-workflow`}
        className="rounded-md border bg-background p-2 text-sm"
        value={workflow}
        onChange={(event) => setWorkflow(event.target.value as OtpAuthorizationWorkflow)}
      >
        <option value="receiver_cashier">Receiver Cashier</option>
        <option value="office_pickup">Waiting for Pickup</option>
      </select>
      <Label htmlFor={`${id}-collector`}>Collector</Label>
      <select
        id={`${id}-collector`}
        className="rounded-md border bg-background p-2 text-sm"
        value={handoverTarget}
        onChange={(event) => setTarget(event.target.value as OtpAuthorizationTarget)}
      >
        <option value="main">{parcel.receiverNameSnapshot || 'Main receiver'}</option>
        {parcel.secondReceiverId ? (
          <option value="second">{parcel.secondReceiverNameSnapshot || 'Second receiver'}</option>
        ) : null}
      </select>
      <Label htmlFor={`${id}-reason`}>Approval reason</Label>
      <Textarea
        id={`${id}-reason`}
        value={reason}
        disabled={isLoading}
        minLength={10}
        maxLength={MAX_OTP_EXCEPTION_REASON_LENGTH}
        onChange={(event) => setReason(event.target.value)}
      />
      <Button type="submit" disabled={isLoading || !collectorId || !isOtpExceptionReason(reason)}>
        {isLoading ? 'Approving…' : 'Approve without OTP'}
      </Button>
    </form>
  );
}
