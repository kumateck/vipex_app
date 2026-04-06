import { useMemo, useRef, useState, type ChangeEventHandler, type DragEventHandler } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  const kb = sizeBytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

type FileDropUploadProps = {
  id: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  disabled?: boolean;
  title?: string;
  helperText?: string;
};

export function FileDropUpload({
  id,
  files,
  onFilesChange,
  accept = '*/*',
  multiple = false,
  maxFiles = multiple ? 5 : 1,
  disabled = false,
  title = 'Drop file here or click to upload',
  helperText,
}: FileDropUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const canAddMore = files.length < maxFiles;

  const mergedHint = useMemo(() => {
    const mode = multiple ? `up to ${maxFiles} files` : 'one file';
    return helperText ?? `Supports ${mode}.`;
  }, [helperText, maxFiles, multiple]);

  const normalizeSelectedFiles = (pickedFiles: File[]) => {
    if (!pickedFiles.length) return;
    if (multiple) {
      const next = [...files, ...pickedFiles].slice(0, maxFiles);
      onFilesChange(next);
      return;
    }
    const [firstFile] = pickedFiles;
    if (!firstFile) return;
    onFilesChange([firstFile]);
  };

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const selected = Array.from(event.target.files ?? []);
    normalizeSelectedFiles(selected);
    event.target.value = '';
  };

  const handleDrop: DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    if (disabled || !canAddMore) return;
    setIsDragActive(false);
    const dropped = Array.from(event.dataTransfer.files ?? []);
    normalizeSelectedFiles(dropped);
  };

  const openFilePicker = () => {
    if (disabled || !canAddMore) return;
    inputRef.current?.click();
  };

  const removeFileAt = (index: number) => {
    const next = files.filter((_, fileIndex) => fileIndex !== index);
    onFilesChange(next);
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id={id}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        disabled={disabled || !canAddMore}
      />

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={openFilePicker}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled && canAddMore) setIsDragActive(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragActive(false);
        }}
        onDrop={handleDrop}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openFilePicker();
          }
        }}
        className={cn(
          'rounded-lg border border-dashed p-4 transition-colors',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          isDragActive ? 'border-primary bg-primary/5' : 'border-border',
        )}
      >
        <div className="flex items-center gap-2 text-sm">
          <Upload className="h-4 w-4" />
          <span>{title}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{mergedHint}</p>
      </div>

      {files.length ? (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${index}`}
              className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => removeFileAt(index)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
