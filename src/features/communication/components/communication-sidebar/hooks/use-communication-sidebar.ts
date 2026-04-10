import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BranchType } from '@/db/schemas/enums';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import { useAuthStore } from '@/stores/auth-store';
import {
  useApproveCommunicationEngagementRequestMutation,
  useCreateCommunicationEngagementRequestMutation,
  useDeclineCommunicationEngagementRequestMutation,
  useCreateCommunicationThreadMutation,
  useJoinVoiceChannelMutation,
  useListCommunicationCallsQuery,
  useListCommunicationChannelsQuery,
  useListCommunicationEngagementRequestsQuery,
  useListCommunicationEngagementTargetsQuery,
  useListCommunicationPresenceQuery,
  useListCommunicationThreadsQuery,
  useListCommunicationUnreadCountsQuery,
  useMarkCommunicationChannelReadMutation,
} from '../../../api/communication.api';
import { useCommunicationActivityState } from './use-communication-activity-state';
import type { ChatContact } from '../types/communication-sidebar.types';

function toInitials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (!parts.length) return '?';
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export function useCommunicationSidebar() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?.id ?? null;
  const [startingUserId, setStartingUserId] = useState<string | null>(null);
  const [joiningVoiceChannelId, setJoiningVoiceChannelId] = useState<string | null>(null);
  const { typingUserIdsByThread, draftByThreadId } = useCommunicationActivityState({
    currentUserId,
  });

  const { data: userOptions = [], isLoading: isLoadingUsers } = useListUserOptionsQuery();
  const { data: directThreads = [] } = useListCommunicationThreadsQuery({ threadType: 'direct' });
  const { data: textChannels = [], isLoading: isLoadingTextChannels } =
    useListCommunicationChannelsQuery({ channelType: 'text' });
  const { data: voiceChannels = [], isLoading: isLoadingVoiceChannels } =
    useListCommunicationChannelsQuery({ channelType: 'voice' });
  const { data: activeCalls = [] } = useListCommunicationCallsQuery({ status: 'active' });
  const { data: presenceRows = [] } = useListCommunicationPresenceQuery();
  const { data: unreadCounts = [] } = useListCommunicationUnreadCountsQuery();
  const { data: requestTargets = [], isLoading: isLoadingRequestTargets } =
    useListCommunicationEngagementTargetsQuery();
  const { data: incomingRequests = [], isLoading: isLoadingIncomingRequests } =
    useListCommunicationEngagementRequestsQuery({ view: 'incoming', status: 'pending' });
  const { data: outgoingRequests = [], isLoading: isLoadingOutgoingRequests } =
    useListCommunicationEngagementRequestsQuery({ view: 'outgoing', status: 'pending' });

  const [createThread] = useCreateCommunicationThreadMutation();
  const [joinVoiceChannel] = useJoinVoiceChannelMutation();
  const [markChannelRead] = useMarkCommunicationChannelReadMutation();
  const [createEngagementRequest, { isLoading: isCreatingRequest }] =
    useCreateCommunicationEngagementRequestMutation();
  const [approveEngagementRequest, { isLoading: isApprovingRequest }] =
    useApproveCommunicationEngagementRequestMutation();
  const [declineEngagementRequest, { isLoading: isDecliningRequest }] =
    useDeclineCommunicationEngagementRequestMutation();

  const presenceByUserId = useMemo(
    () => new Map(presenceRows.map((row) => [row.userId, row.status])),
    [presenceRows],
  );

  const directThreadByUserId = useMemo(() => {
    const map = new Map<string, (typeof directThreads)[number]>();
    for (const thread of directThreads) {
      if (!thread.directPeerUserId) continue;
      map.set(thread.directPeerUserId, thread);
    }
    return map;
  }, [directThreads]);

  const unreadByThreadId = useMemo(
    () => new Map(unreadCounts.map((row) => [row.threadId, row.unreadCount])),
    [unreadCounts],
  );
  const mentionsByThreadId = useMemo(
    () => new Map(unreadCounts.map((row) => [row.threadId, row.mentionCount])),
    [unreadCounts],
  );

  const contacts = useMemo<ChatContact[]>(
    () =>
      userOptions
        .filter((userOption) => userOption.id !== currentUserId)
        .map((userOption) => {
          const thread = directThreadByUserId.get(userOption.id) ?? null;
          const isTyping = thread
            ? (typingUserIdsByThread[thread.id] ?? []).includes(userOption.id)
            : false;
          const presence = presenceByUserId.get(userOption.id);
          const currentBranchId = currentUser?.branch?.id ?? null;
          const currentLocationId = currentUser?.location?.id ?? currentUser?.locationId ?? null;
          const isHeadOffice = currentUser?.branch?.type === BranchType.HEADOFFICE;
          const sameBranch = Boolean(currentBranchId && userOption.branchId === currentBranchId);
          const sameLocation = Boolean(
            currentLocationId && userOption.locationId === currentLocationId,
          );
          const canDirect = isHeadOffice
            ? true
            : currentLocationId
              ? sameBranch && sameLocation
              : sameBranch;
          const requiresRequest = !canDirect;

          return {
            id: userOption.id,
            fullname: userOption.fullname,
            initials: toInitials(userOption.fullname),
            roleName: userOption.roleName ?? null,
            branchName: userOption.branchName ?? null,
            locationName: userOption.locationName ?? null,
            threadId: thread?.id ?? null,
            lastMessageAt: thread?.lastMessageAt ?? null,
            draftMessage: thread?.id ? (draftByThreadId[thread.id] ?? null) : null,
            unreadCount: thread?.id ? (unreadByThreadId.get(thread.id) ?? 0) : 0,
            mentionCount: thread?.id ? (mentionsByThreadId.get(thread.id) ?? 0) : 0,
            isOnline: presence === 'online',
            isTyping,
            requiresRequest,
          };
        })
        .sort((a, b) => {
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          if (aTime !== bTime) return bTime - aTime;
          return a.fullname.localeCompare(b.fullname);
        }),
    [
      currentUser?.branch?.id,
      currentUser?.branch?.type,
      currentUser?.location?.id,
      currentUser?.locationId,
      currentUserId,
      directThreadByUserId,
      draftByThreadId,
      mentionsByThreadId,
      presenceByUserId,
      typingUserIdsByThread,
      unreadByThreadId,
      userOptions,
    ],
  );

  const chatContacts = useMemo(
    () => contacts.filter((contact) => Boolean(contact.threadId)),
    [contacts],
  );

  const colleagueContacts = useMemo(
    () => contacts.filter((contact) => !contact.threadId),
    [contacts],
  );

  const startDirectChat = async (user: {
    id: string;
    fullname?: string | null;
    email?: string | null;
  }) => {
    const userId = user.id;
    const optimisticTitle = user.fullname?.trim() || user.email?.trim() || null;
    const existingThread = directThreadByUserId.get(userId);
    if (existingThread?.id) {
      navigate(`/communication/chat/${existingThread.id}`, {
        state: { optimisticThreadTitle: optimisticTitle },
      });
      return;
    }

    setStartingUserId(userId);
    try {
      const thread = await createThread({
        threadType: 'direct',
        participantUserIds: [userId],
        title: optimisticTitle,
      }).unwrap();
      navigate(`/communication/chat/${thread.id}`, {
        state: { optimisticThreadTitle: optimisticTitle },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to open chat.';
      toast.error(message);
    } finally {
      setStartingUserId(null);
    }
  };

  const requestDirectChat = async (input: { targetUserId: string; reasonNote?: string | null }) => {
    try {
      await createEngagementRequest({
        targetUserId: input.targetUserId,
        reasonNote: input.reasonNote ?? null,
      }).unwrap();
      toast.success('Chat request sent.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send chat request.';
      toast.error(message);
    }
  };

  const approveChatRequest = async (id: string) => {
    try {
      await approveEngagementRequest({ id }).unwrap();
      toast.success('Chat request approved. Direct thread created.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve request.';
      toast.error(message);
    }
  };

  const declineChatRequest = async (id: string) => {
    try {
      await declineEngagementRequest({ id }).unwrap();
      toast.success('Chat request declined.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to decline request.';
      toast.error(message);
    }
  };

  const openTextChannel = (threadId: string | null) => {
    if (!threadId) {
      navigate('/communication/chat');
      return;
    }
    navigate(`/communication/chat/${threadId}`);
  };

  const openVoiceChannel = async (channelId: string) => {
    setJoiningVoiceChannelId(channelId);
    try {
      const activeCall = activeCalls.find((call) => call.channelId === channelId);
      if (activeCall) {
        await markChannelRead({ id: channelId }).unwrap();
        navigate(`/communication/calls/${activeCall.id}`);
        return;
      }

      const joined = await joinVoiceChannel({ channelId }).unwrap();
      await markChannelRead({ id: channelId }).unwrap();
      navigate(`/communication/calls/${joined.call.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join voice channel.';
      toast.error(message);
    } finally {
      setJoiningVoiceChannelId(null);
    }
  };

  const openCreateChannel = (channelType: 'text' | 'voice') => {
    navigate(`/communication/chat/create?target=channel&channelType=${channelType}`);
  };

  return {
    chatContacts,
    colleagueContacts,
    requestTargets,
    incomingRequests,
    outgoingRequests,
    textChannels,
    voiceChannels,
    activeCalls,
    isLoadingUsers,
    isLoadingRequestTargets,
    isLoadingIncomingRequests,
    isLoadingOutgoingRequests,
    isLoadingTextChannels,
    isLoadingVoiceChannels,
    joiningVoiceChannelId,
    startingUserId,
    isCreatingRequest,
    isApprovingRequest,
    isDecliningRequest,
    startDirectChat,
    requestDirectChat,
    approveChatRequest,
    declineChatRequest,
    openTextChannel,
    openVoiceChannel,
    openCreateChannel,
  };
}
