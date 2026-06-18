import { useState } from 'react';
import { EllipsisVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProcessedParcel } from '../../api/parcel.api';

type ParcelReprintActionsProps = {
  parcel: ProcessedParcel;
  onEdit: (parcel: ProcessedParcel) => void;
  onReprintReceipt: (parcel: ProcessedParcel) => void;
  onReprintSticker: (parcel: ProcessedParcel, copies: number) => void;
};

const MIN_STICKER_COPIES = 1;
const MAX_STICKER_COPIES = 20;

function clampStickerCopies(value: number) {
  if (!Number.isFinite(value)) return MIN_STICKER_COPIES;
  return Math.min(Math.max(Math.trunc(value), MIN_STICKER_COPIES), MAX_STICKER_COPIES);
}

export function ParcelReprintActions({
  parcel,
  onEdit,
  onReprintReceipt,
  onReprintSticker,
}: ParcelReprintActionsProps) {
  const [stickerCopies, setStickerCopies] = useState(1);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline" className="h-8 w-8">
          <EllipsisVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <div className="space-y-1 px-2 py-1.5">
          <Label htmlFor={`sticker-copies-${parcel.id}`} className="text-xs">
            Sticker copies
          </Label>
          <Input
            id={`sticker-copies-${parcel.id}`}
            type="number"
            min={MIN_STICKER_COPIES}
            max={MAX_STICKER_COPIES}
            value={stickerCopies}
            onChange={(event) => setStickerCopies(clampStickerCopies(event.target.valueAsNumber))}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          />
        </div>
        <DropdownMenuItem onClick={() => onReprintSticker(parcel, stickerCopies)}>
          Reprint Sticker
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onReprintReceipt(parcel)}>
          Reprint Receipt
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(parcel)}>Edit</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
