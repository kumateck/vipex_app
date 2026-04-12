import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { createCommunicationSidebarActions } from './use-communication-sidebar-actions';
import {
  buildCurrentUserIdentitySet,
  choosePreferredDirectThread,
  toInitials,
} from './use-communication-sidebar-helpers';
import type { ChatContact } from '../types/communication-sidebar.types';

export function useCommunicationSidebar() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?.id ?? null;
  const currentUserIdentitySet = useMemo(
    () =>
      buildCurrentUserIdentitySet({
        id: currentUser?.id,
        email: currentUser?.email,
        fullname: currentUser?.fullname,
        employeeId: currentUser?.employeeId ?? null,
      }),
    [currentUser?.email, currentUser?.employeeId, currentUser?.fullname, currentUser?.id],
  );
  const [startingUserId, setStartingUserId] = useState<string | null>(null);
  const [joiningVoiceChannelId, setJoiningVoiceChannelId] = useState<string | null>(null);
  const { typingUserIdsByThread, draftByThreadId } = useCommunicationActivityState({
    currentUserIdentitySet,
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
      const existing = map.get(thread.directPeerUserId);
      map.set(
        thread.directPeerUserId,
        existing ? choosePreferredDirectThread(existing, thread) : thread,
      );
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
  const userOptionById = useMemo(() => {
    const map = new Map<string, (typeof userOptions)[number]>();
    userOptions.forEach((option) => {
      if (!map.has(option.id)) {
        map.set(option.id, option);
        return;
      }
      const existing = map.get(option.id)!;
      map.set(option.id, { ...existing, ...option });
    });
    return map;
  }, [userOptions]);
  const currentBranchId = currentUser?.branch?.id ?? null;
  const currentLocationId = currentUser?.location?.id ?? currentUser?.locationId ?? null;
  const isHeadOffice = currentUser?.branch?.type === BranchType.HEADOFFICE;
  const chatContacts = useMemo<ChatContact[]>(
    () =>
      [...directThreadByUserId.values()]
        .filter((thread) => Boolean(thread.directPeerUserId))
        .map((thread) => {
          const peerId = thread.directPeerUserId!;
          const userOption = userOptionById.get(peerId);
          const isTyping = thread
            ? (typingUserIdsByThread[thread.id] ?? []).includes(peerId)
            : false;
          const presence = presenceByUserId.get(peerId);
          const label = userOption?.fullname?.trim() || thread.title?.trim() || 'Unknown user';
          return {
            id: peerId,
            fullname: label,
            initials: toInitials(label),
            roleName: userOption?.roleName ?? null,
            branchName: userOption?.branchName ?? null,
            locationName: userOption?.locationName ?? null,
            threadId: thread.id,
            lastMessageAt: thread.lastMessageAt ?? null,
            draftMessage: draftByThreadId[thread.id] ?? null,
            unreadCount: unreadByThreadId.get(thread.id) ?? 0,
            mentionCount: mentionsByThreadId.get(thread.id) ?? 0,
            isOnline: presence === 'online',
            isTyping,
            requiresRequest: false,
          };
        })
        .sort((a, b) => {
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          if (aTime !== bTime) return bTime - aTime;
          return a.fullname.localeCompare(b.fullname);
        }),
    [
      directThreadByUserId,
      draftByThreadId,
      mentionsByThreadId,
      presenceByUserId,
      typingUserIdsByThread,
      unreadByThreadId,
      userOptionById,
    ],
  );
  const colleagueContacts = useMemo(
    () =>
      [...userOptionById.values()]
        .filter(
          (userOption) =>
            userOption.id !== currentUserId && !directThreadByUserId.has(userOption.id),
        )
        .map((userOption) => {
          const sameBranch = Boolean(currentBranchId && userOption.branchId === currentBranchId);
          const sameLocation = Boolean(
            currentLocationId && userOption.locationId === currentLocationId,
          );
          const canDirect = isHeadOffice
            ? true
            : currentLocationId
              ? sameBranch && sameLocation
              : sameBranch;
          return {
            id: userOption.id,
            fullname: userOption.fullname,
            initials: toInitials(userOption.fullname),
            roleName: userOption.roleName ?? null,
            branchName: userOption.branchName ?? null,
            locationName: userOption.locationName ?? null,
            threadId: null,
            lastMessageAt: null,
            draftMessage: null,
            unreadCount: 0,
            mentionCount: 0,
            isOnline: presenceByUserId.get(userOption.id) === 'online',
            isTyping: false,
            requiresRequest: !canDirect,
          } satisfies ChatContact;
        })
        .sort((a, b) => a.fullname.localeCompare(b.fullname)),
    [
      currentBranchId,
      currentLocationId,
      currentUserId,
      directThreadByUserId,
      isHeadOffice,
      presenceByUserId,
      userOptionById,
    ],
  );
  const actions = createCommunicationSidebarActions({
    navigate,
    directThreadByUserId: directThreadByUserId as Map<
      string,
      { id: string; title?: string | null }
    >,
    activeCalls,
    setStartingUserId,
    setJoiningVoiceChannelId,
    createThread,
    joinVoiceChannel,
    markChannelRead,
    createEngagementRequest,
    approveEngagementRequest,
    declineEngagementRequest,
  });
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
    ...actions,
  };
}
