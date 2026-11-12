import { AppButton, AppCard, AppLabel } from '@mobile/components/ui/mobile';
import type { usePickupOtpApproval } from '../../hooks/use-pickup-otp-approval';

export function PickupOtpExceptionSection({
  approval,
  disabled,
}: {
  approval: ReturnType<typeof usePickupOtpApproval>;
  disabled: boolean;
}) {
  return (
    <AppCard>
      {approval.approval ? (
        <AppLabel>
          Admin approved handover without OTP until{' '}
          {new Date(approval.approval.expiresAt).toLocaleTimeString()}.
        </AppLabel>
      ) : approval.checked ? (
        <AppLabel>No active admin approval for this collector.</AppLabel>
      ) : null}
      <AppButton
        title={approval.checking ? 'Checking…' : 'Check admin approval'}
        variant="secondary"
        disabled={disabled || approval.checking}
        onPress={() => void approval.check()}
      />
    </AppCard>
  );
}
