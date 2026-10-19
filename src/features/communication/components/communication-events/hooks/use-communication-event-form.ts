import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  useCreateCommunicationMessageMutation,
  useDeleteCommunicationMessageMutation,
  useUpdateCommunicationMessageMutation,
} from '../../../api/communication.api';
import type {
  CommunicationEventItem,
  CommunicationEventType,
} from '../types/communication-events.types';

type UseCommunicationEventFormParams = {
  selectedDate: Date;
  threads: Array<{ id: string; title?: string | null }>;
  userOptions: Array<{ id: string; fullname?: string | null; email?: string | null }>;
  userById: Map<string, { id: string; fullname?: string | null; email?: string | null }>;
  refetch: () => Promise<unknown>;
};

export function useCommunicationEventForm({
  selectedDate,
  threads,
  userOptions,
  userById,
  refetch,
}: UseCommunicationEventFormParams) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<CommunicationEventType>('meeting');
  const [eventLink, setEventLink] = useState('');
  const [eventThreadId, setEventThreadId] = useState('');
  const [eventParticipantUserIds, setEventParticipantUserIds] = useState<string[]>([]);
  const [eventReminderMinutes, setEventReminderMinutes] = useState('15');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStartsAt, setEventStartsAt] = useState<Date | undefined>(() => new Date());
  const [editingEventMessageId, setEditingEventMessageId] = useState<string | null>(null);

  const [createMessage, { isLoading: isCreatingEvent }] = useCreateCommunicationMessageMutation();
  const [updateMessage, { isLoading: isUpdatingEvent }] = useUpdateCommunicationMessageMutation();
  const [deleteMessage, { isLoading: isDeletingEvent }] = useDeleteCommunicationMessageMutation();

  const openCreateDialog = (presetDate?: Date) => {
    const baseDate = presetDate ?? selectedDate ?? new Date();
    setEventStartsAt(baseDate);
    if (!eventThreadId && threads[0]?.id) {
      setEventThreadId(threads[0].id);
    }
    setEditingEventMessageId(null);
    setEventReminderMinutes('15');
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (event: CommunicationEventItem) => {
    const metadata =
      event.metadataJson &&
      typeof event.metadataJson === 'object' &&
      !Array.isArray(event.metadataJson)
        ? (event.metadataJson as Record<string, unknown>)
        : {};
    const participants = Array.isArray(metadata.participants)
      ? (metadata.participants as unknown[]).filter(
          (value): value is string => typeof value === 'string',
        )
      : [];
    const participantUserIds = Array.isArray(metadata.participantUserIds)
      ? (metadata.participantUserIds as unknown[]).filter(
          (value): value is string => typeof value === 'string',
        )
      : [];
    const participantIdsFromNames = participants
      .map(
        (participant) =>
          userOptions.find((user) => user.fullname === participant || user.email === participant)
            ?.id,
      )
      .filter((value): value is string => Boolean(value));
    const mergedParticipantIds = Array.from(
      new Set([...participantUserIds, ...participantIdsFromNames]),
    );

    setEditingEventMessageId(event.messageId);
    setEventTitle(event.title);
    setEventType(
      event.inferredType === 'audio' || event.inferredType === 'video'
        ? event.inferredType
        : 'meeting',
    );
    setEventLink(event.link ?? '');
    setEventThreadId(event.threadId);
    setEventParticipantUserIds(mergedParticipantIds);
    setEventReminderMinutes(
      typeof metadata.reminderMinutes === 'number' && Number.isFinite(metadata.reminderMinutes)
        ? String(metadata.reminderMinutes)
        : '15',
    );
    setEventDescription(event.body ?? '');
    setEventStartsAt(event.startsAtDate ?? new Date());
    setIsCreateDialogOpen(true);
  };

  const onDeleteEvent = async (event: CommunicationEventItem) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await deleteMessage({ id: event.messageId, threadId: event.threadId }).unwrap();
      toast.success('Event deleted');
      await refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to delete event.');
    }
  };

  const submitCreateEvent = async () => {
    const threadId = eventThreadId.trim();
    if (!threadId || !eventTitle.trim()) return;
    if (!eventParticipantUserIds.length) {
      toast.error('Select at least one participant.');
      return;
    }
    if (eventStartsAt && eventStartsAt.getTime() < Date.now()) {
      toast.error('Event time must be now or in the future.');
      return;
    }

    const startsAtIso = eventStartsAt ? eventStartsAt.toISOString() : null;
    const reminderMinutes = Number(eventReminderMinutes);
    const participants = eventParticipantUserIds
      .map(
        (userId) => userById.get(userId)?.fullname ?? userById.get(userId)?.email ?? 'Unknown user',
      )
      .filter(Boolean);

    const payload = {
      threadId,
      body: eventDescription.trim() || null,
      metadataJson: {
        title: eventTitle.trim(),
        kind: eventType,
        callType: eventType,
        link: eventLink.trim() || null,
        startsAt: startsAtIso,
        reminderMinutes: Number.isFinite(reminderMinutes) ? Math.max(0, reminderMinutes) : 0,
        participantUserIds: eventParticipantUserIds,
        participants,
      },
    };

    if (editingEventMessageId) {
      await updateMessage({ id: editingEventMessageId, ...payload }).unwrap();
      toast.success('Event updated');
    } else {
      await createMessage({ ...payload, messageType: 'meeting' }).unwrap();
      toast.success('Event created');
    }

    setIsCreateDialogOpen(false);
    setEditingEventMessageId(null);
    setEventTitle('');
    setEventType('meeting');
    setEventLink('');
    setEventParticipantUserIds([]);
    setEventReminderMinutes('15');
    setEventDescription('');
    await refetch();
  };

  return {
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    editingEventMessageId,
    eventTitle,
    setEventTitle,
    eventType,
    setEventType,
    eventStartsAt,
    setEventStartsAt,
    eventThreadId,
    setEventThreadId,
    eventLink,
    setEventLink,
    eventParticipantUserIds,
    setEventParticipantUserIds,
    eventReminderMinutes,
    setEventReminderMinutes,
    eventDescription,
    setEventDescription,
    openCreateDialog,
    openEditDialog,
    onDeleteEvent,
    submitCreateEvent,
    isCreatingEvent,
    isUpdatingEvent,
    isDeletingEvent,
  };
}
