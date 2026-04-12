import { Pressable, Text, View } from 'react-native';
import { AppButton, AppCard } from '@/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { CommunicationCallSession, CommunicationChannel } from '@mobile/types/communication';
import type { ChannelNotificationMode } from '@mobile/lib/communication-local';
import { BadgeText, EmptyText, SectionTitle, hubStyles } from '../hub-ui';

export function ChannelsTabPane({
  textChannels,
  voiceChannels,
  threadUnreadById,
  voiceUnreadById,
  channelNotifModes,
  activeCallByChannelId,
  callOccupancyByCallId,
  joiningChannelId,
  onOpenTextChannel,
  onCycleNotificationMode,
  onJoinVoice,
}: {
  textChannels: CommunicationChannel[];
  voiceChannels: CommunicationChannel[];
  threadUnreadById: Map<string, { unread: number; mentions: number }>;
  voiceUnreadById: Map<string, { unread: number; mentions: number }>;
  channelNotifModes: Record<string, ChannelNotificationMode>;
  activeCallByChannelId: Map<string, CommunicationCallSession>;
  callOccupancyByCallId: Record<string, number>;
  joiningChannelId: string | null;
  onOpenTextChannel: (channel: CommunicationChannel) => void;
  onCycleNotificationMode: (channelId: string) => void;
  onJoinVoice: (channel: CommunicationChannel) => void;
}) {
  const { theme } = useAppearance();

  return (
    <>
      <SectionTitle title="Text Channels" />
      {textChannels.length ? (
        textChannels.map((channel) => {
          const unread = channel.threadId ? threadUnreadById.get(channel.threadId) : undefined;
          return (
            <Pressable
              key={channel.id}
              style={[
                hubStyles.row,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
              ]}
              onPress={() => onOpenTextChannel(channel)}
              onLongPress={() => onCycleNotificationMode(channel.id)}
            >
              <View style={hubStyles.rowMain}>
                <Text style={[hubStyles.rowTitle, { color: theme.colors.text }]}>
                  #{channel.name}
                </Text>
                <Text style={[hubStyles.rowSub, { color: theme.colors.textSubtle }]}>
                  {channel.visibility} • {channel.participantCount} members
                </Text>
              </View>
              <View style={hubStyles.badges}>
                {unread?.mentions ? (
                  <BadgeText value={`@${unread.mentions}`} tone="danger" />
                ) : null}
                {unread?.unread ? <BadgeText value={`${unread.unread}`} tone="primary" /> : null}
                <BadgeText value={channelNotifModes[channel.id] ?? 'all'} tone="primary" />
              </View>
            </Pressable>
          );
        })
      ) : (
        <EmptyText value="No text channels found." />
      )}

      <SectionTitle title="Voice Channels" />
      {voiceChannels.length ? (
        voiceChannels.map((channel) => {
          const activeCall = activeCallByChannelId.get(channel.id);
          const unread = voiceUnreadById.get(channel.id);
          const occupancy = activeCall ? (callOccupancyByCallId[activeCall.id] ?? 0) : 0;
          return (
            <AppCard key={channel.id}>
              <View style={hubStyles.voiceHeader}>
                <View style={hubStyles.rowMain}>
                  <Text style={[hubStyles.rowTitle, { color: theme.colors.text }]}>
                    {channel.name}
                  </Text>
                  <Text style={[hubStyles.rowSub, { color: theme.colors.textSubtle }]}>
                    {channel.visibility} voice • {activeCall ? `Live (${occupancy})` : 'Idle'}
                  </Text>
                </View>
                <View style={hubStyles.badges}>
                  {unread?.mentions ? (
                    <BadgeText value={`@${unread.mentions}`} tone="danger" />
                  ) : null}
                  {unread?.unread ? <BadgeText value={`${unread.unread}`} tone="primary" /> : null}
                </View>
              </View>

              <Pressable
                style={[hubStyles.voiceButton, { backgroundColor: theme.colors.primary }]}
                disabled={joiningChannelId === channel.id}
                onPress={() => onJoinVoice(channel)}
              >
                <Text style={{ color: theme.colors.primaryText, fontWeight: '700' }}>
                  {joiningChannelId === channel.id ? 'Joining...' : 'Join Voice'}
                </Text>
              </Pressable>

              <View style={hubStyles.controlsRow}>
                <AppButton
                  title={`Notif: ${channelNotifModes[channel.id] ?? 'all'}`}
                  onPress={() => onCycleNotificationMode(channel.id)}
                  variant="secondary"
                />
              </View>
            </AppCard>
          );
        })
      ) : (
        <EmptyText value="No voice channels found." />
      )}
    </>
  );
}
