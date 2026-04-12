import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTypography } from '@mobile/theme/layout';
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

type VoiceParticipantSectionsProps = {
  participants: VoiceSocketParticipant[];
  currentUserId: string | null;
  stageColors: StagePalette;
  formatTime: (value?: string | null) => string;
};

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  const first = parts[0] ?? '';
  const second = parts[1] ?? '';
  if (!second) return first.slice(0, 2).toUpperCase();
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
}

export function VoiceParticipantSections({
  participants,
  currentUserId,
  stageColors,
  formatTime,
}: VoiceParticipantSectionsProps) {
  const { theme } = useAppearance();
  const speaking = participants.filter((p) => !p.isMuted);
  const listeners = participants.filter((p) => p.isMuted);

  const renderRow = (participant: VoiceSocketParticipant, emphasized: boolean) => {
    const name = participant.displayName?.trim() || participant.userId;
    const isSelf = Boolean(currentUserId && participant.userId === currentUserId);
    return (
      <View
        key={`${participant.userId}-${participant.joinedAt}`}
        style={[
          styles.participantRow,
          {
            borderColor: emphasized ? theme.colors.primary : stageColors.border,
            backgroundColor: stageColors.cardMuted,
          },
        ]}
      >
        <View style={styles.participantIdentity}>
          <View
            style={[
              styles.avatar,
              {
                borderColor: emphasized ? theme.colors.primary : stageColors.border,
                backgroundColor: stageColors.bg,
              },
            ]}
          >
            <Text style={{ color: stageColors.textMuted, fontWeight: '700', fontSize: 16 }}>
              {initialsFromName(name)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: stageColors.text, fontWeight: '700', fontSize: 14 }}>
              {name}
              {isSelf ? ' (You)' : ''}
            </Text>
            <Text style={{ color: stageColors.textSubtle, fontSize: 11 }}>
              Joined {formatTime(participant.joinedAt)}
            </Text>
          </View>
        </View>
        <View style={styles.statusRow}>
          <Ionicons
            name={participant.isMuted ? 'mic-off' : 'mic'}
            size={14}
            color={participant.isMuted ? stageColors.textSubtle : theme.colors.indicatorOnline}
          />
          <Ionicons
            name={participant.isVideoOff ? 'videocam-off' : 'videocam'}
            size={14}
            color={participant.isVideoOff ? stageColors.textSubtle : theme.colors.primary}
          />
        </View>
      </View>
    );
  };

  return (
    <>
      <View
        style={[
          styles.sectionCard,
          { borderColor: stageColors.border, backgroundColor: stageColors.card },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: stageColors.text }]}>Active Speakers</Text>
        <View style={styles.list}>
          {speaking.map((participant) => renderRow(participant, true))}
          {!speaking.length ? (
            <Text style={{ color: stageColors.textSubtle, fontSize: 12 }}>No one is speaking.</Text>
          ) : null}
        </View>
      </View>

      <View
        style={[
          styles.sectionCard,
          { borderColor: stageColors.border, backgroundColor: stageColors.card },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: stageColors.text }]}>
          In Channel ({participants.length})
        </Text>
        {participants.length ? (
          <View style={styles.list}>
            {listeners.map((participant) => renderRow(participant, false))}
          </View>
        ) : (
          <Text style={{ color: stageColors.textSubtle }}>No participants connected.</Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionCard: { borderWidth: 1, borderRadius: 14, padding: mobileSpacing.md, gap: 8 },
  sectionTitle: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  list: { gap: 8 },
  participantRow: { borderWidth: 1, borderRadius: 12, padding: 10, gap: 8 },
  participantIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
