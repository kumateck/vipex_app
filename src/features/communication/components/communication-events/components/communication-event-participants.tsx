import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { CommunicationEventItem } from '../types/communication-events.types';

type CommunicationEventParticipantsProps = {
  event: CommunicationEventItem;
  userById: Map<string, { id: string; fullname?: string | null; email?: string | null }>;
};

export function CommunicationEventParticipants({
  event,
  userById,
}: CommunicationEventParticipantsProps) {
  const maxVisible = 3;
  const visibleIds = event.participantUserIds.slice(0, maxVisible);
  const extraCount = Math.max(0, event.participantUserIds.length - maxVisible);
  const participantsText = event.participants.join(', ');

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visibleIds.map((userId) => {
          const option = userById.get(userId);
          const name = option?.fullname || option?.email || 'Unknown user';
          return (
            <Avatar
              key={`${event.messageId}-${userId}`}
              className="h-6 w-6 border border-background"
            >
              <AvatarFallback className="text-[10px] font-semibold">
                {name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          );
        })}
        {!visibleIds.length ? (
          <Avatar className="h-6 w-6 border border-background">
            <AvatarFallback className="text-[10px] font-semibold">
              {event.senderName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : null}
      </div>
      <span className="truncate text-sm text-muted-foreground">
        {participantsText}
        {extraCount > 0 ? ` (+${extraCount})` : ''}
      </span>
    </div>
  );
}
