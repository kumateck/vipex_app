import { lazy, Suspense } from 'react';
import { Label } from '@/components/ui/label';
import type { PickupOtpAuthorization } from '@/shared/shipments/receiver-otp-exception';
import { OtpApprovalStatus } from '../receiver-otp-exception';

const SignaturePad = lazy(() =>
  import('./pickup-collector-signature').then(({ PickupCollectorSignature }) => ({
    default: PickupCollectorSignature,
  })),
);

export function PickupOtpExceptionSection({
  approval,
  onCheck,
  checking,
  error,
  onSignatureChange,
  disabled,
}: {
  approval: PickupOtpAuthorization | null;
  onCheck: () => void;
  checking: boolean;
  error: boolean;
  onSignatureChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <>
      <OtpApprovalStatus
        approval={approval}
        onCheck={onCheck}
        checking={checking}
        error={error}
        disabled={disabled}
      />
      {approval ? (
        <div className="space-y-2">
          <Label>Collector signature</Label>
          <Suspense fallback={<p role="status">Loading signature pad…</p>}>
            <SignaturePad key={approval.id} onChange={onSignatureChange} disabled={disabled} />
          </Suspense>
        </div>
      ) : null}
    </>
  );
}
