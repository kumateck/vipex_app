import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';

type CreateCallBubbleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createCallType: 'audio' | 'video';
  onCreateCallTypeChange: (value: 'audio' | 'video') => void;
  onCancel: () => void;
  onCreate: () => void;
  isCreatingCall: boolean;
};

export function CreateCallBubbleDialog({
  open,
  onOpenChange,
  createCallType,
  onCreateCallTypeChange,
  onCancel,
  onCreate,
  isCreatingCall,
}: CreateCallBubbleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Call Bubble</DialogTitle>
          <DialogDescription>Create a call entry in this thread.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-sm font-medium">Call type</p>
          <Select
            value={createCallType}
            onValueChange={(value) => onCreateCallTypeChange(value as 'audio' | 'video')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="video">Video</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onCreate} disabled={isCreatingCall}>
            {isCreatingCall ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
