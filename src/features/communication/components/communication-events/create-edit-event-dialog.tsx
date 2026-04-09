import { DateTimePicker } from '@/components/ui/date-time-picker';
import { MultiSelect } from '@/components/ui/multi-select';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';

type EventType = 'meeting' | 'audio' | 'video';

type ThreadOption = {
  id: string;
  title?: string | null;
};

type UserOption = {
  id: string;
  fullname?: string | null;
  email?: string | null;
};

type CreateEditEventDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEventMessageId: string | null;
  eventTitle: string;
  onEventTitleChange: (value: string) => void;
  eventType: EventType;
  onEventTypeChange: (value: EventType) => void;
  eventStartsAt: Date | undefined;
  onEventStartsAtChange: (value: Date | undefined) => void;
  eventThreadId: string;
  onEventThreadIdChange: (value: string) => void;
  threads: ThreadOption[];
  eventLink: string;
  onEventLinkChange: (value: string) => void;
  userOptions: UserOption[];
  eventParticipantUserIds: string[];
  onEventParticipantUserIdsChange: (value: string[]) => void;
  eventReminderMinutes: string;
  onEventReminderMinutesChange: (value: string) => void;
  eventDescription: string;
  onEventDescriptionChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  isCreatingEvent: boolean;
  isUpdatingEvent: boolean;
};

export function CreateEditEventDialog({
  open,
  onOpenChange,
  editingEventMessageId,
  eventTitle,
  onEventTitleChange,
  eventType,
  onEventTypeChange,
  eventStartsAt,
  onEventStartsAtChange,
  eventThreadId,
  onEventThreadIdChange,
  threads,
  eventLink,
  onEventLinkChange,
  userOptions,
  eventParticipantUserIds,
  onEventParticipantUserIdsChange,
  eventReminderMinutes,
  onEventReminderMinutesChange,
  eventDescription,
  onEventDescriptionChange,
  onSubmit,
  isCreatingEvent,
  isUpdatingEvent,
}: CreateEditEventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingEventMessageId ? 'Edit Event' : 'Create Event'}</DialogTitle>
          <DialogDescription>
            Create a meeting/call event and publish it into a thread.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Event title"
            value={eventTitle}
            onChange={(event) => onEventTitleChange(event.target.value)}
            className="sm:col-span-2"
          />
          <Select
            value={eventType}
            onValueChange={(value) => onEventTypeChange(value as EventType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="video">Video</SelectItem>
            </SelectContent>
          </Select>
          <DateTimePicker
            value={eventStartsAt}
            onChange={onEventStartsAtChange}
            placeholder="Select event start date and time"
            minDateTime={new Date()}
          />
          <Select value={eventThreadId} onValueChange={onEventThreadIdChange}>
            <SelectTrigger className="sm:col-span-2">
              <SelectValue placeholder="Select thread" />
            </SelectTrigger>
            <SelectContent>
              {threads.map((thread) => (
                <SelectItem key={thread.id} value={thread.id}>
                  {thread.title || 'Untitled thread'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Meeting link (optional)"
            value={eventLink}
            onChange={(event) => onEventLinkChange(event.target.value)}
            className="sm:col-span-2"
          />
          <div className="space-y-2 sm:col-span-2">
            <p className="text-sm font-medium">Participants</p>
            <MultiSelect
              options={userOptions}
              value={eventParticipantUserIds}
              onValueChange={onEventParticipantUserIdsChange}
              getLabel={(option) => option.fullname || option.email || 'Unknown user'}
              getValue={(option) => option.id}
              placeholder="Select participants"
              searchPlaceholder="Search users..."
              emptyMessage="No users found."
            />
            <p className="text-xs text-muted-foreground">
              {eventParticipantUserIds.length} participant
              {eventParticipantUserIds.length === 1 ? '' : 's'} selected
            </p>
          </div>
          <Select value={eventReminderMinutes} onValueChange={onEventReminderMinutesChange}>
            <SelectTrigger className="sm:col-span-2">
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
          <Textarea
            placeholder="Description (optional)"
            value={eventDescription}
            onChange={(event) => onEventDescriptionChange(event.target.value)}
            className="sm:col-span-2"
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void onSubmit()}
            disabled={
              !eventThreadId ||
              !eventTitle.trim() ||
              !eventParticipantUserIds.length ||
              isCreatingEvent ||
              isUpdatingEvent
            }
          >
            {editingEventMessageId
              ? isUpdatingEvent
                ? 'Updating...'
                : 'Save Changes'
              : isCreatingEvent
                ? 'Creating...'
                : 'Create Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
