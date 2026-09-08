import { useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type StickerCopiesInputProps = {
  copies: number;
  onChange: (copies: number) => void;
};

export function StickerCopiesInput({ copies, onChange }: StickerCopiesInputProps) {
  const inputId = useId();

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={inputId} className="whitespace-nowrap text-xs">
        Sticker copies
      </Label>
      <Input
        id={inputId}
        type="number"
        min={1}
        step={1}
        value={copies}
        onChange={(event) => onChange(event.target.valueAsNumber)}
        className="h-9 w-20"
      />
    </div>
  );
}
