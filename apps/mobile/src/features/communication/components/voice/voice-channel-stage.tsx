import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { createTheme } from '@mobile/theme/tokens';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { VoiceCallTiles } from './voice-call-tiles';
import { VoiceControlIconButton } from './voice-control-icon-button';
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
  // The in-call stage always renders in a dark "theatre" look (matching
  // platform call UIs like FaceTime) regardless of the user's light/dark
  // preference — sourced from the design system's own dark palette instead
  // of hand-rolled hex values.
  const stageColors = connected ? createTheme(theme.mode, 'dark').colors : theme.colors;
  const isStageDark = connected || theme.scheme === 'dark';
  const qualityColor =
    connectionQuality === 'good'
      ? theme.colors.indicatorOnline
      : connectionQuality === 'poor'
        ? theme.colors.danger
        : connectionQuality === 'degraded'
          ? theme.colors.warning
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
            mobileShadow.card,
            {
              backgroundColor: stageColors.card,
              borderColor: isStageDark ? stageColors.border : 'transparent',
              borderWidth: isStageDark ? StyleSheet.hairlineWidth : 0,
            },
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
                      : theme.colors.indicatorMuted,
                  },
                ]}
              />
              <Text style={[styles.liveIndicatorLabel, { color: stageColors.textMuted }]}>
                {isSocketConnected ? 'LIVE' : 'OFFLINE'}
              </Text>
            </View>
          </View>
          <View style={styles.heroMetaRow}>
            <View style={[styles.metaChip, { backgroundColor: stageColors.cardMuted }]}>
              <View style={[styles.qualityDot, { backgroundColor: qualityColor }]} />
              <Text style={[styles.metaChipText, { color: stageColors.textMuted }]}>
                Quality {connectionQuality}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.sectionCard,
            mobileShadow.card,
            {
              backgroundColor: stageColors.card,
              borderColor: isStageDark ? stageColors.border : 'transparent',
              borderWidth: isStageDark ? StyleSheet.hairlineWidth : 0,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: stageColors.text }]}>Pre-Join</Text>
          <Text style={[styles.sectionBody, { color: stageColors.textSubtle }]}>
            {connected
              ? `Call started. Mic: ${isMuted ? 'Muted' : 'On'} • Camera: ${isVideoOff ? 'Off' : 'On'} • Speaker: ${speakerOn ? 'On' : 'Off'}`
              : 'Mic, camera and speaker controls become active after Join.'}
          </Text>
          <Text style={[styles.sectionBody, { color: stageColors.textSubtle }]}>
            Audio Route: {audioRouteLabel} • Device Check: {prejoinChecked ? 'Done' : 'Pending'}
          </Text>
        </View>

        {connected ? (
          <View
            style={[
              styles.sectionCard,
              mobileShadow.card,
              {
                backgroundColor: stageColors.card,
                borderColor: isStageDark ? stageColors.border : 'transparent',
                borderWidth: isStageDark ? StyleSheet.hairlineWidth : 0,
              },
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
          mobileShadow.floating,
          {
            backgroundColor: stageColors.card,
            borderColor: isStageDark ? stageColors.border : 'transparent',
            borderWidth: isStageDark ? StyleSheet.hairlineWidth : 0,
          },
        ]}
      >
        <View style={styles.iconDockRow}>
          <VoiceControlIconButton
            icon={isMuted ? 'mic-off' : 'mic'}
            label={isMuted ? 'Unmute' : 'Mute'}
            active={connected && !isMuted}
            disabled={!connected}
            onPress={onToggleMute}
            primaryColor={theme.colors.primary}
            textColor={stageColors.text}
            mutedBg={stageColors.cardMuted}
            iconButtonWrapStyle={styles.iconButtonWrap}
            iconButtonStyle={styles.iconButton}
            iconButtonLabelStyle={styles.iconButtonLabel}
          />
          <VoiceControlIconButton
            icon={isVideoOff ? 'videocam-off' : 'videocam'}
            label={isVideoOff ? 'Camera Off' : 'Camera On'}
            active={connected && !isVideoOff}
            disabled={!connected}
            onPress={onToggleCamera}
            primaryColor={theme.colors.primary}
            textColor={stageColors.text}
            mutedBg={stageColors.cardMuted}
            iconButtonWrapStyle={styles.iconButtonWrap}
            iconButtonStyle={styles.iconButton}
            iconButtonLabelStyle={styles.iconButtonLabel}
          />
          <VoiceControlIconButton
            icon={speakerOn ? 'volume-high' : 'volume-mute'}
            label={speakerOn ? 'Speaker' : 'Earpiece'}
            active={connected && speakerOn}
            disabled={!connected}
            onPress={onToggleSpeaker}
            primaryColor={theme.colors.primary}
            textColor={stageColors.text}
            mutedBg={stageColors.cardMuted}
            iconButtonWrapStyle={styles.iconButtonWrap}
            iconButtonStyle={styles.iconButton}
            iconButtonLabelStyle={styles.iconButtonLabel}
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

const styles = StyleSheet.create({
  root: { flex: 1 },
  contentScroll: { flex: 1 },
  contentContainer: { gap: mobileSpacing.sm, paddingBottom: mobileSpacing.lg },
  heroCard: { borderRadius: mobileRadius.lg, padding: mobileSpacing.lg, gap: mobileSpacing.sm },
  sectionCard: { borderRadius: mobileRadius.lg, padding: mobileSpacing.lg, gap: mobileSpacing.sm },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mobileSpacing.sm,
  },
  liveIndicatorWrap: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.xs + 2 },
  liveIndicatorDot: { width: 8, height: 8, borderRadius: 4 },
  liveIndicatorLabel: { ...mobileTextStyles.caption2, fontWeight: '700' },
  title: { ...mobileTextStyles.title3 },
  heroMetaRow: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
  metaChip: {
    borderRadius: mobileRadius.pill,
    paddingHorizontal: mobileSpacing.md,
    paddingVertical: mobileSpacing.xs + 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mobileSpacing.xs + 2,
  },
  metaChipText: { ...mobileTextStyles.footnote },
  qualityDot: { width: 8, height: 8, borderRadius: 4 },
  list: { gap: mobileSpacing.sm },
  sectionTitle: { ...mobileTextStyles.headline },
  sectionBody: { ...mobileTextStyles.subhead },
  activityRow: {
    borderRadius: mobileRadius.md,
    paddingHorizontal: mobileSpacing.md,
    paddingVertical: mobileSpacing.sm,
    gap: 2,
  },
  controlDock: {
    borderRadius: mobileRadius.lg,
    padding: mobileSpacing.sm,
    gap: mobileSpacing.sm,
    marginTop: mobileSpacing.xs,
  },
  iconDockRow: { flexDirection: 'row', justifyContent: 'space-between', gap: mobileSpacing.md },
  iconButtonWrap: { alignItems: 'center', gap: mobileSpacing.xs + 2, flex: 1 },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonLabel: { ...mobileTextStyles.caption2, fontWeight: '600' },
});
