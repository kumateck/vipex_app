import { Ionicons } from '@expo/vector-icons';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native';
import { AppButton } from '@/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTypography } from '@mobile/theme/layout';
import { VoiceCallTiles } from './voice-call-tiles';
import type { VoiceSocketParticipant } from '@mobile/features/communication/hooks/use-voice-channel';

type VoiceChannelStageProps = {
  loading: boolean;
  connected: boolean;
  joining: boolean;
  isSocketConnected: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  speakerOn: boolean;
  prejoinChecked: boolean;
  connectionQuality: 'good' | 'degraded' | 'poor' | 'unknown';
  audioRouteLabel: 'speaker' | 'earpiece' | 'default';
  channelName: string;
  videoTrackByUserId: Record<string, unknown>;
  orderedParticipants: VoiceSocketParticipant[];
  currentUserId: string | null;
  currentUserName: string | null;
  onRefresh: () => void;
  onJoin: () => void;
  onLeave: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleSpeaker: () => void;
  onRunPrejoinCheck: () => void;
};

export function VoiceChannelStage({
  loading,
  connected,
  joining,
  isSocketConnected,
  isMuted,
  isVideoOff,
  speakerOn,
  prejoinChecked,
  connectionQuality,
  audioRouteLabel,
  channelName,
  videoTrackByUserId,
  orderedParticipants,
  currentUserId,
  currentUserName,
  onRefresh,
  onJoin,
  onLeave,
  onToggleMute,
  onToggleCamera,
  onToggleSpeaker,
  onRunPrejoinCheck,
}: VoiceChannelStageProps) {
  const { theme } = useAppearance();
  const stageColors = connected
    ? {
        bg: '#0f1116',
        card: '#1a1d24',
        cardMuted: '#20242d',
        border: '#313745',
        text: '#f2f4f8',
        textMuted: '#b9c0cc',
        textSubtle: '#98a2b3',
      }
    : {
        bg: theme.colors.bg,
        card: theme.colors.card,
        cardMuted: theme.colors.cardMuted,
        border: theme.colors.border,
        text: theme.colors.text,
        textMuted: theme.colors.textMuted,
        textSubtle: theme.colors.textSubtle,
      };
  const qualityColor =
    connectionQuality === 'good'
      ? theme.colors.indicatorOnline
      : connectionQuality === 'poor'
        ? theme.colors.danger
        : connectionQuality === 'degraded'
          ? '#F59E0B'
          : theme.colors.textSubtle;

  return (
    <View style={[styles.root, { backgroundColor: stageColors.bg }]}>
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View
          style={[
            styles.heroCard,
            { borderColor: stageColors.border, backgroundColor: stageColors.card },
          ]}
        >
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: stageColors.text }]}>{channelName}</Text>
            <View style={styles.liveIndicatorWrap}>
              <View
                style={[
                  styles.liveIndicatorDot,
                  {
                    backgroundColor: isSocketConnected
                      ? theme.colors.indicatorOnline
                      : stageColors.textSubtle,
                  },
                ]}
              />
              <Text style={{ color: stageColors.textMuted, fontSize: 11, fontWeight: '700' }}>
                {isSocketConnected ? 'LIVE' : 'OFFLINE'}
              </Text>
            </View>
          </View>
          <View style={styles.heroMetaRow}>
            <View style={[styles.metaChip, { backgroundColor: stageColors.cardMuted }]}>
              <View style={[styles.qualityDot, { backgroundColor: qualityColor }]} />
              <Text style={{ color: stageColors.textMuted, fontSize: 12 }}>
                Quality {connectionQuality}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.sectionCard,
            { borderColor: stageColors.border, backgroundColor: stageColors.card },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: stageColors.text }]}>Pre-Join</Text>
          <Text style={{ color: stageColors.textSubtle }}>
            {connected
              ? `Call started. Mic: ${isMuted ? 'Muted' : 'On'} • Camera: ${isVideoOff ? 'Off' : 'On'} • Speaker: ${speakerOn ? 'On' : 'Off'}`
              : 'Mic, camera and speaker controls become active after Join.'}
          </Text>
          <Text style={{ color: stageColors.textSubtle }}>
            Audio Route: {audioRouteLabel} • Device Check: {prejoinChecked ? 'Done' : 'Pending'}
          </Text>
        </View>

        {connected ? (
          <View
            style={[
              styles.sectionCard,
              { borderColor: stageColors.border, backgroundColor: stageColors.card },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: stageColors.text }]}>
              In Call ({orderedParticipants.length || 1})
            </Text>
            <VoiceCallTiles
              participants={orderedParticipants}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              videoTrackByUserId={videoTrackByUserId}
              stageColors={stageColors}
            />
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.controlDock,
          { borderColor: stageColors.border, backgroundColor: stageColors.card },
        ]}
      >
        <View style={styles.iconDockRow}>
          <ControlIconButton
            icon={isMuted ? 'mic-off' : 'mic'}
            label={isMuted ? 'Unmute' : 'Mute'}
            active={connected && !isMuted}
            disabled={!connected}
            onPress={onToggleMute}
            primaryColor={theme.colors.primary}
            textColor={stageColors.text}
            mutedBg={stageColors.cardMuted}
          />
          <ControlIconButton
            icon={isVideoOff ? 'videocam-off' : 'videocam'}
            label={isVideoOff ? 'Camera Off' : 'Camera On'}
            active={connected && !isVideoOff}
            disabled={!connected}
            onPress={onToggleCamera}
            primaryColor={theme.colors.primary}
            textColor={stageColors.text}
            mutedBg={stageColors.cardMuted}
          />
          <ControlIconButton
            icon={speakerOn ? 'volume-high' : 'volume-mute'}
            label={speakerOn ? 'Speaker' : 'Earpiece'}
            active={connected && speakerOn}
            disabled={!connected}
            onPress={onToggleSpeaker}
            primaryColor={theme.colors.primary}
            textColor={stageColors.text}
            mutedBg={stageColors.cardMuted}
          />
        </View>
        {!connected ? (
          <>
            <AppButton title="Device Check" onPress={onRunPrejoinCheck} variant="secondary" />
            <AppButton
              title={joining ? 'Joining...' : 'Join'}
              onPress={onJoin}
              disabled={joining}
            />
          </>
        ) : (
          <AppButton title="Leave" onPress={onLeave} variant="secondary" />
        )}
      </View>
    </View>
  );
}

function ControlIconButton({
  icon,
  label,
  active,
  disabled,
  onPress,
  primaryColor,
  textColor,
  mutedBg,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
  primaryColor: string;
  textColor: string;
  mutedBg: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.iconButtonWrap, { opacity: disabled ? 0.55 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.iconButton, { backgroundColor: active ? primaryColor : mutedBg }]}>
        <Ionicons name={icon} size={20} color={active ? '#fff' : textColor} />
      </View>
      <Text style={[styles.iconButtonLabel, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  contentScroll: { flex: 1 },
  contentContainer: { gap: mobileSpacing.sm, paddingBottom: mobileSpacing.lg },
  heroCard: { borderWidth: 1, borderRadius: 14, padding: mobileSpacing.md, gap: 8 },
  sectionCard: { borderWidth: 1, borderRadius: 14, padding: mobileSpacing.md, gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  liveIndicatorWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveIndicatorDot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: mobileTypography.title, fontWeight: '800' },
  heroMetaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qualityDot: { width: 8, height: 8, borderRadius: 4 },
  list: { gap: 8 },
  sectionTitle: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  activityRow: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  controlDock: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 8,
    gap: 8,
    marginTop: mobileSpacing.xs,
  },
  iconDockRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  iconButtonWrap: { alignItems: 'center', gap: 6, flex: 1 },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonLabel: { fontSize: 11, fontWeight: '600' },
});
