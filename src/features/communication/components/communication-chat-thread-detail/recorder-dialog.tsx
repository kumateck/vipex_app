import type { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type RecorderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordingMode: 'audio' | 'video';
  isRecording: boolean;
  recordingElapsedSec: number;
  recorderPreviewRef: RefObject<HTMLVideoElement | null>;
  isPreparingRecording: boolean;
  onCancel: () => void;
  onStopRecording: () => void;
};

function formatDurationClock(totalSec: number) {
  const mins = Math.floor(totalSec / 60);
  const secs = Math.max(0, totalSec % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function RecorderDialog({
  open,
  onOpenChange,
  recordingMode,
  isRecording,
  recordingElapsedSec,
  recorderPreviewRef,
  isPreparingRecording,
  onCancel,
  onStopRecording,
}: RecorderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{recordingMode === 'video' ? 'Record Video' : 'Record Audio'}</DialogTitle>
          <DialogDescription>
            {isRecording
              ? 'Recording in progress. Stop to preview and upload.'
              : 'Preparing recorder...'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {isRecording ? (
            <p className="text-sm font-medium text-destructive">
              Recording • {formatDurationClock(recordingElapsedSec)}
            </p>
          ) : null}
          {recordingMode === 'video' ? (
            <video
              ref={recorderPreviewRef}
              muted
              playsInline
              className="max-h-80 w-full rounded-lg border bg-black object-contain"
            />
          ) : (
            <div className="rounded-lg border bg-muted p-3 text-sm">
              {isRecording ? 'Recording audio...' : 'Requesting microphone access...'}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPreparingRecording}
          >
            Cancel
          </Button>
          <Button type="button" onClick={onStopRecording} disabled={!isRecording}>
            Stop Recording
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
