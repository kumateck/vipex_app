import type { CommunicationMeeting } from '../../../api/communication.api';

export type RelativeScheduleBucket = 'today' | 'upcoming' | 'previous';

export type CommunicationEventType = 'meeting' | 'audio' | 'video';

export type CommunicationEventStatus = 'scheduled' | 'completed';

export type CommunicationEventItem = CommunicationMeeting & {
  startsAtDate: Date | null;
  inferredType: CommunicationEventType;
  status: CommunicationEventStatus;
  senderName: string;
  participantUserIds: string[];
  participants: string[];
  reminderMinutes: number;
};
