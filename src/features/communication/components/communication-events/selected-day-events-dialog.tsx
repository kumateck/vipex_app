import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type RelativeScheduleBucket = 'today' | 'upcoming' | 'previous';

type SelectedDayEvent = {
  messageId: string;
  inferredType: 'meeting' | 'audio' | 'video';
  status: 'scheduled' | 'completed';
  title: string;
  startsAtDate: Date | null;
  reminderMinutes: number;
  threadTitle?: string | null;
};

type SelectedDayEventsDialogProps<TEvent extends SelectedDayEvent> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  selectedDate: Date;
  selectedDayMeetings: TEvent[];
  groupedSelectedDayMeetings: Record<RelativeScheduleBucket, TEvent[]>;
  participantDisplay: (event: TEvent) => ReactNode;
  onEditEvent: (event: TEvent) => void;
  onDeleteEvent: (event: TEvent) => void | Promise<void>;
  isDeletingEvent: boolean;
  onCreateEvent: (presetDate?: Date) => void;
};

export function SelectedDayEventsDialog<TEvent extends SelectedDayEvent>({
  open,
  onOpenChange,
  title,
  selectedDate,
  selectedDayMeetings,
  groupedSelectedDayMeetings,
  participantDisplay,
  onEditEvent,
  onDeleteEvent,
  isDeletingEvent,
  onCreateEvent,
}: SelectedDayEventsDialogProps<TEvent>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {selectedDayMeetings.length
              ? `${selectedDayMeetings.length} event${selectedDayMeetings.length > 1 ? 's' : ''} scheduled`
              : 'No events found'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {selectedDayMeetings.length ? (
            (
              [
                ['today', 'Today'],
                ['upcoming', 'Upcoming'],
                ['previous', 'Previous'],
              ] as const
            ).map(([bucket, bucketTitle]) => (
              <div key={bucket} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {bucketTitle}
                </p>
                <div className="space-y-3">
                  {groupedSelectedDayMeetings[bucket].length ? (
                    groupedSelectedDayMeetings[bucket].map((event) => (
                      <div key={event.messageId} className="rounded-xl border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">
                                {(event.inferredType === 'meeting'
                                  ? 'Meeting'
                                  : event.inferredType
                                ).toUpperCase()}
                              </Badge>
                              <Badge
                                variant={event.status === 'completed' ? 'secondary' : 'default'}
                              >
                                {event.status === 'completed' ? 'Completed' : 'Pending'}
                              </Badge>
                            </div>
                            <p className="text-xl font-semibold">{event.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Time:{' '}
                              {event.startsAtDate
                                ? event.startsAtDate.toLocaleTimeString([], {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })
                                : '-'}
                            </p>
                            <div className="text-sm text-muted-foreground">
                              <span className="mr-1">Participants:</span>
                              {participantDisplay(event)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Reminder:{' '}
                              {event.reminderMinutes
                                ? `${event.reminderMinutes} min before`
                                : 'Off'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Thread: {event.threadTitle || 'Untitled thread'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9"
                              onClick={() => onEditEvent(event)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9"
                              onClick={() => void onDeleteEvent(event)}
                              disabled={isDeletingEvent}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No {bucketTitle.toLowerCase()} events.
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border p-8 text-center">
              <p className="text-muted-foreground">No events found</p>
              <Button className="mt-4" onClick={() => onCreateEvent(selectedDate)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" className="w-full" onClick={() => onCreateEvent(selectedDate)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
