import { type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type ImageUploadFieldProps = {
  id: string;
  label: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  helperText?: string;
  disabled?: boolean;
};

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

export function ImageUploadField({
  id,
  label,
  value,
  onChange,
  helperText,
  disabled,
}: ImageUploadFieldProps) {
  const previewUrl = value ?? '';

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    onChange(dataUrl);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-col gap-3 rounded-lg border border-dashed p-3">
        {previewUrl ? (
          <img src={previewUrl} alt={label} className="h-36 w-36 rounded-lg border object-cover" />
        ) : (
          <div className="flex h-36 w-36 items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">
            No image
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <input
            id={id}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void handleFileChange(event)}
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(id)?.click()}
            disabled={disabled}
          >
            Choose image
          </Button>
          {previewUrl ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onChange(null)}
              disabled={disabled}
            >
              Remove
            </Button>
          ) : null}
        </div>
        {helperText ? <p className="text-xs text-muted-foreground">{helperText}</p> : null}
      </div>
    </div>
  );
}
