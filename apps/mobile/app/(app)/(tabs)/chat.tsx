import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import { AppCard, AppInput, AppSkeletonCard } from '@mobile/components/ui';
import { ChannelListItem, StatCard } from '@mobile/components/courier';
import {
  joinCommunicationVoiceChannel,
  listCommunicationChannelUnreadCounts,
  listCommunicationChannels,
  markCommunicationChannelRead,
} from '@mobile/lib/api';
import { notifyError } from '@mobile/lib/notify';
import { useCommunicationSocket } from '@mobile/features/communication/use-communication-socket';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { CommunicationChannel } from '@mobile/types/communication';
import { mobileSpacing, mobileTypography } from '@mobile/theme/layout';

export default function ChatChannelsTab() {
  const { theme } = useAppearance();
  const { session, withAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [channels, setChannels] = useState<CommunicationChannel[]>([]);
  const [unreadById, setUnreadById] = useState<Record<string, number>>({});
  const [joiningVoiceId, setJoiningVoiceId] = useState<string | null>(null);

  const loadChannels = useCallback(async () => {
    setLoading(true);
    try {
      const [channelRows, unreadRows] = await withAuth(async (token) =>
        Promise.all([
          listCommunicationChannels(token),
          listCommunicationChannelUnreadCounts(token),
        ]),
      );
      setChannels(channelRows);
      setUnreadById(
        unreadRows.reduce<Record<string, number>>((acc, item) => {
          acc[item.channelId] = item.unreadCount;
          return acc;
        }, {}),
      );
    } catch (error) {
      notifyError(
        'Channels load failed',
        error instanceof Error ? error.message : 'Unable to load channels',
      );
    } finally {
      setLoading(false);
    }
  }, [withAuth]);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  const { isConnected } = useCommunicationSocket(session.accessToken, {
    onMessageCreated: () => void loadChannels(),
    onThreadCreated: () => void loadChannels(),
    onCallCreated: () => void loadChannels(),
    onCallUpdated: () => void loadChannels(),
  });

  const filteredChannels = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return channels;
    return channels.filter((channel) => {
      const haystack = `${channel.name} ${channel.description ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [channels, search]);

  const textChannels = useMemo(
    () =>
      filteredChannels.filter((channel) => String(channel.channelType).toLowerCase() === 'text'),
    [filteredChannels],
  );
  const voiceChannels = useMemo(
    () =>
      filteredChannels.filter((channel) => String(channel.channelType).toLowerCase() === 'voice'),
    [filteredChannels],
  );

  const totalUnread = useMemo(
    () => Object.values(unreadById).reduce((sum, value) => sum + value, 0),
    [unreadById],
  );

  const openTextChannel = async (channel: CommunicationChannel) => {
    if (!channel.threadId) return;
    try {
      await withAuth((token) => markCommunicationChannelRead(token, { id: channel.id }));
    } catch {
      // Non-blocking for navigation.
    }
    router.push({
      pathname: '/communication/thread/[threadId]' as never,
      params: {
        threadId: channel.threadId,
        title: `#${channel.name}`,
      },
    });
  };

  const openVoiceChannel = async (channel: CommunicationChannel) => {
    setJoiningVoiceId(channel.id);
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
    } catch (error) {
      notifyError(
        'Voice join failed',
        error instanceof Error ? error.message : 'Unable to join voice channel',
      );
    } finally {
      setJoiningVoiceId(null);
    }
  };

  return (
    <AppScreen refreshing={loading} onRefresh={() => void loadChannels()}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Channels</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
        Text and voice channels with unread activity.
      </Text>

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Socket" value={isConnected ? 'Live' : 'Offline'} />
          <StatCard
            label="Text"
            value={channels.filter((c) => String(c.channelType).toLowerCase() === 'text').length}
          />
          <StatCard
            label="Voice"
            value={channels.filter((c) => String(c.channelType).toLowerCase() === 'voice').length}
          />
          <StatCard label="Unread" value={totalUnread} />
        </View>
      </AppCard>

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Search</Text>
        <AppInput value={search} onChangeText={setSearch} placeholder="Search channels..." />
      </AppCard>

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Text Channels</Text>
        {loading ? (
          <View style={styles.listWrap}>
            <AppSkeletonCard lines={3} />
            <AppSkeletonCard lines={3} />
          </View>
        ) : textChannels.length === 0 ? (
          <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
            No text channels found.
          </Text>
        ) : (
          <View style={styles.listWrap}>
            {textChannels.map((channel) => (
              <ChannelListItem
                key={channel.id}
                name={channel.name}
                description={channel.description}
                unreadCount={unreadById[channel.id] ?? 0}
                onPress={() => void openTextChannel(channel)}
              />
            ))}
          </View>
        )}
      </AppCard>

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Voice Channels</Text>
        {loading ? (
          <View style={styles.listWrap}>
            <AppSkeletonCard lines={3} />
            <AppSkeletonCard lines={3} />
          </View>
        ) : voiceChannels.length === 0 ? (
          <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>
            No voice channels found.
          </Text>
        ) : (
          <View style={styles.listWrap}>
            {voiceChannels.map((channel) => (
              <ChannelListItem
                key={channel.id}
                name={joiningVoiceId === channel.id ? `${channel.name} (joining...)` : channel.name}
                description={channel.description}
                unreadCount={unreadById[channel.id] ?? 0}
                onPress={() => void openVoiceChannel(channel)}
              />
            ))}
          </View>
        )}
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: mobileTypography.title, fontWeight: '800' },
  subtitle: { marginTop: -2, lineHeight: 20 },
  sectionTitle: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
  listWrap: { gap: mobileSpacing.sm },
  empty: { textAlign: 'center', marginTop: mobileSpacing.sm },
});
