import { EllipsisVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StickerCopiesInput } from '../parcel-receipt-print-controls/sticker-copies-input';
import { normalizeStickerCopies } from '../parcel-receipt-print-controls/sticker-copies';
import type { ParcelSearchRow } from '../../api/parcel.api';
import type { useParcelTransitWorkflow } from './use-parcel-transit-workflow';

export function ParcelTransitActions({
  parcel,
  workflow,
}: {
  parcel: ParcelSearchRow;
  workflow: ReturnType<typeof useParcelTransitWorkflow>;
}) {
  const {
    view,
    isUpdatingStatus,
    setSelectedParcelId,
    edit,
    refetch,
    stickerCopies,
    setStickerCopies,
    printOutgoing,
    setDiscrepancyParcel,
    setDiscrepancyDialogOpen,
    setDiscrepancyNotes,
    setMissingTrackingCode,
    setMissingBookingCode,
    setArrivalConfirmationParcel,
  } = workflow;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Parcel actions"
          size="icon"
          variant="outline"
          className="h-8 w-8"
          disabled={isUpdatingStatus}
        >
          <EllipsisVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setSelectedParcelId(parcel.id)}>
          {view === 'incoming' ? 'View Details & QR Code' : 'View Details'}
        </DropdownMenuItem>
        {view === 'incoming' ? (
          <DropdownMenuItem
            onClick={() => {
              edit.openEditDialog(parcel, refetch);
            }}
          >
            Edit
          </DropdownMenuItem>
        ) : null}
        {view === 'outgoing' ? (
          <>
            <div className="px-2 py-1.5" onKeyDown={(event) => event.stopPropagation()}>
              <StickerCopiesInput
                copies={stickerCopies}
                onChange={(copies) => setStickerCopies(normalizeStickerCopies(copies))}
              />
            </div>
            <DropdownMenuItem onClick={() => void printOutgoing(parcel, 'sticker', stickerCopies)}>
              Print Sticker
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void printOutgoing(parcel, 'invoice')}>
              Print Receipt
            </DropdownMenuItem>
          </>
        ) : null}
        {view === 'incoming' ? (
          <DropdownMenuItem
            onClick={() => {
              setDiscrepancyParcel(parcel);
              setDiscrepancyDialogOpen(true);
              setDiscrepancyNotes('');
              setMissingTrackingCode(parcel.trackingCode);
              setMissingBookingCode(parcel.bookingCode);
            }}
          >
            Log Not Physical
          </DropdownMenuItem>
        ) : null}
        {view === 'incoming' ? (
          <DropdownMenuItem onClick={() => setArrivalConfirmationParcel(parcel)}>
            Mark Arrived
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
