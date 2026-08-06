import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { FileDropUpload } from '@/components/ui/file-drop-upload';

type FileUploadFieldProps = {
  id: string;
  label: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  disabled?: boolean;
  title?: string;
  helperText?: string;
};

export function FileUploadField({
  id,
  label,
  files,
  onFilesChange,
  accept,
  multiple,
  maxFiles,
  disabled,
  title,
  helperText,
}: FileUploadFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <FileDropUpload
        id={id}
        files={files}
        onFilesChange={onFilesChange}
        accept={accept}
        multiple={multiple}
        maxFiles={maxFiles}
        disabled={disabled}
        title={title}
        helperText={helperText}
      />
      {helperText ? <FieldDescription>{helperText}</FieldDescription> : null}
    </Field>
  );
}
