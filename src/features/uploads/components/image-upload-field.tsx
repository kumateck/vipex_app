import { ImageDropUpload } from '@/components/ui/image-drop-upload';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { useState } from 'react';

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
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = async (nextFile: File | null) => {
    setFile(nextFile);
    const file = nextFile;
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    onChange(dataUrl);
  };

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <ImageDropUpload
        id={id}
        file={file}
        previewUrl={previewUrl}
        onFileChange={(nextFile) => {
          if (!nextFile) {
            setFile(null);
            onChange(null);
            return;
          }
          void handleFileChange(nextFile);
        }}
        helperText={helperText}
        disabled={disabled}
      />
      {helperText ? <FieldDescription>{helperText}</FieldDescription> : null}
    </Field>
  );
}
