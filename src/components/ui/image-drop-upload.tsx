import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { FileDropUpload } from '@/components/ui/file-drop-upload';

type ImageDropUploadProps = {
  id: string;
  file: File | null;
  previewUrl?: string | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  title?: string;
  helperText?: string;
  emptyLabel?: string;
};

export function ImageDropUpload({
  id,
  file,
  previewUrl,
  onFileChange,
  disabled = false,
  title = 'Drag and drop image, or click to choose',
  helperText,
  emptyLabel = 'No image',
}: ImageDropUploadProps) {
  const files = useMemo(() => (file ? [file] : []), [file]);

  const resolvedHelperText = helperText ?? 'PNG, JPG, or WEBP image.';

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-3">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Selected preview"
          className="h-36 w-36 rounded-lg border object-cover"
        />
      ) : (
        <div className="flex h-36 w-36 items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">
          {emptyLabel}
        </div>
      )}

      <FileDropUpload
        id={id}
        files={files}
        onFilesChange={(nextFiles) => {
          onFileChange(nextFiles[0] ?? null);
        }}
        accept="image/*"
        maxFiles={1}
        disabled={disabled}
        title={title}
        helperText={resolvedHelperText}
      />

      {file || previewUrl ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => onFileChange(null)}
          disabled={disabled}
        >
          Remove
        </Button>
      ) : null}
    </div>
  );
}
