import { Bell, Calendar as CalendarIcon, Clock3, Pencil, Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CommunicationEventItem } from '../types/communication-events.types';
import { CommunicationEventParticipants } from './communication-event-participants';

type CommunicationEventCardProps = {
  event: CommunicationEventItem;
  userById: Map<string, { id: string; fullname?: string | null; email?: string | null }>;
  onEditEvent: (event: CommunicationEventItem) => void;
  onDeleteEvent: (event: CommunicationEventItem) => void;
  isDeletingEvent: boolean;
};

export function CommunicationEventCard({
  event,
  userById,
  onEditEvent,
  onDeleteEvent,
  isDeletingEvent,
}: CommunicationEventCardProps) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted font-semibold">
            {event.senderName.slice(0, 1).toUpperCase()}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {event.inferredType === 'meeting' ? 'Meeting' : event.inferredType}
              </Badge>
              <Badge variant={event.status === 'completed' ? 'secondary' : 'default'}>
                {event.status === 'completed' ? 'Completed' : 'Scheduled'}
              </Badge>
            </div>
            <p className="text-2xl font-semibold leading-none">{event.title}</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {event.startsAtDate ? event.startsAtDate.toLocaleDateString() : '-'}
              </p>
              <p className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                {event.startsAtDate
                  ? event.startsAtDate.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '-'}
              </p>
              <div className="inline-flex items-center gap-2">
                <Users className="h-4 w-4" />
                <CommunicationEventParticipants event={event} userById={userById} />
              </div>
              <p className="inline-flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Reminder: {event.reminderMinutes ? `${event.reminderMinutes} min before` : 'Off'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {event.link ? (
            <a href={event.link} target="_blank" rel="noreferrer" className="text-xs underline">
              Join
            </a>
          ) : null}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => onEditEvent(event)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => onDeleteEvent(event)}
            disabled={isDeletingEvent}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}
