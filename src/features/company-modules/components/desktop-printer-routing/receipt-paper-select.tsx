import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  normalizeReceiptPaperFormat,
  type ReceiptPaperFormat,
} from '@/shared/printing/receipt-paper';

export function ReceiptPaperSelect({
  value,
  onChange,
}: {
  value: ReceiptPaperFormat;
  onChange: (value: ReceiptPaperFormat) => void;
}) {
  return (
    <div className="space-y-2 max-w-sm">
      <Label htmlFor="receipt-paper">Receipt Paper Format</Label>
      <Select value={value} onValueChange={(next) => onChange(normalizeReceiptPaperFormat(next))}>
        <SelectTrigger id="receipt-paper">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a5">A5 — landscape receipt</SelectItem>
          <SelectItem value="xprinter-80mm">Xprinter — 80 mm vertical receipt</SelectItem>
          <SelectItem value="xprinter-58mm">Xprinter — 58 mm vertical receipt</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        Select your installed Xprinter above and choose the width of its paper roll. Xprinter
        receipts print vertically; stickers and A4 reports keep their own routing.
      </p>
    </div>
  );
}
