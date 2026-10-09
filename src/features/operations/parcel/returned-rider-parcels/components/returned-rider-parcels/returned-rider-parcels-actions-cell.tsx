import { EllipsisVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ParcelSearchRow } from '../../../api/parcel.api';

type ReturnedRiderParcelsActionsCellProps = {
  row: ParcelSearchRow;
  riderUserId: string;
  isBusy: boolean;
  onReprocess: (row: ParcelSearchRow, action: 'pickup' | 'redispatch') => void;
};

export function ReturnedRiderParcelsActionsCell({
  row,
  riderUserId,
  isBusy,
  onReprocess,
}: ReturnedRiderParcelsActionsCellProps) {
  const canRedispatch = Boolean(riderUserId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8"
          disabled={isBusy}
          aria-label={`Actions for ${row.bookingCode}`}
        >
          <EllipsisVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Reprocess</DropdownMenuLabel>
        <DropdownMenuItem disabled={isBusy} onClick={() => onReprocess(row, 'pickup')}>
          Move to Pickup
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isBusy || !canRedispatch}
          onClick={() => onReprocess(row, 'redispatch')}
        >
          Redispatch
        </DropdownMenuItem>
        {canRedispatch ? null : (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Select a rider above to redispatch
            </DropdownMenuLabel>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
