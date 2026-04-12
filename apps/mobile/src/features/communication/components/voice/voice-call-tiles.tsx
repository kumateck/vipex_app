import { Ionicons } from '@expo/vector-icons';
import { VideoTrack } from '@livekit/react-native';
import type { TrackReference } from '@livekit/components-react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
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
                  <Text style={[styles.videoFooterText, { color: '#fff' }]} numberOfLines={1}>
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
                  <Text style={{ color: stageColors.textMuted, fontWeight: '700', fontSize: 18 }}>
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
                { backgroundColor: participant.isMuted ? '#8b1f1f' : '#1f6b3a' },
              ]}
            >
              <Ionicons
                name={participant.isMuted ? 'mic-off' : 'mic'}
                size={11}
                color={participant.isMuted ? '#ffd6d6' : theme.colors.primaryText}
              />
              <Text style={styles.mutedText}>{participant.isMuted ? 'Muted' : 'Live'}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    width: '48.5%',
    minHeight: 172,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  video: { width: '100%', height: 172 },
  videoFooter: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  videoFooterText: { fontSize: 11, fontWeight: '700' },
  avatarWrap: {
    flex: 1,
    minHeight: 172,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarName: { textAlign: 'center', fontSize: 12, fontWeight: '700' },
  mutedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mutedText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
