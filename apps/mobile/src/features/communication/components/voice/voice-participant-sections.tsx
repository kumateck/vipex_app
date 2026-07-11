import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
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
            backgroundColor: stageColors.cardMuted,
            borderColor: emphasized ? theme.colors.primary : 'transparent',
            borderWidth: emphasized ? 1.5 : 0,
          },
        ]}
      >
        <View style={styles.participantIdentity}>
          <View
            style={[
              styles.avatar,
              {
                borderColor: emphasized ? theme.colors.primary : 'transparent',
                borderWidth: emphasized ? 1.5 : 0,
                backgroundColor: stageColors.bg,
              },
            ]}
          >
            <Text style={[styles.avatarText, { color: stageColors.textMuted }]}>
              {initialsFromName(name)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.participantName, { color: stageColors.text }]}>
              {name}
              {isSelf ? ' (You)' : ''}
            </Text>
            <Text style={[styles.participantMeta, { color: stageColors.textSubtle }]}>
              Joined {formatTime(participant.joinedAt)}
            </Text>
          </View>
        </View>
        <View style={styles.statusRow}>
          <Ionicons
            name={participant.isMuted ? 'mic-off' : 'mic'}
            size={14}
            color={participant.isMuted ? theme.colors.indicatorMuted : theme.colors.indicatorOnline}
          />
          <Ionicons
            name={participant.isVideoOff ? 'videocam-off' : 'videocam'}
            size={14}
            color={participant.isVideoOff ? theme.colors.indicatorMuted : theme.colors.primary}
          />
        </View>
      </View>
    );
  };

  return (
    <>
      <View style={[styles.sectionCard, mobileShadow.card, { backgroundColor: stageColors.card }]}>
        <Text style={[styles.sectionTitle, { color: stageColors.text }]}>Active Speakers</Text>
        <View style={styles.list}>
          {speaking.map((participant) => renderRow(participant, true))}
          {!speaking.length ? (
            <Text style={[styles.emptyText, { color: stageColors.textSubtle }]}>
              No one is speaking.
            </Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.sectionCard, mobileShadow.card, { backgroundColor: stageColors.card }]}>
        <Text style={[styles.sectionTitle, { color: stageColors.text }]}>
          In Channel ({participants.length})
        </Text>
        {participants.length ? (
          <View style={styles.list}>
            {listeners.map((participant) => renderRow(participant, false))}
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: stageColors.textSubtle }]}>
            No participants connected.
          </Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionCard: { borderRadius: mobileRadius.lg, padding: mobileSpacing.md, gap: mobileSpacing.sm },
  sectionTitle: { ...mobileTextStyles.headline },
  emptyText: { ...mobileTextStyles.footnote },
  list: { gap: mobileSpacing.sm },
  participantRow: {
    borderRadius: mobileRadius.md,
    padding: mobileSpacing.sm + 2,
    gap: mobileSpacing.sm,
  },
  participantIdentity: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm + 2 },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...mobileTextStyles.headline },
  participantName: { ...mobileTextStyles.subhead, fontWeight: '700' },
  participantMeta: { ...mobileTextStyles.caption1, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm },
});
