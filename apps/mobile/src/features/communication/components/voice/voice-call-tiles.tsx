import Ionicons from 'react-native-vector-icons/Ionicons';
import { VideoTrack } from '@livekit/react-native';
import type { TrackReference } from '@livekit/components-react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { VoiceSocketParticipant } from '@mobile/features/communication/hooks/use-voice-channel';

type StagePalette = {
  card: string;
  cardMuted: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  bg: string;
};

type VoiceCallTilesProps = {
  participants: VoiceSocketParticipant[];
  currentUserId: string | null;
  currentUserName: string | null;
  videoTrackByUserId: Record<string, unknown>;
  stageColors: StagePalette;
};

type TileParticipant = VoiceSocketParticipant & { isSelf: boolean };

function toInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  const first = parts[0] ?? '';
  const second = parts[1] ?? '';
  if (!second) return first.slice(0, 2).toUpperCase();
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
}

export function VoiceCallTiles({
  participants,
  currentUserId,
  currentUserName,
  videoTrackByUserId,
  stageColors,
}: VoiceCallTilesProps) {
  const { theme } = useAppearance();
  const dedupedByUserId = new Map<string, TileParticipant>();

  for (const participant of participants) {
    const isSelf = Boolean(currentUserId && participant.userId === currentUserId);
    if (!dedupedByUserId.has(participant.userId)) {
      dedupedByUserId.set(participant.userId, { ...participant, isSelf });
    }
  }

  if (currentUserId && !dedupedByUserId.has(currentUserId)) {
    dedupedByUserId.set(currentUserId, {
      userId: currentUserId,
      displayName: currentUserName ?? 'You',
      joinedAt: new Date().toISOString(),
      isMuted: false,
      isVideoOff: true,
      isSelf: true,
    });
  }

  const tiles = [...dedupedByUserId.values()];

  return (
    <View style={styles.grid}>
      {tiles.map((participant) => {
        const name =
          participant.displayName?.trim() ||
          (participant.isSelf ? currentUserName : '') ||
          participant.userId;
        const trackRef = videoTrackByUserId[participant.userId];
        const showVideo = !participant.isVideoOff && Boolean(trackRef);

        return (
          <View
            key={participant.userId}
            style={[
              styles.tile,
              { borderColor: stageColors.border, backgroundColor: stageColors.cardMuted },
            ]}
          >
            {showVideo ? (
              <>
                <VideoTrack
                  trackRef={trackRef as TrackReference}
                  style={styles.video}
                  objectFit="cover"
                />
                <View style={styles.videoFooter}>
                  <Text style={styles.videoFooterText} numberOfLines={1}>
                    {name}
                    {participant.isSelf ? ' (You)' : ''}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.avatarWrap}>
                <View
                  style={[
                    styles.avatar,
                    { borderColor: stageColors.border, backgroundColor: stageColors.bg },
                  ]}
                >
                  <Text style={[styles.avatarInitials, { color: stageColors.textMuted }]}>
                    {toInitials(name)}
                  </Text>
                </View>
                <Text style={[styles.avatarName, { color: stageColors.text }]} numberOfLines={1}>
                  {name}
                  {participant.isSelf ? ' (You)' : ''}
                </Text>
              </View>
            )}

            <View
              style={[
                styles.mutedBadge,
                {
                  backgroundColor: participant.isMuted ? theme.colors.danger : theme.colors.success,
                },
              ]}
            >
              <Ionicons name={participant.isMuted ? 'mic-off' : 'mic'} size={11} color="white" />
              <Text style={styles.mutedText}>{participant.isMuted ? 'Muted' : 'Live'}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: mobileSpacing.sm },
  tile: {
    width: '48.5%',
    minHeight: 172,
    borderRadius: mobileRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  video: { width: '100%', height: 172 },
  videoFooter: {
    position: 'absolute',
    left: mobileSpacing.sm,
    right: mobileSpacing.sm,
    bottom: mobileSpacing.sm,
    borderRadius: mobileRadius.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: mobileSpacing.sm,
    paddingVertical: mobileSpacing.xs + 1,
  },
  // Overlay caption sits on a dark video scrim regardless of app theme, so it
  // intentionally stays white rather than following theme text tokens.
  videoFooterText: { ...mobileTextStyles.caption1, fontWeight: '700', color: 'white' },
  avatarWrap: {
    flex: 1,
    minHeight: 172,
    justifyContent: 'center',
    alignItems: 'center',
    gap: mobileSpacing.sm,
    paddingHorizontal: mobileSpacing.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { ...mobileTextStyles.headline },
  avatarName: { ...mobileTextStyles.footnote, textAlign: 'center', fontWeight: '700' },
  mutedBadge: {
    position: 'absolute',
    top: mobileSpacing.sm,
    right: mobileSpacing.sm,
    borderRadius: mobileRadius.pill,
    paddingHorizontal: mobileSpacing.xs + 3,
    paddingVertical: mobileSpacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  // Same reasoning as videoFooterText: white foreground on a solid status pill.
  mutedText: { ...mobileTextStyles.caption2, color: 'white', fontWeight: '700' },
});
