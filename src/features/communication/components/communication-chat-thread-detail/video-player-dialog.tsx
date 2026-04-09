import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type VideoPlayerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeVideoAttachment: {
    url: string;
    label?: string;
  } | null;
};

export function VideoPlayerDialog({
  open,
  onOpenChange,
  activeVideoAttachment,
}: VideoPlayerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{activeVideoAttachment?.label || 'Video'}</DialogTitle>
        </DialogHeader>
        {activeVideoAttachment ? (
          <video
            key={activeVideoAttachment.url}
            src={activeVideoAttachment.url}
            controls
            autoPlay
            className="max-h-[72vh] w-full rounded-lg bg-black"
            preload="metadata"
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
