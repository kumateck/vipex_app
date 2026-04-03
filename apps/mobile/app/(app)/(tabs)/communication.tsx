import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import {
  joinCommunicationVoiceChannel,
  listCommunicationCalls,
  listCommunicationChannelUnreadCounts,
  listCommunicationChannels,
  listCommunicationThreads,
  listCommunicationUnreadCounts,
  markCommunicationChannelRead,
} from '@mobile/lib/api';
import { notifyError } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type {
  CommunicationCallSession,
  CommunicationChannel,
  CommunicationThread,
} from '@mobile/types/communication';
import { useCommunicationSocket } from '@mobile/features/communication/use-communication-socket';
import { AppCard, AppSkeletonCard } from '@/components/ui/mobile';
import { mobileSpacing, mobileTypography } from '@mobile/theme/layout';

type CommunicationLoadState = {
  threads: CommunicationThread[];
  textChannels: CommunicationChannel[];
  voiceChannels: CommunicationChannel[];
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
  const [data, setData] = useState<CommunicationLoadState>({
    threads: [],
    textChannels: [],
    voiceChannels: [],
    activeCalls: [],
    threadUnreadById: new Map(),
    voiceUnreadById: new Map(),
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const next = await withAuth(async (token) => {
        const [threads, textChannels, voiceChannels, threadUnread, voiceUnread, activeCalls] =
          await Promise.all([
            listCommunicationThreads(token),
            listCommunicationChannels(token, { channelType: 'text' }),
            listCommunicationChannels(token, { channelType: 'voice' }),
            listCommunicationUnreadCounts(token),
            listCommunicationChannelUnreadCounts(token, { channelType: 'voice' }),
            listCommunicationCalls(token, { status: 'active' }),
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

  return (
    <AppScreen refreshing={loading} onRefresh={() => void loadData()}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Communication</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
        DMs, channels, and always-available voice rooms on mobile.
      </Text>
      <Text style={[styles.socketLabel, { color: theme.colors.textSubtle }]}>
        Socket: {isSocketConnected ? 'Live' : 'Offline'}
      </Text>

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
  voiceButton: {
    marginTop: mobileSpacing.sm,
    borderRadius: 12,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
