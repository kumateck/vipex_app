import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import {
  addCommunicationChannelParticipants,
  createCommunicationChannel,
  joinCommunicationVoiceChannel,
  listCommunicationCalls,
  listCommunicationChannelUnreadCounts,
  listCommunicationChannels,
  listCommunicationThreads,
  listCommunicationUnreadCounts,
  listMobileUserOptions,
  markCommunicationChannelRead,
  updateCommunicationChannel,
} from '@mobile/lib/api';
import { notifyError } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type {
  CommunicationCallSession,
  CommunicationChannel,
  CommunicationThread,
} from '@mobile/types/communication';
import type { MobileUserOption } from '@mobile/types/communication';
import { useCommunicationSocket } from '@mobile/features/communication/use-communication-socket';
import {
  loadChannelNotificationPrefs,
  saveChannelNotificationPrefs,
  type ChannelNotificationMode,
} from '@mobile/lib/communication-local';
import { AppButton, AppCard, AppInput, AppSkeletonCard } from '@/components/ui/mobile';
import { mobileSpacing, mobileTypography } from '@mobile/theme/layout';

type CommunicationLoadState = {
  threads: CommunicationThread[];
  textChannels: CommunicationChannel[];
  voiceChannels: CommunicationChannel[];
  users: MobileUserOption[];
  activeCalls: CommunicationCallSession[];
  threadUnreadById: Map<string, { unread: number; mentions: number }>;
  voiceUnreadById: Map<string, { unread: number; mentions: number }>;
};

function formatTime(value?: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
}

export default function CommunicationTabScreen() {
  const { theme } = useAppearance();
  const { withAuth, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [joiningChannelId, setJoiningChannelId] = useState<string | null>(null);
  const [callOccupancyByCallId, setCallOccupancyByCallId] = useState<Record<string, number>>({});
  const [userOptions, setUserOptions] = useState<MobileUserOption[]>([]);
  const [channelNotifModes, setChannelNotifModes] = useState<
    Record<string, ChannelNotificationMode>
  >({});
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createChannelType, setCreateChannelType] = useState<'text' | 'voice'>('text');
  const [createVisibility, setCreateVisibility] = useState<'public' | 'private'>('public');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [creatingChannel, setCreatingChannel] = useState(false);
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
        ] = await Promise.all([
          listCommunicationThreads(token),
          listCommunicationChannels(token, { channelType: 'text' }),
          listCommunicationChannels(token, { channelType: 'voice' }),
          listCommunicationUnreadCounts(token),
          listCommunicationChannelUnreadCounts(token, { channelType: 'voice' }),
          listCommunicationCalls(token, { status: 'active' }),
          listMobileUserOptions(token),
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
          activeCalls,
          threadUnreadById,
          voiceUnreadById,
        } as CommunicationLoadState;
      });
      setData(next);
      setUserOptions(next.users);
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
  const activeCallByChannelId = useMemo(() => {
    const map = new Map<string, CommunicationCallSession>();
    for (const call of data.activeCalls) {
      if (!call.channelId) continue;
      map.set(call.channelId, call);
    }
    return map;
  }, [data.activeCalls]);

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

  const onCreateChannel = async () => {
    const name = createName.trim();
    if (!name) return;
    setCreatingChannel(true);
    try {
      await withAuth((token) =>
        createCommunicationChannel(token, {
          name,
          description: createDescription.trim() || null,
          channelType: createChannelType,
          visibility: createVisibility,
          participantUserIds: createVisibility === 'private' ? selectedParticipantIds : [],
          isCallEnabled: createChannelType === 'voice',
        }),
      );
      setCreateName('');
      setCreateDescription('');
      setSelectedParticipantIds([]);
      await loadData();
    } catch (error) {
      notifyError(
        'Create channel failed',
        error instanceof Error ? error.message : 'Unable to create channel',
      );
    } finally {
      setCreatingChannel(false);
    }
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
        DMs, channels, and always-available voice rooms on mobile.
      </Text>
      <Text style={[styles.socketLabel, { color: theme.colors.textSubtle }]}>
        Socket: {isSocketConnected ? 'Live' : 'Offline'}
      </Text>

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Create Channel</Text>
        <AppInput value={createName} onChangeText={setCreateName} placeholder="Channel name" />
        <AppInput
          value={createDescription}
          onChangeText={setCreateDescription}
          placeholder="Description (optional)"
        />
        <View style={styles.controlsRow}>
          <AppButton
            title={`Type: ${createChannelType}`}
            onPress={() => setCreateChannelType((prev) => (prev === 'text' ? 'voice' : 'text'))}
            variant="secondary"
          />
          <AppButton
            title={`Visibility: ${createVisibility}`}
            onPress={() =>
              setCreateVisibility((prev) => (prev === 'public' ? 'private' : 'public'))
            }
            variant="secondary"
          />
        </View>
        {createVisibility === 'private' ? (
          <View style={styles.userPills}>
            {userOptions.slice(0, 20).map((user) => {
              const selected = selectedParticipantIds.includes(user.id);
              return (
                <Pressable
                  key={user.id}
                  onPress={() =>
                    setSelectedParticipantIds((prev) =>
                      selected ? prev.filter((id) => id !== user.id) : [...prev, user.id],
                    )
                  }
                  style={[
                    styles.userPill,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: selected ? theme.colors.primary : theme.colors.cardMuted,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selected ? theme.colors.primaryText : theme.colors.text,
                      fontSize: 12,
                    }}
                  >
                    {user.fullname}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <AppButton
          title={creatingChannel ? 'Creating...' : 'Create Channel'}
          onPress={() => void onCreateChannel()}
          disabled={creatingChannel || createName.trim().length === 0}
        />
      </AppCard>

      {loading ? (
        <>
          <AppSkeletonCard lines={3} />
          <AppSkeletonCard lines={3} />
          <AppSkeletonCard lines={3} />
        </>
      ) : (
        <>
          <SectionTitle title="Direct Messages" />
          {directThreads.length ? (
            directThreads.map((thread) => {
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
                    <Text style={[styles.rowTitle, { color: theme.colors.text }]}>
                      {thread.title ?? 'Direct chat'}
                    </Text>
                    <Text style={[styles.rowSub, { color: theme.colors.textSubtle }]}>
                      {formatTime(thread.lastMessageAt)}
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
                </Pressable>
              );
            })
          ) : (
            <EmptyText />
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
                    <Text style={[styles.rowTitle, { color: theme.colors.text }]}>
                      {thread.title ?? 'Group'}
                    </Text>
                    <Text style={[styles.rowSub, { color: theme.colors.textSubtle }]}>
                      {formatTime(thread.lastMessageAt)}
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
                </Pressable>
              );
            })
          ) : (
            <EmptyText />
          )}

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
            <EmptyText />
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
                    style={[
                      styles.voiceButton,
                      {
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
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
            <EmptyText />
          )}
        </>
      )}
    </AppScreen>
  );
}

function SectionTitle({ title }: { title: string }) {
  const { theme } = useAppearance();
  return <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>{title}</Text>;
}

function EmptyText() {
  const { theme } = useAppearance();
  return <Text style={{ color: theme.colors.textSubtle }}>No items yet.</Text>;
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
  rowTitle: { fontSize: 15, fontWeight: '700' },
  rowSub: { fontSize: 12 },
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
  userPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  userPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  manageWrap: { marginTop: mobileSpacing.sm, gap: 8 },
  voiceButton: {
    marginTop: mobileSpacing.sm,
    borderRadius: 12,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
