import { EllipsisVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getSavedParcelCallOutcome } from '@/shared/notification-hub';
import { ViewParcelDetailsMenuItem } from '@/features/operations/parcel-details';
import type { ParcelSearchRow } from '../../api/parcel.api';
import type { ParcelStatusTableProps } from '../../types';
import { canChangeCallOutcome, canReturnToPickup } from './utils';

type Props = Pick<
  ParcelStatusTableProps,
  'isSaving' | 'onCallOutcome' | 'onMarkCalled' | 'onReturnToPickup' | 'onResendNotification'
> & { parcel: ParcelSearchRow };

export function ParcelStatusRowActions({
  parcel,
  isSaving,
  onCallOutcome,
  onMarkCalled,
  onReturnToPickup,
  onResendNotification,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8"
          disabled={isSaving}
          aria-label={`Actions for ${parcel.bookingCode}`}
        >
          <EllipsisVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <ViewParcelDetailsMenuItem parcelId={parcel.id} />
        {getSavedParcelCallOutcome(parcel) ? (
          <DropdownMenuItem onClick={() => onResendNotification(parcel)}>
            Resend Notification
          </DropdownMenuItem>
        ) : null}
        {!parcel.callCenterCalledAt ? (
          <>
            {canChangeCallOutcome(parcel.status) ? (
              <DropdownMenuItem onClick={() => onCallOutcome(parcel)}>
                Call Outcome
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={() => void onMarkCalled(parcel)}>
              Mark as Called
            </DropdownMenuItem>
            {canReturnToPickup(parcel.status) ? (
              <DropdownMenuItem onClick={() => void onReturnToPickup(parcel)}>
                Return to Pickup
              </DropdownMenuItem>
            ) : null}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
