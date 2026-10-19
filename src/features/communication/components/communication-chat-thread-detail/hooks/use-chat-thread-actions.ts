import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  type CommunicationMessage,
  type CommunicationThread,
  useCreateCommunicationCallMutation,
  useCreateCommunicationMessageMutation,
  useDeleteCommunicationMessageMutation,
  useToggleCommunicationMessageFlagMutation,
  useToggleCommunicationMessageReactionMutation,
} from '../../../api/communication.api';
import { asRecord } from '../utils/communication-chat-thread-detail-media';

type UseChatThreadActionsParams = {
  normalizedThreadId: string;
  selectedThread: CommunicationThread | null;
  refetchMessages: () => void;
};

export function useChatThreadActions({
  normalizedThreadId,
  selectedThread,
  refetchMessages,
}: UseChatThreadActionsParams) {
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingStartAt, setMeetingStartAt] = useState<Date | undefined>(undefined);
  const [meetingReminderMinutes, setMeetingReminderMinutes] = useState('15');
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [createCallType, setCreateCallType] = useState<'audio' | 'video'>('audio');

  const [createMessage] = useCreateCommunicationMessageMutation();
  const [deleteMessage] = useDeleteCommunicationMessageMutation();
  const [toggleMessageFlag] = useToggleCommunicationMessageFlagMutation();
  const [toggleMessageReaction] = useToggleCommunicationMessageReactionMutation();
  const [createCall, { isLoading: isCreatingCall }] = useCreateCommunicationCallMutation();

  const onDeleteMessage = async (message: CommunicationMessage) => {
    if (!normalizedThreadId) return;
    try {
      await deleteMessage({ id: message.id, threadId: normalizedThreadId }).unwrap();
      toast.success('Message deleted');
      refetchMessages();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to delete message.');
    }
  };

  const onToggleFlag = async (
    message: CommunicationMessage,
    flag: 'pinnedByUserIds' | 'starredByUserIds',
    enabled: boolean,
  ) => {
    if (!normalizedThreadId) return;
    try {
      await toggleMessageFlag({
        id: message.id,
        threadId: normalizedThreadId,
        flag,
        enabled,
      }).unwrap();
      refetchMessages();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to update message flag.');
    }
  };

  const onQuickReact = async (message: CommunicationMessage, emoji: string) => {
    if (!normalizedThreadId) return;
    try {
      await toggleMessageReaction({
        id: message.id,
        threadId: normalizedThreadId,
        emoji,
        enabled: true,
      }).unwrap();
      refetchMessages();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to add reaction.');
    }
  };

  const onForwardMessage = async (message: CommunicationMessage) => {
    if (!normalizedThreadId) return;
    try {
      await createMessage({
        threadId: normalizedThreadId,
        body: message.body,
        messageType: message.messageType,
        metadataJson: {
          ...(asRecord(message.metadataJson) ?? {}),
          forwardedFrom: {
            messageId: message.id,
            senderUserId: message.senderUserId,
            createdAt: message.createdAt,
          },
        },
      }).unwrap();
      toast.success('Message forwarded');
      refetchMessages();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to forward message.');
    }
  };

  const onCreateCallBubble = async () => {
    if (!normalizedThreadId || !selectedThread) return;
    try {
      const call = await createCall({
        threadId: normalizedThreadId,
        callType: createCallType,
      }).unwrap();
      await createMessage({
        threadId: normalizedThreadId,
        messageType: 'call',
        body: null,
        metadataJson: {
          callId: call.id,
          status: call.status,
          callType: call.callType,
          scope: selectedThread.threadType,
          startedAt: call.startedAt ?? call.createdAt,
        },
      }).unwrap();
      setIsCallDialogOpen(false);
      toast.success('Call bubble created');
      refetchMessages();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to create call bubble.');
    }
  };

  const onCreateMeetingBubble = async () => {
    if (!normalizedThreadId || !meetingTitle.trim()) {
      toast.error('Meeting title is required.');
      return;
    }
    try {
      await createMessage({
        threadId: normalizedThreadId,
        messageType: 'meeting',
        body: null,
        metadataJson: {
          title: meetingTitle.trim(),
          link: meetingLink.trim() || null,
          startsAt: meetingStartAt ? meetingStartAt.toISOString() : null,
          reminderMinutes: Number.isFinite(Number(meetingReminderMinutes))
            ? Math.max(0, Number(meetingReminderMinutes))
            : 0,
          participantCount: selectedThread?.participantCount ?? null,
          scope: selectedThread?.threadType ?? 'thread',
        },
      }).unwrap();
      setIsMeetingDialogOpen(false);
      setMeetingTitle('');
      setMeetingLink('');
      setMeetingStartAt(undefined);
      setMeetingReminderMinutes('15');
      toast.success('Meeting bubble created');
      refetchMessages();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to create meeting bubble.');
    }
  };

  return {
    isMeetingDialogOpen,
    setIsMeetingDialogOpen,
    meetingTitle,
    setMeetingTitle,
    meetingLink,
    setMeetingLink,
    meetingStartAt,
    setMeetingStartAt,
    meetingReminderMinutes,
    setMeetingReminderMinutes,
    isCallDialogOpen,
    setIsCallDialogOpen,
    createCallType,
    setCreateCallType,
    onDeleteMessage,
    onToggleFlag,
    onQuickReact,
    onForwardMessage,
    onCreateCallBubble,
    onCreateMeetingBubble,
    isCreatingCall,
  };
}
