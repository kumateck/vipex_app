import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ParcelReceiptPrintControlsProps = {
  autoPrint: boolean;
  canPrintForSession: boolean;
  isLoading: boolean;
  hasPrintableReceipt: boolean;
  isStickerPrintEnabled: boolean;
  showSelectionMenu: boolean;
  triggerLabel: string;
  onPrintBoth: () => void;
  onPrintInvoice: () => void;
  onPrintSticker: () => void;
};

export function ParcelReceiptPrintControls({
  autoPrint,
  canPrintForSession,
  isLoading,
  hasPrintableReceipt,
  isStickerPrintEnabled,
  showSelectionMenu,
  triggerLabel,
  onPrintBoth,
  onPrintInvoice,
  onPrintSticker,
}: ParcelReceiptPrintControlsProps) {
  if (autoPrint) return null;
  if (!showSelectionMenu && !isStickerPrintEnabled && !hasPrintableReceipt) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showSelectionMenu ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" disabled={isLoading || !canPrintForSession}>
              {triggerLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {isStickerPrintEnabled ? (
              <DropdownMenuItem onClick={onPrintSticker}>Reprint Sticker</DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={onPrintInvoice}>Reprint Receipt</DropdownMenuItem>
            {isStickerPrintEnabled ? (
              <DropdownMenuItem onClick={onPrintBoth}>Reprint Sticker + Receipt</DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button type="button" onClick={onPrintBoth} disabled={isLoading || !canPrintForSession}>
          {hasPrintableReceipt
            ? isStickerPrintEnabled
              ? triggerLabel
              : 'Print Invoice'
            : 'Print Sticker'}
        </Button>
      )}
    </div>
  );
}
