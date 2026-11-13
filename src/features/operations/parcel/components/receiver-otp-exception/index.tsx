import { useState } from 'react';
import { useHasPermission } from '@/components/permissions/permission-guard';
import { Button } from '@/components/ui/button';
import { ParcelStatus } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import type { OtpApprovalParcel } from '@/shared/shipments/receiver-otp-exception';
import { AuthorizePickupForm } from './authorize-pickup-form';

export {
  useParcelOtpAuthorizationQuery,
  usePendingOtpApprovalsQuery,
} from './otp-authorization-api';
export { OtpApprovalStatus } from './otp-approval-status';
export { AuthorizePickupForm } from './authorize-pickup-form';

export function ParcelOtpApproval({
  parcel,
}: {
  parcel: OtpApprovalParcel & {
    status: number;
    confirmedAt?: string | Date | null;
    isDeleted?: boolean;
    hasPendingReceiverHandover?: boolean;
  };
}) {
  const allowed = useHasPermission(PermissionKeys.CanAuthorizePickupWithoutOtp);
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState('');
  if (
    !allowed ||
    parcel.status !== ParcelStatus.AWAITING_PICKUP ||
    parcel.confirmedAt ||
    parcel.isDeleted ||
    parcel.hasPendingReceiverHandover
  )
    return null;

  return (
    <div className="mt-4 space-y-3 rounded-md border p-3">
      <Button
        type="button"
        variant="outline"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? 'Close OTP approval' : 'Authorize pickup without OTP'}
      </Button>
      {message ? (
        <p className="text-sm" role="status">
          {message}
        </p>
      ) : null}
      {expanded ? (
        <AuthorizePickupForm
          parcel={parcel}
          onApproved={(result) => {
            setMessage(result);
            setExpanded(false);
          }}
        />
      ) : null}
    </div>
  );
}
