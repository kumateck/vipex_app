import { useEffect, useMemo, useState } from 'react';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import {
  useAddCommunicationChannelParticipantsMutation,
  useGetCommunicationChannelByIdQuery,
  useJoinVoiceChannelMutation,
  useListCommunicationCallsQuery,
  useListCommunicationChannelUnreadCountsQuery,
  useListCommunicationChannelsQuery,
  useListCommunicationPresenceQuery,
  useListCommunicationThreadsQuery,
  useListCommunicationUnreadCountsQuery,
  useMarkCommunicationChannelReadMutation,
  useRemoveCommunicationChannelParticipantMutation,
  useSetCommunicationPresenceMutation,
} from '../../../api/communication.api';
import { useCommunicationSocket } from '../../../hooks/use-communication-socket';
import { useCommunicationChatActions } from './use-communication-chat-actions';
import { useCommunicationChatNavigation } from './use-communication-chat-navigation';
import { useCommunicationChatOpenSections } from './use-communication-chat-open-sections';
import { saveChannelMembers } from '../services/communication-chat-actions';
import {
  type CommunicationChatViewModel,
  type ThreadTypeCreate,
  type ThreadTypeFilter,
} from '../types/communication-chat.types';

export function useCommunicationChatPage(): CommunicationChatViewModel {
  const {
    navigate,
    selectedThreadId,
    selectedCallId,
    navigateToWorkspace,
    navigateToCreate,
    navigateToThread,
  } = useCommunicationChatNavigation();
  const { openSections, toggleSection } = useCommunicationChatOpenSections();
  const [threadTypeFilter, setThreadTypeFilter] = useState<ThreadTypeFilter>('all');
  const [presenceRows, setPresenceRows] = useState<CommunicationChatViewModel['presenceRows']>([]);
  const [callParticipantsByCallId, setCallParticipantsByCallId] = useState<
    Record<
      string,
      {
        participants: Array<{ userId: string; isMuted: boolean; isVideoOff: boolean }>;
      }
    >
  >({});
  const [managingChannel, setManagingChannel] =
    useState<CommunicationChatViewModel['managingChannel']>(null);
  const [channelMemberIds, setChannelMemberIds] = useState<string[]>([]);
  const threadQueryParams = useMemo(
    () =>
      threadTypeFilter === 'all'
        ? undefined
        : ({ threadType: threadTypeFilter } as { threadType: ThreadTypeCreate }),
    [threadTypeFilter],
  );

  const {
    data: threads = [],
    isLoading: isLoadingThreads,
    refetch: refetchThreads,
  } = useListCommunicationThreadsQuery(threadQueryParams);
  const {
    data: textChannels = [],
    isLoading: isLoadingTextChannels,
    refetch: refetchTextChannels,
  } = useListCommunicationChannelsQuery({ channelType: 'text' });
  const {
    data: voiceChannels = [],
    isLoading: isLoadingVoiceChannels,
    refetch: refetchVoiceChannels,
  } = useListCommunicationChannelsQuery({ channelType: 'voice' });
  const { data: activeCalls = [], refetch: refetchCalls } = useListCommunicationCallsQuery({
    status: 'active',
  });
  const { data: userOptions = [] } = useListUserOptionsQuery();
  const { data: unreadCounts = [], refetch: refetchUnreadCounts } =
    useListCommunicationUnreadCountsQuery();
  const { data: voiceUnreadCounts = [], refetch: refetchVoiceUnreadCounts } =
    useListCommunicationChannelUnreadCountsQuery({
      channelType: 'voice',
    });
  const { data: presenceList } = useListCommunicationPresenceQuery();
  const [setPresenceRequest] = useSetCommunicationPresenceMutation();
  const [joinVoiceChannel] = useJoinVoiceChannelMutation();
  const [markChannelRead] = useMarkCommunicationChannelReadMutation();
  const [addParticipants, { isLoading: isAddingParticipants }] =
    useAddCommunicationChannelParticipantsMutation();
  const [removeParticipant, { isLoading: isRemovingParticipant }] =
    useRemoveCommunicationChannelParticipantMutation();
  const { data: managingChannelDetails } = useGetCommunicationChannelByIdQuery(
    managingChannel ? { id: managingChannel.id } : ({ id: '' } as { id: string }),
    { skip: !managingChannel },
  );

  const userLabelById = useMemo(
    () =>
      new Map(
        userOptions.map((option) => [option.id, option.fullname || option.email || option.id]),
      ),
    [userOptions],
  );

  const allUserTransferItems = useMemo(
    () =>
      userOptions.map((option) => ({
        id: option.id,
        label: option.fullname || option.email || option.id,
        subLabel: option.email,
      })),
    [userOptions],
  );

  const {
    isConnected: isSocketConnected,
    setPresence,
    requestCallParticipants,
  } = useCommunicationSocket({
    onThreadCreated: () => {
      refetchThreads();
      refetchUnreadCounts();
    },
    onMessageCreated: () => {
      refetchThreads();
      refetchUnreadCounts();
    },
    onCallCreated: () => {
      refetchCalls();
      refetchVoiceUnreadCounts();
    },
    onCallUpdated: () => {
      refetchCalls();
      refetchVoiceUnreadCounts();
    },
    onCallParticipantsUpdated: ({ callId, participants }) => {
      setCallParticipantsByCallId((prev) => ({
        ...prev,
        [callId]: {
          participants: participants.map((item) => ({
            userId: item.userId,
            isMuted: item.isMuted,
            isVideoOff: item.isVideoOff,
          })),
        },
      }));
    },
    onPresenceUpdated: (payload) => {
      setPresenceRows((prev) => {
        const index = prev.findIndex((item) => item.userId === payload.userId);
        if (index < 0) return [payload, ...prev];
        const next = [...prev];
        next[index] = payload;
        return next;
      });
    },
  });

  const { presenceStatus, joiningVoiceChannelId, onChangePresence, onJoinVoiceChannel } =
    useCommunicationChatActions({
      setPresence,
      setPresenceRequest,
      joinVoiceChannel,
      markChannelRead,
      navigate,
    });

  useEffect(() => {
    if (!presenceList) return;
    setPresenceRows(presenceList);
  }, [presenceList]);

  useEffect(() => {
    if (!isSocketConnected) return;
    setPresence(presenceStatus);
  }, [isSocketConnected, presenceStatus, setPresence]);

  useEffect(() => {
    if (!isSocketConnected || !activeCalls.length) return;
    for (const call of activeCalls) {
      requestCallParticipants(call.id);
    }
  }, [activeCalls, isSocketConnected, requestCallParticipants]);

  useEffect(() => {
    if (!managingChannelDetails?.participantUserIds) return;
    setChannelMemberIds(managingChannelDetails.participantUserIds);
  }, [managingChannelDetails]);

  const directThreads = useMemo(
    () => threads.filter((thread) => thread.threadType === 'direct'),
    [threads],
  );

  const textChannelThreadIds = useMemo(() => {
    const ids = textChannels
      .map((channel) => channel.threadId)
      .filter((id): id is string => Boolean(id));
    return new Set(ids);
  }, [textChannels]);

  const groupThreads = useMemo(
    () =>
      threads.filter(
        (thread) =>
          thread.threadType === 'group' ||
          (thread.threadType === 'channel' && !textChannelThreadIds.has(thread.id)),
      ),
    [textChannelThreadIds, threads],
  );

  const activeCallByChannelId = useMemo(() => {
    const map = new Map<string, (typeof activeCalls)[number]>();
    for (const call of activeCalls) {
      if (!call.channelId) continue;
      const existing = map.get(call.channelId);
      const existingTime = existing?.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
      const currentTime = call.updatedAt ? new Date(call.updatedAt).getTime() : 0;
      if (!existing || currentTime >= existingTime) {
        map.set(call.channelId, call);
      }
    }
    return map;
  }, [activeCalls]);

  const { unreadByThreadId, mentionsByThreadId, voiceUnreadByChannelId, voiceMentionsByChannelId } =
    useMemo(
      () => ({
        unreadByThreadId: new Map(unreadCounts.map((item) => [item.threadId, item.unreadCount])),
        mentionsByThreadId: new Map(unreadCounts.map((item) => [item.threadId, item.mentionCount])),
        voiceUnreadByChannelId: new Map(
          voiceUnreadCounts.map((item) => [item.channelId, item.unreadCount]),
        ),
        voiceMentionsByChannelId: new Map(
          voiceUnreadCounts.map((item) => [item.channelId, item.mentionCount]),
        ),
      }),
      [unreadCounts, voiceUnreadCounts],
    );

  const onSaveChannelMembers = async () => {
    if (!managingChannel || !managingChannelDetails) return;
    await saveChannelMembers({
      managingChannelId: managingChannel.id,
      initialParticipantUserIds: managingChannelDetails.participantUserIds ?? [],
      channelMemberIds,
      addParticipants,
      removeParticipant,
      onSuccess: () => {
        setManagingChannel(null);
        refetchTextChannels();
        refetchVoiceChannels();
      },
    });
  };

  const onRefresh = () => {
    refetchThreads();
    refetchTextChannels();
    refetchVoiceChannels();
    refetchCalls();
    refetchVoiceUnreadCounts();
  };

  return {
    isSocketConnected,
    threadTypeFilter,
    setThreadTypeFilter,
    presenceStatus,
    onChangePresence,
    presenceRows,
    openSections,
    toggleSection,
    directThreads,
    groupThreads,
    textChannels,
    voiceChannels,
    isLoadingThreads,
    isLoadingTextChannels,
    isLoadingVoiceChannels,
    selectedThreadId,
    selectedCallId,
    unreadByThreadId,
    mentionsByThreadId,
    voiceUnreadByChannelId,
    voiceMentionsByChannelId,
    activeCallByChannelId,
    callParticipantsByCallId,
    joiningVoiceChannelId,
    userLabelById,
    onJoinVoiceChannel,
    onRefresh,
    navigateToWorkspace,
    navigateToCreate,
    navigateToThread,
    managingChannel,
    setManagingChannel,
    channelMemberIds,
    setChannelMemberIds,
    allUserTransferItems,
    onSaveChannelMembers,
    isAddingParticipants,
    isRemovingParticipant,
  };
}
