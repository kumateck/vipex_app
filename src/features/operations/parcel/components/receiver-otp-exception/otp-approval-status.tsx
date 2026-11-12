import { Button } from '@/components/ui/button';
import type { PickupOtpAuthorization } from '@/shared/shipments/receiver-otp-exception';

export function OtpApprovalStatus({
  approval,
  onCheck,
  checking,
  disabled,
  error,
}: {
  approval: PickupOtpAuthorization | null;
  onCheck: () => void;
  checking: boolean;
  disabled: boolean;
  error: boolean;
}) {
  return (
    <div className="space-y-2 rounded-md border p-3 text-sm">
      <p role="status">
        {checking
          ? 'Checking for admin approval…'
          : error
            ? 'Unable to check for admin approval.'
            : approval
              ? `Admin approved handover without OTP until ${new Date(approval.expiresAt).toLocaleTimeString()}.`
              : 'No active admin approval for this collector.'}
      </p>
      <Button type="button" variant="outline" disabled={disabled || checking} onClick={onCheck}>
        Check admin approval
      </Button>
    </div>
  );
}
