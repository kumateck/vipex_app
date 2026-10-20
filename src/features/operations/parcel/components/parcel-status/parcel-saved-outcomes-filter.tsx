import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function ParcelSavedOutcomesFilter({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id="include-saved-call-outcomes"
        checked={value}
        disabled={disabled}
        onCheckedChange={(checked) => onChange(checked === true)}
      />
      <Label htmlFor="include-saved-call-outcomes">Include saved outcomes</Label>
    </div>
  );
}
