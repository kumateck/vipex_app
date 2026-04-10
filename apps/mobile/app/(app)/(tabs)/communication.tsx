import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import {
  addCommunicationChannelParticipants,
  approveCommunicationEngagementRequest,
  createCommunicationEngagementRequest,
  createCommunicationThread,
  declineCommunicationEngagementRequest,
  joinCommunicationVoiceChannel,
  listCommunicationCalls,
  listCommunicationChannelUnreadCounts,
  listCommunicationChannels,
  listCommunicationEngagementRequests,
  listCommunicationEngagementRequestTargets,
  listCommunicationThreads,
  listCommunicationUnreadCounts,
  listMobileUserOptions,
  markCommunicationChannelRead,
  updateCommunicationChannel,
} from '@mobile/lib/api';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type {
  CommunicationCallSession,
  CommunicationChannel,
  CommunicationEngagementRequest,
  CommunicationEngagementRequestTarget,
  CommunicationThread,
  MobileUserOption,
} from '@mobile/types/communication';
import { useCommunicationSocket } from '@mobile/features/communication/use-communication-socket';
import {
  loadChannelNotificationPrefs,
  saveChannelNotificationPrefs,
  type ChannelNotificationMode,
} from '@mobile/lib/communication-local';
import { AppButton, AppCard, AppInput, AppSkeletonCard } from '@/components/ui/mobile';
import { mobileSpacing, mobileTypography } from '@mobile/theme/layout';

type CommunicationTabKey = 'chats' | 'channels' | 'users' | 'requests';

type CommunicationLoadState = {
  threads: CommunicationThread[];
  textChannels: CommunicationChannel[];
  voiceChannels: CommunicationChannel[];
  users: MobileUserOption[];
  requestTargets: CommunicationEngagementRequestTarget[];
  incomingRequests: CommunicationEngagementRequest[];
  outgoingRequests: CommunicationEngagementRequest[];
  activeCalls: CommunicationCallSession[];
  threadUnreadById: Map<string, { unread: number; mentions: number }>;
  voiceUnreadById: Map<string, { unread: number; mentions: number }>;
};

type UserChatEntry = {
  id: string;
  fullname: string;
  roleName: string | null;
  branchName: string | null;
  locationName: string | null;
  thread: CommunicationThread | null;
  requiresRequest: boolean;
  canRequest: boolean;
};

const TAB_OPTIONS: Array<{ key: CommunicationTabKey; label: string }> = [
  { key: 'chats', label: 'Chats' },
  { key: 'channels', label: 'Channels' },
  { key: 'users', label: 'Users' },
  { key: 'requests', label: 'Requests' },
];

function formatTime(value?: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
}

export default function CommunicationTabScreen() {
  const { theme } = useAppearance();
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
  const [channelNotifModes, setChannelNotifModes] = useState<
    Record<string, ChannelNotificationMode>
  >({});
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editingChannelName, setEditingChannelName] = useState('');
  const [editingArchive, setEditingArchive] = useState(false);
  const [participantInput, setParticipantInput] = useState('');
  const [updatingChannel, setUpdatingChannel] = useState(false);
  const [data, setData] = useState<CommunicationLoadState>({
    threads: [],
    textChannels: [],
    voiceChannels: [],
    users: [],
    requestTargets: [],
    incomingRequests: [],
    outgoingRequests: [],
    activeCalls: [],
    threadUnreadById: new Map(),
    voiceUnreadById: new Map(),
  });

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

        const threadUnreadById = new Map<string, { unread: number; mentions: number }>(
          threadUnread.map((item) => [
            item.threadId,
            { unread: item.unreadCount, mentions: item.mentionCount },
          ]),
        );
        const voiceUnreadById = new Map<string, { unread: number; mentions: number }>(
          voiceUnread.map((item) => [
            item.channelId,
            { unread: item.unreadCount, mentions: item.mentionCount },
          ]),
        );

        return {
          threads,
          textChannels,
          voiceChannels,
          users,
          requestTargets,
          incomingRequests,
          outgoingRequests,
          activeCalls,
          threadUnreadById,
          voiceUnreadById,
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
    void (async () => {
      const prefs = await loadChannelNotificationPrefs();
      setChannelNotifModes(prefs);
    })();
  }, []);

  const { isConnected: isSocketConnected, requestCallParticipants } = useCommunicationSocket(
    session.accessToken,
    {
      onThreadCreated: () => void loadData(),
      onMessageCreated: () => void loadData(),
      onCallCreated: () => void loadData(),
      onCallUpdated: () => void loadData(),
      onCallParticipantsUpdated: ({ callId, participants }) => {
        setCallOccupancyByCallId((prev) => ({ ...prev, [callId]: participants.length }));
      },
    },
  );

  useEffect(() => {
    if (!isSocketConnected) return;
    for (const call of data.activeCalls) {
      requestCallParticipants(call.id);
    }
  }, [data.activeCalls, isSocketConnected, requestCallParticipants]);

  const directThreads = useMemo(
    () => data.threads.filter((thread) => thread.threadType === 'direct'),
    [data.threads],
  );
  const groupThreads = useMemo(
    () => data.threads.filter((thread) => thread.threadType === 'group'),
    [data.threads],
  );
  const directThreadByUserId = useMemo(() => {
    const map = new Map<string, CommunicationThread>();
    for (const thread of directThreads) {
      if (!thread.directPeerUserId) continue;
      map.set(thread.directPeerUserId, thread);
    }
    return map;
  }, [directThreads]);
  const requestTargetIdSet = useMemo(
    () => new Set(data.requestTargets.map((target) => target.id)),
    [data.requestTargets],
  );
  const activeCallByChannelId = useMemo(() => {
    const map = new Map<string, CommunicationCallSession>();
    for (const call of data.activeCalls) {
      if (!call.channelId) continue;
      map.set(call.channelId, call);
    }
    return map;
  }, [data.activeCalls]);

  const userEntries = useMemo<UserChatEntry[]>(() => {
    const branchType = currentUser?.branch?.type ?? currentUser?.branchType ?? null;
    const isHeadOffice = branchType === 0;
    const currentBranchId = currentUser?.branch?.id ?? currentUser?.branchId ?? null;
    const currentLocationId = currentUser?.location?.id ?? null;

    return data.users
      .filter((user) => user.id !== currentUserId)
      .map((user) => {
        const thread = directThreadByUserId.get(user.id) ?? null;
        const sameBranch = Boolean(currentBranchId && user.branchId === currentBranchId);
        const sameLocation = Boolean(currentLocationId && user.locationId === currentLocationId);
        const canDirect = isHeadOffice
          ? true
          : currentLocationId
            ? sameBranch && sameLocation
            : sameBranch;
        const requiresRequest = !canDirect;
        const canRequest = requestTargetIdSet.has(user.id);

        return {
          id: user.id,
          fullname: user.fullname,
          roleName: user.roleName ?? null,
          branchName: user.branchName ?? null,
          locationName: user.locationName ?? null,
          thread,
          requiresRequest,
          canRequest,
        };
      })
      .sort((a, b) => {
        const aTime = a.thread?.lastMessageAt ? new Date(a.thread.lastMessageAt).getTime() : 0;
        const bTime = b.thread?.lastMessageAt ? new Date(b.thread.lastMessageAt).getTime() : 0;
        if (aTime !== bTime) return bTime - aTime;
        return a.fullname.localeCompare(b.fullname);
      });
  }, [currentUser, currentUserId, data.users, directThreadByUserId, requestTargetIdSet]);

  const chatEntries = useMemo(
    () => userEntries.filter((entry) => Boolean(entry.thread)),
    [userEntries],
  );
  const requestableUsers = useMemo(
    () => userEntries.filter((entry) => !entry.thread && entry.requiresRequest && entry.canRequest),
    [userEntries],
  );

  const selectedRequestTarget = useMemo(
    () => requestableUsers.find((entry) => entry.id === selectedRequestTargetId) ?? null,
    [requestableUsers, selectedRequestTargetId],
  );

  useEffect(() => {
    if (!selectedRequestTargetId) return;
    const stillExists = requestableUsers.some((entry) => entry.id === selectedRequestTargetId);
    if (!stillExists) setSelectedRequestTargetId(null);
  }, [requestableUsers, selectedRequestTargetId]);

  const openThread = (thread: CommunicationThread) => {
    router.push({
      pathname: '/communication/thread/[threadId]' as never,
      params: {
        threadId: thread.id,
        title: thread.title ?? 'Thread',
      },
    });
  };

  const openTextChannel = (channel: CommunicationChannel) => {
    if (!channel.threadId) return;
    router.push({
      pathname: '/communication/thread/[threadId]' as never,
      params: {
        threadId: channel.threadId,
        title: `#${channel.name}`,
      },
    });
  };

  const startDirectChat = async (entry: UserChatEntry) => {
    if (entry.thread) {
      openThread(entry.thread);
      return;
    }
    if (entry.requiresRequest) {
      setSelectedRequestTargetId(entry.id);
      setActiveTab('requests');
      return;
    }

    setStartingUserId(entry.id);
    try {
      const created = await withAuth((token) =>
        createCommunicationThread(token, {
          threadType: 'direct',
          participantUserIds: [entry.id],
          title: entry.fullname,
        }),
      );
      notifySuccess('Chat thread created.');
      openThread(created);
      await loadData();
    } catch (error) {
      notifyError(
        'Chat start failed',
        error instanceof Error ? error.message : 'Unable to start direct chat',
      );
    } finally {
      setStartingUserId(null);
    }
  };

  const submitChatRequest = async () => {
    if (!selectedRequestTarget) {
      notifyError('Request target required', 'Select one user to request chat access.');
      return;
    }
    setIsSubmittingRequest(true);
    try {
      await withAuth((token) =>
        createCommunicationEngagementRequest(token, {
          targetUserId: selectedRequestTarget.id,
          reasonNote: requestReasonNote.trim() || null,
        }),
      );
      notifySuccess('Chat request sent.');
      setRequestReasonNote('');
      setSelectedRequestTargetId(null);
      await loadData();
    } catch (error) {
      notifyError(
        'Request failed',
        error instanceof Error ? error.message : 'Unable to submit chat request',
      );
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const decideRequest = async (requestId: string, approve: boolean) => {
    setDecidingRequestId(requestId);
    try {
      await withAuth((token) =>
        approve
          ? approveCommunicationEngagementRequest(token, { id: requestId })
          : declineCommunicationEngagementRequest(token, { id: requestId }),
      );
      notifySuccess(approve ? 'Request approved.' : 'Request declined.');
      await loadData();
    } catch (error) {
      notifyError(
        approve ? 'Approve failed' : 'Decline failed',
        error instanceof Error ? error.message : 'Unable to decide request',
      );
    } finally {
      setDecidingRequestId(null);
    }
  };

  const joinVoice = async (channel: CommunicationChannel) => {
    setJoiningChannelId(channel.id);
    try {
      const joined = await withAuth((token) =>
        joinCommunicationVoiceChannel(token, { channelId: channel.id }),
      );
      await withAuth((token) => markCommunicationChannelRead(token, { id: channel.id }));
      router.push({
        pathname: '/communication/voice/[channelId]' as never,
        params: {
          channelId: channel.id,
          name: channel.name,
          callId: joined.call.id,
          roomName: joined.livekit.roomName,
        },
      });
      await loadData();
    } catch (error) {
      notifyError(
        'Voice join failed',
        error instanceof Error ? error.message : 'Unable to join voice channel',
      );
    } finally {
      setJoiningChannelId(null);
    }
  };

  const cycleNotificationMode = async (channelId: string) => {
    const current = channelNotifModes[channelId] ?? 'all';
    const next: ChannelNotificationMode =
      current === 'all' ? 'mentions' : current === 'mentions' ? 'mute' : 'all';
    const merged = { ...channelNotifModes, [channelId]: next };
    setChannelNotifModes(merged);
    await saveChannelNotificationPrefs(merged);
  };

  const onSaveChannelSettings = async () => {
    if (!editingChannelId) return;
    setUpdatingChannel(true);
    try {
      await withAuth((token) =>
        updateCommunicationChannel(token, {
          id: editingChannelId,
          name: editingChannelName.trim() || undefined,
          isArchived: editingArchive,
        }),
      );
      if (participantInput.trim()) {
        const ids = participantInput
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean);
        if (ids.length) {
          await withAuth((token) =>
            addCommunicationChannelParticipants(token, {
              id: editingChannelId,
              participantUserIds: ids,
            }),
          );
        }
      }
      setParticipantInput('');
      await loadData();
    } catch (error) {
      notifyError(
        'Update channel failed',
        error instanceof Error ? error.message : 'Unable to update channel settings',
      );
    } finally {
      setUpdatingChannel(false);
    }
  };

  return (
    <AppScreen refreshing={loading} onRefresh={() => void loadData()}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Communication</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
        WhatsApp-style chat on mobile: chats, channels, users, and requests.
      </Text>
      <Text style={[styles.socketLabel, { color: theme.colors.textSubtle }]}>
        Socket: {isSocketConnected ? 'Live' : 'Offline'}
      </Text>

      <View
        style={[
          styles.tabsWrap,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.cardMuted },
        ]}
      >
        {TAB_OPTIONS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabButton,
                {
                  backgroundColor: active ? theme.colors.primary : 'transparent',
                },
              ]}
            >
              <Text
                style={{
                  color: active ? theme.colors.primaryText : theme.colors.text,
                  fontWeight: '700',
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <>
          <AppSkeletonCard lines={3} />
          <AppSkeletonCard lines={3} />
          <AppSkeletonCard lines={3} />
        </>
      ) : null}

      {!loading && activeTab === 'chats' ? (
        <>
          <SectionTitle title="Direct Chats" />
          {chatEntries.length ? (
            chatEntries.map((entry) => {
              const thread = entry.thread!;
              const unread = data.threadUnreadById.get(thread.id);
              return (
                <Pressable
                  key={entry.id}
                  style={[
                    styles.row,
                    { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
                  ]}
                  onPress={() => openThread(thread)}
                >
                  <View style={styles.rowMain}>
                    <Text numberOfLines={1} style={[styles.rowTitle, { color: theme.colors.text }]}>
                      {entry.fullname}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.rowSub, { color: theme.colors.textSubtle }]}
                    >
                      {[entry.roleName, entry.branchName, entry.locationName]
                        .filter(Boolean)
                        .join(' • ') || 'Conversation'}
                    </Text>
                  </View>
                  <View style={styles.rowMeta}>
                    <Text style={[styles.rowTime, { color: theme.colors.textSubtle }]}>
                      {formatTime(thread.lastMessageAt)}
                    </Text>
                    <View style={styles.badges}>
                      {unread?.mentions ? (
                        <BadgeText value={`@${unread.mentions}`} tone="danger" />
                      ) : null}
                      {unread?.unread ? (
                        <BadgeText value={`${unread.unread}`} tone="primary" />
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            })
          ) : (
            <EmptyText value="No chats yet." />
          )}

          <SectionTitle title="Group Chats" />
          {groupThreads.length ? (
            groupThreads.map((thread) => {
              const unread = data.threadUnreadById.get(thread.id);
              return (
                <Pressable
                  key={thread.id}
                  style={[
                    styles.row,
                    { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
                  ]}
                  onPress={() => openThread(thread)}
                >
                  <View style={styles.rowMain}>
                    <Text numberOfLines={1} style={[styles.rowTitle, { color: theme.colors.text }]}>
                      {thread.title ?? 'Group chat'}
                    </Text>
                    <Text style={[styles.rowSub, { color: theme.colors.textSubtle }]}>
                      {thread.participantCount ?? 0} participants
                    </Text>
                  </View>
                  <View style={styles.rowMeta}>
                    <Text style={[styles.rowTime, { color: theme.colors.textSubtle }]}>
                      {formatTime(thread.lastMessageAt)}
                    </Text>
                    <View style={styles.badges}>
                      {unread?.mentions ? (
                        <BadgeText value={`@${unread.mentions}`} tone="danger" />
                      ) : null}
                      {unread?.unread ? (
                        <BadgeText value={`${unread.unread}`} tone="primary" />
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            })
          ) : (
            <EmptyText value="No group chats yet." />
          )}
        </>
      ) : null}

      {!loading && activeTab === 'channels' ? (
        <>
          <SectionTitle title="Text Channels" />
          {data.textChannels.length ? (
            data.textChannels.map((channel) => {
              const unread = channel.threadId
                ? data.threadUnreadById.get(channel.threadId)
                : undefined;
              return (
                <Pressable
                  key={channel.id}
                  style={[
                    styles.row,
                    { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
                  ]}
                  onPress={() => openTextChannel(channel)}
                  onLongPress={() => void cycleNotificationMode(channel.id)}
                >
                  <View style={styles.rowMain}>
                    <Text style={[styles.rowTitle, { color: theme.colors.text }]}>
                      #{channel.name}
                    </Text>
                    <Text style={[styles.rowSub, { color: theme.colors.textSubtle }]}>
                      {channel.visibility} • {channel.participantCount} members
                    </Text>
                  </View>
                  <View style={styles.badges}>
                    {unread?.mentions ? (
                      <BadgeText value={`@${unread.mentions}`} tone="danger" />
                    ) : null}
                    {unread?.unread ? (
                      <BadgeText value={`${unread.unread}`} tone="primary" />
                    ) : null}
                    <BadgeText value={channelNotifModes[channel.id] ?? 'all'} tone="primary" />
                  </View>
                </Pressable>
              );
            })
          ) : (
            <EmptyText value="No text channels found." />
          )}

          <SectionTitle title="Voice Channels" />
          {data.voiceChannels.length ? (
            data.voiceChannels.map((channel) => {
              const activeCall = activeCallByChannelId.get(channel.id);
              const unread = data.voiceUnreadById.get(channel.id);
              const occupancy = activeCall ? (callOccupancyByCallId[activeCall.id] ?? 0) : 0;
              return (
                <AppCard key={channel.id}>
                  <View style={styles.voiceHeader}>
                    <View style={styles.rowMain}>
                      <Text style={[styles.rowTitle, { color: theme.colors.text }]}>
                        {channel.name}
                      </Text>
                      <Text style={[styles.rowSub, { color: theme.colors.textSubtle }]}>
                        {channel.visibility} voice • {activeCall ? `Live (${occupancy})` : 'Idle'}
                      </Text>
                    </View>
                    <View style={styles.badges}>
                      {unread?.mentions ? (
                        <BadgeText value={`@${unread.mentions}`} tone="danger" />
                      ) : null}
                      {unread?.unread ? (
                        <BadgeText value={`${unread.unread}`} tone="primary" />
                      ) : null}
                    </View>
                  </View>
                  <Pressable
                    style={[styles.voiceButton, { backgroundColor: theme.colors.primary }]}
                    disabled={joiningChannelId === channel.id}
                    onPress={() => void joinVoice(channel)}
                  >
                    <Text style={{ color: theme.colors.primaryText, fontWeight: '700' }}>
                      {joiningChannelId === channel.id ? 'Joining...' : 'Join Voice'}
                    </Text>
                  </Pressable>
                  <View style={styles.controlsRow}>
                    <AppButton
                      title={`Notif: ${channelNotifModes[channel.id] ?? 'all'}`}
                      onPress={() => void cycleNotificationMode(channel.id)}
                      variant="secondary"
                    />
                    <AppButton
                      title={editingChannelId === channel.id ? 'Hide Manage' : 'Manage'}
                      onPress={() => {
                        setEditingChannelId((prev) => (prev === channel.id ? null : channel.id));
                        setEditingChannelName(channel.name);
                        setEditingArchive(Boolean(channel.isArchived));
                      }}
                      variant="secondary"
                    />
                  </View>
                  {editingChannelId === channel.id ? (
                    <View style={styles.manageWrap}>
                      <AppInput
                        value={editingChannelName}
                        onChangeText={setEditingChannelName}
                        placeholder="Channel name"
                      />
                      <AppInput
                        value={participantInput}
                        onChangeText={setParticipantInput}
                        placeholder="Add participant user IDs (comma separated)"
                      />
                      <View style={styles.controlsRow}>
                        <AppButton
                          title={editingArchive ? 'Archived' : 'Active'}
                          onPress={() => setEditingArchive((prev) => !prev)}
                          variant="secondary"
                        />
                        <AppButton
                          title={updatingChannel ? 'Saving...' : 'Save'}
                          onPress={() => void onSaveChannelSettings()}
                          disabled={updatingChannel}
                        />
                      </View>
                    </View>
                  ) : null}
                </AppCard>
              );
            })
          ) : (
            <EmptyText value="No voice channels found." />
          )}
        </>
      ) : null}

      {!loading && activeTab === 'users' ? (
        <>
          <SectionTitle title="People You Can Reach" />
          {userEntries.length ? (
            userEntries.map((entry) => (
              <AppCard key={entry.id}>
                <View style={styles.userRow}>
                  <View style={styles.rowMain}>
                    <Text numberOfLines={1} style={[styles.rowTitle, { color: theme.colors.text }]}>
                      {entry.fullname}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.rowSub, { color: theme.colors.textSubtle }]}
                    >
                      {[entry.roleName, entry.branchName, entry.locationName]
                        .filter(Boolean)
                        .join(' • ') || 'No profile metadata'}
                    </Text>
                  </View>
                  {entry.thread ? (
                    <AppButton title="Open" onPress={() => openThread(entry.thread!)} />
                  ) : entry.requiresRequest ? (
                    <AppButton
                      title={selectedRequestTargetId === entry.id ? 'Selected' : 'Request'}
                      onPress={() => {
                        setSelectedRequestTargetId(entry.id);
                        setActiveTab('requests');
                      }}
                      disabled={!entry.canRequest}
                      variant="secondary"
                    />
                  ) : (
                    <AppButton
                      title={startingUserId === entry.id ? 'Starting...' : 'Chat'}
                      onPress={() => void startDirectChat(entry)}
                      disabled={startingUserId === entry.id}
                    />
                  )}
                </View>
              </AppCard>
            ))
          ) : (
            <EmptyText value="No users available." />
          )}
        </>
      ) : null}

      {!loading && activeTab === 'requests' ? (
        <>
          <SectionTitle title="New Request" />
          <AppCard>
            <Text style={[styles.rowSub, { color: theme.colors.textSubtle }]}>
              Bottom-up chat needs approval. Select one target and send request.
            </Text>
            <View style={styles.controlsRow}>
              {requestableUsers.slice(0, 30).map((entry) => (
                <Pressable
                  key={entry.id}
                  onPress={() => setSelectedRequestTargetId(entry.id)}
                  style={[
                    styles.requestTargetPill,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor:
                        selectedRequestTargetId === entry.id
                          ? theme.colors.primary
                          : theme.colors.cardMuted,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color:
                        selectedRequestTargetId === entry.id
                          ? theme.colors.primaryText
                          : theme.colors.text,
                      fontWeight: '700',
                      fontSize: 12,
                    }}
                  >
                    {entry.fullname}
                  </Text>
                </Pressable>
              ))}
            </View>
            <AppInput
              value={requestReasonNote}
              onChangeText={setRequestReasonNote}
              placeholder={
                selectedRequestTarget
                  ? `Reason for ${selectedRequestTarget.fullname} (optional)`
                  : 'Select one user to request'
              }
            />
            <AppButton
              title={isSubmittingRequest ? 'Sending...' : 'Send Request'}
              onPress={() => void submitChatRequest()}
              disabled={!selectedRequestTarget || isSubmittingRequest}
            />
          </AppCard>

          <SectionTitle title="Incoming Requests" />
          {data.incomingRequests.length ? (
            data.incomingRequests.map((request) => (
              <AppCard key={request.id}>
                <Text style={[styles.rowTitle, { color: theme.colors.text }]}>
                  {request.requesterFullname ?? 'Requester'}
                </Text>
                <Text style={[styles.rowSub, { color: theme.colors.textSubtle }]}>
                  {[
                    request.requesterRoleName,
                    request.requesterBranchName,
                    request.requesterLocationName,
                  ]
                    .filter(Boolean)
                    .join(' • ') || 'No profile metadata'}
                </Text>
                <Text style={[styles.rowSub, { color: theme.colors.textSubtle }]}>
                  {request.reasonNote?.trim() ? request.reasonNote : 'No reason provided'}
                </Text>
                <View style={styles.controlsRow}>
                  <AppButton
                    title={decidingRequestId === request.id ? 'Approving...' : 'Approve'}
                    onPress={() => void decideRequest(request.id, true)}
                    disabled={decidingRequestId === request.id}
                  />
                  <AppButton
                    title={decidingRequestId === request.id ? 'Declining...' : 'Decline'}
                    onPress={() => void decideRequest(request.id, false)}
                    disabled={decidingRequestId === request.id}
                    variant="secondary"
                  />
                </View>
              </AppCard>
            ))
          ) : (
            <EmptyText value="No incoming requests." />
          )}

          <SectionTitle title="Outgoing Requests" />
          {data.outgoingRequests.length ? (
            data.outgoingRequests.map((request) => (
              <AppCard key={request.id}>
                <Text style={[styles.rowTitle, { color: theme.colors.text }]}>
                  {request.targetFullname ?? 'Target user'}
                </Text>
                <Text style={[styles.rowSub, { color: theme.colors.textSubtle }]}>
                  {[request.targetRoleName, request.targetBranchName, request.targetLocationName]
                    .filter(Boolean)
                    .join(' • ') || 'No profile metadata'}
                </Text>
                <Text style={[styles.rowSub, { color: theme.colors.textSubtle }]}>
                  Sent {formatTime(request.createdAt)}
                </Text>
              </AppCard>
            ))
          ) : (
            <EmptyText value="No outgoing requests." />
          )}
        </>
      ) : null}
    </AppScreen>
  );
}

function SectionTitle({ title }: { title: string }) {
  const { theme } = useAppearance();
  return <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>{title}</Text>;
}

function EmptyText({ value }: { value: string }) {
  const { theme } = useAppearance();
  return <Text style={{ color: theme.colors.textSubtle }}>{value}</Text>;
}

function BadgeText({ value, tone }: { value: string; tone: 'primary' | 'danger' }) {
  const { theme } = useAppearance();
  const isDanger = tone === 'danger';
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: isDanger ? theme.colors.danger : theme.colors.primary,
        },
      ]}
    >
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: mobileTypography.title, fontWeight: '800' },
  subtitle: { marginTop: -2, lineHeight: 20, marginBottom: mobileSpacing.xs },
  socketLabel: { fontSize: 12, marginBottom: mobileSpacing.xs },
  tabsWrap: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tabButton: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: mobileTypography.sectionTitle,
    fontWeight: '700',
    marginTop: mobileSpacing.md,
  },
  row: {
    borderWidth: 1,
    borderRadius: 14,
    padding: mobileSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mobileSpacing.sm,
  },
  rowMain: { flex: 1, gap: 2 },
  rowMeta: { alignItems: 'flex-end', gap: 6 },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  rowSub: { fontSize: 12 },
  rowTime: { fontSize: 11 },
  badges: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  badge: {
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
    minWidth: 22,
    alignItems: 'center',
  },
  voiceHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: mobileSpacing.sm },
  controlsRow: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
  manageWrap: { marginTop: mobileSpacing.sm, gap: 8 },
  voiceButton: {
    marginTop: mobileSpacing.sm,
    borderRadius: 12,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm },
  requestTargetPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
