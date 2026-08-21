import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { PickupOtpVerification } from './use-pickup-otp-verification';

type PhoneSlot = 'primary' | 'secondary';

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

type Props = {
  otp: PickupOtpVerification;
  receiverPhone?: string | null;
  receiverPhone2?: string | null;
  phoneSlot: PhoneSlot;
  onPhoneSlotChange: (slot: PhoneSlot) => void;
};

export function PickupOtpVerificationSection({
  otp,
  receiverPhone,
  receiverPhone2,
  phoneSlot,
  onPhoneSlotChange,
}: Props) {
  const remainingSeconds = useCountdownSeconds(otp.otpVerified ? null : otp.otpExpiresAt);
  const isExpired = Boolean(otp.otpSentAt) && remainingSeconds <= 0;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const hasSecondPhone = Boolean(receiverPhone2);
  const activePhone = phoneSlot === 'secondary' ? receiverPhone2 : receiverPhone;

  const handleSend = async () => {
    try {
      await otp.request(Boolean(otp.otpSentAt));
      toast.success('Collection OTP sent to the customer');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send collection OTP');
    }
  };

  const handleVerify = async () => {
    try {
      await otp.verify();
      toast.success('Customer presence confirmed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid collection OTP');
    }
  };

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label>Customer at Premises</Label>
          <p className="text-xs text-muted-foreground">
            Verify the customer&apos;s collection OTP before releasing the parcel.
          </p>
        </div>
        {otp.otpVerified ? (
          <Badge variant="outline" className="border-green-600 text-green-600">
            Verified
          </Badge>
        ) : null}
      </div>

      {otp.otpVerified ? (
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
                value={phoneSlot}
                onValueChange={(value) => {
                  if (value) onPhoneSlotChange(value as PhoneSlot);
                }}
              >
                <ToggleGroupItem value="primary">{receiverPhone || 'Phone 1'}</ToggleGroupItem>
                <ToggleGroupItem value="secondary">{receiverPhone2 || 'Phone 2'}</ToggleGroupItem>
              </ToggleGroup>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleSend()}
              disabled={otp.otpRequestPending || (Boolean(otp.otpSentAt) && !isExpired)}
            >
              {otp.otpRequestPending
                ? 'Sending...'
                : otp.otpSentAt
                  ? 'Resend OTP'
                  : 'Send Collection OTP'}
            </Button>
            {otp.otpSentAt ? (
              <span
                className={isExpired ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}
              >
                {isExpired
                  ? 'Code expired. Resend to try again.'
                  : `Expires in ${minutes}:${String(seconds).padStart(2, '0')}`}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                A 6-digit code will be sent to the main receiver
                {activePhone ? ` (${activePhone})` : ''}.
              </span>
            )}
          </div>

          {otp.otpSentAt && !isExpired ? (
            <div className="flex items-center gap-2">
              <Input
                value={otp.otpCode}
                onChange={(event) =>
                  otp.setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="Enter 6-digit OTP"
                inputMode="numeric"
                maxLength={6}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => void handleVerify()}
                disabled={otp.otpVerifyPending || otp.otpCode.length !== 6}
              >
                {otp.otpVerifyPending ? 'Verifying...' : 'Verify Customer'}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
