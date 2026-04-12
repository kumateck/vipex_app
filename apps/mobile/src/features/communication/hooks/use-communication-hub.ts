import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listCommunicationCalls,
  listCommunicationChannelUnreadCounts,
  listCommunicationChannels,
  listCommunicationEngagementRequests,
  listCommunicationEngagementRequestTargets,
  listCommunicationThreads,
  listCommunicationUnreadCounts,
  listMobileUserOptions,
} from '@mobile/lib/api';
import {
  loadChannelNotificationPrefs,
  type ChannelNotificationMode,
} from '@mobile/lib/communication-local';
import { notifyError } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
import { useCommunicationSocket } from '@mobile/features/communication/use-communication-socket';
import {
  EMPTY_DATA,
  toActiveCallByChannelId,
  toChatEntries,
  toUserEntries,
} from './use-communication-hub-helpers';
import {
  buildCurrentUserTypingIdentitySet,
  buildDirectThreadByUserId,
  dedupeMobileUserOptions,
  dedupeRequestTargets,
  normalizeIdentity,
} from '@mobile/features/communication/utils/hub-dedupe';
import type { CommunicationLoadState, CommunicationTabKey, UserChatEntry } from '../types';
import { useCommunicationHubActions } from './use-communication-hub-actions';

export function useCommunicationHub() {
  const { withAuth, session } = useAuth();
  const currentUser = session.user;
  const currentUserId = currentUser?.sub ?? null;

  const [activeTab, setActiveTab] = useState<CommunicationTabKey>('chats');
  const [loading, setLoading] = useState(true);
  const [joiningChannelId, setJoiningChannelId] = useState<string | null>(null);
  const [startingUserId, setStartingUserId] = useState<string | null>(null);
  const [selectedRequestTargetId, setSelectedRequestTargetId] = useState<string | null>(null);
  const [requestReasonNote, setRequestReasonNote] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [decidingRequestId, setDecidingRequestId] = useState<string | null>(null);
  const [callOccupancyByCallId, setCallOccupancyByCallId] = useState<Record<string, number>>({});
  const [typingByThreadId, setTypingByThreadId] = useState<Record<string, boolean>>({});
  const [channelNotifModes, setChannelNotifModes] = useState<
    Record<string, ChannelNotificationMode>
  >({});
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editingChannelName, setEditingChannelName] = useState('');
  const [editingArchive, setEditingArchive] = useState(false);
  const [participantInput, setParticipantInput] = useState('');
  const [updatingChannel, setUpdatingChannel] = useState(false);
  const [data, setData] = useState<CommunicationLoadState>(EMPTY_DATA);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const next = await withAuth(async (token) => {
        const [
          threads,
          textChannels,
          voiceChannels,
          threadUnread,
          voiceUnread,
          activeCalls,
          users,
          requestTargets,
          incomingRequests,
          outgoingRequests,
        ] = await Promise.all([
          listCommunicationThreads(token),
          listCommunicationChannels(token, { channelType: 'text' }),
          listCommunicationChannels(token, { channelType: 'voice' }),
          listCommunicationUnreadCounts(token),
          listCommunicationChannelUnreadCounts(token, { channelType: 'voice' }),
          listCommunicationCalls(token, { status: 'active' }),
          listMobileUserOptions(token),
          listCommunicationEngagementRequestTargets(token),
          listCommunicationEngagementRequests(token, { view: 'incoming', status: 'pending' }),
          listCommunicationEngagementRequests(token, { view: 'outgoing', status: 'pending' }),
        ]);

        const dedupedUsers = dedupeMobileUserOptions(users);
        const dedupedRequestTargets = dedupeRequestTargets(requestTargets);

        return {
          threads,
          textChannels,
          voiceChannels,
          users: dedupedUsers,
          requestTargets: dedupedRequestTargets,
          incomingRequests,
          outgoingRequests,
          activeCalls,
          threadUnreadById: new Map(
            threadUnread.map((item) => [
              item.threadId,
              { unread: item.unreadCount, mentions: item.mentionCount },
            ]),
          ),
          voiceUnreadById: new Map(
            voiceUnread.map((item) => [
              item.channelId,
              { unread: item.unreadCount, mentions: item.mentionCount },
            ]),
          ),
        } as CommunicationLoadState;
      });
      setData(next);
    } catch (error) {
      notifyError(
        'Communication load failed',
        error instanceof Error ? error.message : 'Unable to load communication data',
      );
    } finally {
      setLoading(false);
    }
  }, [withAuth]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void loadChannelNotificationPrefs().then(setChannelNotifModes);
  }, []);
  const currentUserTypingIdentitySet = useMemo(() => {
    return buildCurrentUserTypingIdentitySet({
      currentUserId,
      currentUserEmail: currentUser?.email,
      currentUserFullname: currentUser?.fullname,
      users: data.users,
    });
  }, [currentUser?.email, currentUser?.fullname, currentUserId, data.users]);

  const { isConnected, requestCallParticipants } = useCommunicationSocket(session.accessToken, {
    onThreadCreated: () => void loadData(),
    onMessageCreated: () => void loadData(),
    onCallCreated: () => void loadData(),
    onCallUpdated: () => void loadData(),
    onCallParticipantsUpdated: ({ callId, participants }) => {
      setCallOccupancyByCallId((prev) => ({ ...prev, [callId]: participants.length }));
    },
    onTypingUpdated: ({ threadId, userId, isTyping }) => {
      if (!threadId || !userId) return;
      if (currentUserTypingIdentitySet.has(normalizeIdentity(userId))) return;
      setTypingByThreadId((prev) => ({ ...prev, [threadId]: isTyping }));
    },
  });

  useEffect(() => {
    if (!isConnected) return;
    data.activeCalls.forEach((call) => requestCallParticipants(call.id));
  }, [data.activeCalls, isConnected, requestCallParticipants]);

  const directThreads = useMemo(
    () => data.threads.filter((thread) => thread.threadType === 'direct'),
    [data.threads],
  );
  const groupThreads = useMemo(
    () => data.threads.filter((thread) => thread.threadType === 'group'),
    [data.threads],
  );
  const userById = useMemo(() => new Map(data.users.map((user) => [user.id, user])), [data.users]);
  const directThreadByUserId = useMemo(
    () => buildDirectThreadByUserId(directThreads),
    [directThreads],
  );
  const requestTargetIdSet = useMemo(
    () => new Set(data.requestTargets.map((target) => target.id)),
    [data.requestTargets],
  );
  const activeCallByChannelId = useMemo(
    () => toActiveCallByChannelId(data.activeCalls),
    [data.activeCalls],
  );

  const userEntries = useMemo<UserChatEntry[]>(
    () =>
      toUserEntries({
        users: data.users,
        currentUserId,
        currentUser: currentUser ?? null,
        requestTargetIdSet,
      }),
    [currentUser, currentUserId, data.users, requestTargetIdSet],
  );

  const chatEntries = useMemo<UserChatEntry[]>(
    () => toChatEntries({ directThreadByUserId, userById }),
    [directThreadByUserId, userById],
  );

  const usersWithoutThread = useMemo(
    () => userEntries.filter((entry) => !directThreadByUserId.has(entry.id)),
    [directThreadByUserId, userEntries],
  );

  const requestableUsers = useMemo(
    () => usersWithoutThread.filter((entry) => entry.requiresRequest && entry.canRequest),
    [usersWithoutThread],
  );

  useEffect(() => {
    if (!selectedRequestTargetId) return;
    const exists = requestableUsers.some((entry) => entry.id === selectedRequestTargetId);
    if (!exists) setSelectedRequestTargetId(null);
  }, [requestableUsers, selectedRequestTargetId]);

  const actions = useCommunicationHubActions({
    withAuth,
    loadData,
    dataThreads: data.threads,
    requestableUsers,
    selectedRequestTargetId,
    requestReasonNote,
    channelNotifModes,
    editingChannelId,
    editingChannelName,
    editingArchive,
    participantInput,
    setActiveTab,
    setSelectedRequestTargetId,
    setStartingUserId,
    setIsSubmittingRequest,
    setDecidingRequestId,
    setJoiningChannelId,
    setChannelNotifModes,
    setUpdatingChannel,
    setRequestReasonNote,
    setParticipantInput,
  });

  return {
    activeTab,
    setActiveTab,
    loading,
    loadData,
    data,
    directThreads,
    groupThreads,
    activeCallByChannelId,
    chatEntries,
    requestableUsers,
    userEntries: usersWithoutThread,
    selectedRequestTargetId,
    setSelectedRequestTargetId,
    requestReasonNote,
    setRequestReasonNote,
    isSubmittingRequest,
    decidingRequestId,
    callOccupancyByCallId,
    typingByThreadId,
    channelNotifModes,
    joiningChannelId,
    startingUserId,
    editingChannelId,
    editingChannelName,
    setEditingChannelName,
    editingArchive,
    setEditingArchive,
    participantInput,
    setParticipantInput,
    updatingChannel,
    setEditingChannelId,
    ...actions,
  };
}
