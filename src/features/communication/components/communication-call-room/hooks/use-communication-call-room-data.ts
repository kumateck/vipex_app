import { useEffect, useMemo, useRef, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { toast } from 'sonner';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import {
  useCreateCommunicationMessageMutation,
  useListCommunicationMessagesQuery,
  useListCommunicationCallsQuery,
  useListCommunicationThreadsQuery,
  useMarkCommunicationChannelReadMutation,
  useUpdateCommunicationCallStatusMutation,
} from '../../../api/communication.api';
import { useCommunicationSocket } from '../../../hooks/use-communication-socket';
import type { CallParticipant } from '../types/communication-call-room.types';
import { prettyValue } from '../utils/communication-call-room-utils';

export function useCommunicationCallRoomData({
  callId,
  currentUserId,
}: {
  callId: string;
  currentUserId: string;
}) {
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [callChatInput, setCallChatInput] = useState('');
  const [callChatPanelOpen, setCallChatPanelOpen] = useState(true);
  const [unseenCallChatCount, setUnseenCallChatCount] = useState(0);
  const callChatViewportRef = useRef<HTMLDivElement | null>(null);

  const { data: calls = [], refetch: refetchCalls } = useListCommunicationCallsQuery();
  const { data: threads = [] } = useListCommunicationThreadsQuery();
  const { data: userOptions = [] } = useListUserOptionsQuery();
  const [updateCallStatus, { isLoading: isUpdatingStatus }] =
    useUpdateCommunicationCallStatusMutation();
  const [markChannelRead] = useMarkCommunicationChannelReadMutation();
  const [createMessage, { isLoading: isSendingCallChatMessage }] =
    useCreateCommunicationMessageMutation();

  const call = useMemo(() => calls.find((row) => row.id === callId) ?? null, [callId, calls]);
  const callChatThreadId = call?.chatThreadId ?? call?.threadId ?? null;
  const { data: callChatMessages = [], refetch: refetchCallChatMessages } =
    useListCommunicationMessagesQuery(
      callChatThreadId ? { threadId: callChatThreadId, limit: 120 } : skipToken,
    );

  const threadLabelById = useMemo(
    () =>
      new Map(
        threads.map((thread) => [
          thread.id,
          thread.title || `${prettyValue(thread.threadType)} thread`,
        ]),
      ),
    [threads],
  );

  const userLabelById = useMemo(
    () =>
      new Map(
        userOptions.map((option) => [option.id, option.fullname || option.email || 'Unknown user']),
      ),
    [userOptions],
  );

  const participantNameById = useMemo(
    () =>
      new Map(
        participants.map((participant) => [participant.userId, participant.displayName ?? '']),
      ),
    [participants],
  );

  const currentParticipant = useMemo(
    () => participants.find((item) => item.userId === currentUserId) ?? null,
    [currentUserId, participants],
  );

  const { isConnected, joinCall, leaveCall, setCallMediaState, requestCallParticipants } =
    useCommunicationSocket({
      onMessageCreated: (payload) => {
        if (payload.threadId !== callChatThreadId) return;
        refetchCallChatMessages();
        if (!callChatPanelOpen) {
          setUnseenCallChatCount((prev) => prev + 1);
        }
      },
      onCallParticipantsUpdated: ({
        callId: incomingCallId,
        participants: incomingParticipants,
      }) => {
        if (incomingCallId !== callId) return;
        setParticipants(incomingParticipants);
      },
      onCallUpdated: (payload) => {
        if (payload.id !== callId) return;
        refetchCalls();
      },
    });

  useEffect(() => {
    if (!callChatPanelOpen) return;
    const viewport = callChatViewportRef.current;
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
    setUnseenCallChatCount(0);
  }, [callChatMessages.length, callChatPanelOpen]);

  useEffect(() => {
    if (!callId || !isConnected) return;
    requestCallParticipants(callId);
  }, [callId, isConnected, requestCallParticipants]);

  useEffect(() => {
    if (!call?.channelId) return;
    void markChannelRead({ id: call.channelId });
  }, [call?.channelId, markChannelRead]);

  const onSendCallChatMessage = async () => {
    if (!callChatThreadId) return;
    const trimmed = callChatInput.trim();
    if (!trimmed) return;
    try {
      await createMessage({
        threadId: callChatThreadId,
        body: trimmed,
        messageType: 'text',
      }).unwrap();
      setCallChatInput('');
      refetchCallChatMessages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send in-call chat message.');
    }
  };

  const onChangeStatus = async (
    status: 'pending' | 'ringing' | 'active' | 'ended' | 'cancelled',
  ) => {
    if (!call) return;
    try {
      await updateCallStatus({ id: call.id, status }).unwrap();
      toast.success(`Call marked as ${prettyValue(status)}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update call status.');
    }
  };

  return {
    call,
    participants,
    currentParticipant,
    participantNameById,
    threadLabelById,
    userLabelById,
    isConnected,
    joinCall,
    leaveCall,
    setCallMediaState,
    requestCallParticipants,
    refetchCalls,
    isUpdatingStatus,
    onChangeStatus,
    callChatThreadId,
    callChatMessages,
    callChatInput,
    setCallChatInput,
    callChatPanelOpen,
    setCallChatPanelOpen,
    unseenCallChatCount,
    callChatViewportRef,
    isSendingCallChatMessage,
    onSendCallChatMessage,
  };
}
