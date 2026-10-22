import { useParcelStatus } from '../../hooks';
import { ParcelCallOutcomeDialog } from './parcel-call-outcome-dialog';
import { ParcelBulkCallOutcomeDialog } from './parcel-bulk-call-outcome-dialog';
import { ParcelStatusTable } from './parcel-status-table';
import { ParcelCallNotificationResendDialog } from '../../dialogs';

export function ParcelStatusPage() {
  const { tableProps, single, bulk, resend } = useParcelStatus();
  return (
    <div className="w-full space-y-4 p-4">
      <ParcelStatusTable {...tableProps} />
      <ParcelCallOutcomeDialog {...single.dialogProps} />
      <ParcelBulkCallOutcomeDialog {...bulk.dialogProps} />
      <ParcelCallNotificationResendDialog {...resend.dialogProps} />
    </div>
  );
}
