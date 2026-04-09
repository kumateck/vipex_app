import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileDropUpload } from '@/components/ui/file-drop-upload';
import { Input } from '@/components/ui/input';

type PendingUpload = {
  file: File;
  previewUrl: string;
  kind: 'image' | 'video' | 'audio' | 'file';
};

type UploadAttachmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingUpload: PendingUpload | null;
  onFilesChange: (files: File[]) => void;
  accept: string;
  isUploadingFile: boolean;
  isSendingMessage: boolean;
  uploadCaption: string;
  onUploadCaptionChange: (value: string) => void;
  onCancel: () => void;
  onUpload: () => void;
};

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  const kb = sizeBytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export function UploadAttachmentDialog({
  open,
  onOpenChange,
  pendingUpload,
  onFilesChange,
  accept,
  isUploadingFile,
  isSendingMessage,
  uploadCaption,
  onUploadCaptionChange,
  onCancel,
  onUpload,
}: UploadAttachmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload Attachment</DialogTitle>
          <DialogDescription>
            Preview your file, add a caption, and upload it to this thread.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <FileDropUpload
            id="chat-thread-upload"
            files={pendingUpload ? [pendingUpload.file] : []}
            onFilesChange={onFilesChange}
            accept={accept}
            maxFiles={1}
            disabled={isUploadingFile || isSendingMessage}
            title="Drop a file here or click to choose"
            helperText="Supports image, video/audio, PDF, TXT, ZIP, DOC/DOCX, XLS/XLSX."
          />
          {pendingUpload ? (
            <>
              {pendingUpload.kind === 'image' ? (
                <img
                  src={pendingUpload.previewUrl}
                  alt={pendingUpload.file.name}
                  className="max-h-80 w-full rounded-lg border object-contain"
                />
              ) : pendingUpload.kind === 'video' ? (
                <video
                  src={pendingUpload.previewUrl}
                  controls
                  className="max-h-80 w-full rounded-lg border bg-black object-contain"
                />
              ) : pendingUpload.kind === 'audio' ? (
                <audio
                  src={pendingUpload.previewUrl}
                  controls
                  className="w-full rounded-lg border p-2"
                />
              ) : (
                <div className="rounded-lg border bg-muted p-3 text-sm">
                  <p className="font-medium">{pendingUpload.file.name}</p>
                  <p className="text-muted-foreground">{formatFileSize(pendingUpload.file.size)}</p>
                </div>
              )}

              <Input
                placeholder="Add a caption (optional)"
                value={uploadCaption}
                onChange={(event) => onUploadCaptionChange(event.target.value)}
                disabled={isUploadingFile || isSendingMessage}
              />
            </>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isUploadingFile || isSendingMessage}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onUpload}
            disabled={!pendingUpload || isUploadingFile || isSendingMessage}
          >
            {isUploadingFile ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
