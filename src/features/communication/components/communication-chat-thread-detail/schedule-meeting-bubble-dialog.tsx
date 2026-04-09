import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';

type ScheduleMeetingBubbleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingTitle: string;
  onMeetingTitleChange: (value: string) => void;
  meetingLink: string;
  onMeetingLinkChange: (value: string) => void;
  meetingStartAt: Date | undefined;
  onMeetingStartAtChange: (value: Date | undefined) => void;
  meetingReminderMinutes: string;
  onMeetingReminderMinutesChange: (value: string) => void;
  onCancel: () => void;
  onCreate: () => void;
};

export function ScheduleMeetingBubbleDialog({
  open,
  onOpenChange,
  meetingTitle,
  onMeetingTitleChange,
  meetingLink,
  onMeetingLinkChange,
  meetingStartAt,
  onMeetingStartAtChange,
  meetingReminderMinutes,
  onMeetingReminderMinutesChange,
  onCancel,
  onCreate,
}: ScheduleMeetingBubbleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Meeting Bubble</DialogTitle>
          <DialogDescription>Share meeting details directly in this thread.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Meeting title"
            value={meetingTitle}
            onChange={(event) => onMeetingTitleChange(event.target.value)}
          />
          <Input
            placeholder="Meeting link (https://...)"
            value={meetingLink}
            onChange={(event) => onMeetingLinkChange(event.target.value)}
          />
          <DateTimePicker
            value={meetingStartAt}
            onChange={onMeetingStartAtChange}
            placeholder="Select meeting date and time"
          />
          <Select value={meetingReminderMinutes} onValueChange={onMeetingReminderMinutesChange}>
            <SelectTrigger>
              <SelectValue placeholder="Reminder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">No reminder</SelectItem>
              <SelectItem value="5">5 minutes before</SelectItem>
              <SelectItem value="10">10 minutes before</SelectItem>
              <SelectItem value="15">15 minutes before</SelectItem>
              <SelectItem value="30">30 minutes before</SelectItem>
              <SelectItem value="60">1 hour before</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onCreate}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
