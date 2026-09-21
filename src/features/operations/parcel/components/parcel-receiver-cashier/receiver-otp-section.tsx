import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { useParcelReceiverCashierWorkflow } from './use-parcel-receiver-cashier-workflow';

type WorkflowDialog = ReturnType<typeof useParcelReceiverCashierWorkflow>['dialog'];

type ReceiverOtpSectionProps = {
  dialog: WorkflowDialog;
};

function useCountdownSeconds(expiresAt: string | null) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(0);
      return;
    }
    const target = new Date(expiresAt).getTime();
    const tick = () => setRemaining(Math.max(0, Math.round((target - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return remaining;
}

export function ReceiverOtpSection({ dialog }: ReceiverOtpSectionProps) {
  const remainingSeconds = useCountdownSeconds(dialog.otpVerified ? null : dialog.otpExpiresAt);
  const isExpired = Boolean(dialog.otpSentAt) && remainingSeconds <= 0;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const receiverPhone = dialog.selectedParcel?.receiverPhone;
  const receiverPhone2 = dialog.selectedParcel?.receiverPhone2;
  const hasSecondPhone = Boolean(receiverPhone2);
  const activePhone = dialog.phoneSlot === 'secondary' ? receiverPhone2 : receiverPhone;

  const handleSend = async () => {
    const isResend = Boolean(dialog.otpSentAt);
    try {
      await dialog.handleRequestOtp(isResend);
      toast.success(isResend ? 'Collection OTP resent to the customer' : 'Collection OTP sent');
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to send OTP');
    }
  };

  const handleVerify = async () => {
    try {
      await dialog.handleVerifyOtp();
      toast.success('Customer presence confirmed');
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Invalid OTP');
    }
  };

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <div>
          <Label>Customer at Premises</Label>
          <p className="text-xs text-muted-foreground">
            Verify the customer&apos;s collection OTP before releasing the parcel.
          </p>
        </div>
        {dialog.otpVerified ? (
          <Badge variant="outline" className="border-green-600 text-green-600">
            Verified
          </Badge>
        ) : null}
      </div>

      {dialog.otpVerified ? (
        <p className="text-xs text-muted-foreground">
          Customer presence confirmed with the one-time collection code.
        </p>
      ) : (
        <>
          {hasSecondPhone ? (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Send to which number? (main receiver has two on file)
              </Label>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={dialog.phoneSlot}
                onValueChange={(value) => {
                  if (value) dialog.setPhoneSlot(value as 'primary' | 'secondary');
                }}
              >
                <ToggleGroupItem value="primary">{receiverPhone || 'Phone 1'}</ToggleGroupItem>
                <ToggleGroupItem value="secondary">{receiverPhone2 || 'Phone 2'}</ToggleGroupItem>
              </ToggleGroup>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleSend()}
              disabled={dialog.otpRequestPending || dialog.otpVerifyPending}
            >
              {dialog.otpRequestPending
                ? 'Sending...'
                : dialog.otpSentAt
                  ? 'Resend OTP'
                  : 'Send OTP'}
            </Button>
            {dialog.otpSentAt ? (
              isExpired ? (
                <span className="text-xs text-destructive">Code expired. Resend to try again.</span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Expires in {minutes}:{String(seconds).padStart(2, '0')}
                </span>
              )
            ) : (
              <span className="text-xs text-muted-foreground">
                A 6-digit code will be sent to the main receiver
                {activePhone ? ` (${activePhone})` : ''}.
              </span>
            )}
          </div>

          {dialog.otpSentAt && !isExpired ? (
            <div className="flex items-center gap-2">
              <Input
                value={dialog.otpCode}
                onChange={(event) =>
                  dialog.setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="6-digit code"
                inputMode="numeric"
                maxLength={6}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => void handleVerify()}
                disabled={dialog.otpVerifyPending || dialog.otpCode.length !== 6}
              >
                {dialog.otpVerifyPending ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
