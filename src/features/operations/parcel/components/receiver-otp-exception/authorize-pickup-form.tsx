import { useId } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  MAX_OTP_EXCEPTION_REASON_LENGTH,
  OTP_AUTHORIZATION_MINUTES,
  type OtpAuthorizationTarget,
  type OtpAuthorizationWorkflow,
} from '@/shared/shipments/receiver-otp-exception';
import { useAuthorizePickupForm, type AuthorizePickupFormProps } from './hooks';

export function AuthorizePickupForm(props: AuthorizePickupFormProps) {
  const id = useId();
  const { parcel, queueRequest } = props;
  const {
    workflow,
    setWorkflow,
    handoverTarget,
    setTarget,
    reason,
    setReason,
    isLoading,
    canApprove,
    submit,
  } = useAuthorizePickupForm(props);

  return (
    <form className="grid gap-3" onSubmit={submit}>
      <p className="text-sm text-muted-foreground">
        Verify the collector’s identity and record how you verified it. Approval is valid once for{' '}
        {OTP_AUTHORIZATION_MINUTES} minutes.
      </p>
      {queueRequest ? null : (
        <>
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
        </>
      )}
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
      <Button type="submit" disabled={!canApprove}>
        {isLoading ? 'Approving…' : 'Approve without OTP'}
      </Button>
    </form>
  );
}
