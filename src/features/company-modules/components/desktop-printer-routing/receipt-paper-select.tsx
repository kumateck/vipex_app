import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { normalizeReceiptPaperFormat, type ReceiptPaperFormat } from '@/shared/printing';

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
          <SelectItem value="xprinter-80mm-landscape">
            Xprinter — 80 mm browser-style receipt
          </SelectItem>
          <SelectItem value="xprinter-80mm">Xprinter — 80 mm vertical receipt</SelectItem>
          <SelectItem value="xprinter-58mm">Xprinter — 58 mm vertical receipt</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        Choose browser-style for the wide acknowledgement layout on an 80 mm roll. Vertical formats
        use a stacked receipt. Stickers and A4 reports keep their own routing.
      </p>
    </div>
  );
}
