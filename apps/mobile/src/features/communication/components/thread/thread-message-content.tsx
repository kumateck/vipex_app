import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import {
  asRecord,
  capitalize,
  extractFirstUrl,
  firstString,
  hasTextHint,
  toStatusLabel,
} from './thread-message-content-utils';
export {
  extractThreadMessageReactions,
  extractThreadReplyPreview,
  type ThreadReaction,
  type ThreadReplyPreview,
} from './thread-message-content-utils';

type ThreadMessageLike = {
  senderUserId?: string | null;
  messageType?: string | null;
  body?: string | null;
  metadataJson?: unknown;
};

export function ThreadMessageContent({
  message,
  scale,
}: {
  message: ThreadMessageLike;
  scale: number;
}) {
  const { theme } = useAppearance();
  const metadata = asRecord(message.metadataJson);
  const messageType = (message.messageType ?? 'text').toLowerCase();
  const body = message.body ?? '';
  const url = extractFirstUrl(body);
  const callHintFromBody = hasTextHint(body, ['call', 'voice', 'video', 'ringing', 'missed']);
  const hasCallMeta =
    Boolean(metadata.callType) ||
    Boolean(metadata.callSessionId) ||
    Boolean(metadata.livekitRoomName) ||
    Boolean(metadata.status);

  const isCall = messageType.includes('call') || hasCallMeta || callHintFromBody;
  const isVoice = messageType.includes('voice') || messageType.includes('audio');
  const isContact = messageType.includes('contact') || Boolean(metadata.contactName);
  const hasLatLng =
    typeof metadata.latitude === 'number' &&
    typeof metadata.longitude === 'number' &&
    Number.isFinite(metadata.latitude) &&
    Number.isFinite(metadata.longitude);
  const isLocation =
    messageType.includes('location') ||
    (!isCall && hasLatLng) ||
    (!isCall && Boolean(metadata.locationName));

  if (isCall) {
    const callTypeRaw =
      firstString([metadata.callType, metadata.type, messageType, body]) ?? 'audio';
    const isVideo = hasTextHint(callTypeRaw, ['video', 'camera']);
    const callLabel = isVideo ? 'video' : 'voice';
    const statusRaw = firstString([metadata.status, body, messageType]) ?? 'call';
    const normalizedStatus = toStatusLabel(statusRaw);
    const title =
      normalizedStatus === 'missed'
        ? `Missed ${callLabel} call`
        : normalizedStatus === 'ringing'
          ? `${capitalize(callLabel)} call ringing`
          : `${capitalize(callLabel)} call`;
    const subtitle =
      normalizedStatus === 'missed'
        ? 'Tap to call back'
        : normalizedStatus === 'answered_elsewhere'
          ? 'Answered on other device'
          : normalizedStatus === 'answered'
            ? 'Call completed'
            : 'Call activity';
    const iconName: keyof typeof Ionicons.glyphMap = isVideo
      ? normalizedStatus === 'missed'
        ? 'videocam'
        : 'videocam-outline'
      : normalizedStatus === 'missed'
        ? 'call'
        : 'call-outline';
    const iconColor = normalizedStatus === 'missed' ? theme.colors.danger : theme.colors.textMuted;

    return (
      <View style={[styles.callWrap, { backgroundColor: theme.colors.cardMuted }]}>
        <View style={[styles.callIconBadge, { backgroundColor: theme.colors.card }]}>
          <Ionicons name={iconName} size={17 * scale} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.callTitle, { color: theme.colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.callSubtitle, { color: theme.colors.textSubtle }]}>{subtitle}</Text>
        </View>
      </View>
    );
  }

  if (isVoice) {
    return (
      <View style={[styles.card, { backgroundColor: theme.colors.cardMuted }]}>
        <Ionicons name="mic-outline" size={16 * scale} color={theme.colors.textMuted} />
        <Text style={[styles.cardText, { color: theme.colors.text }]}>Voice message</Text>
      </View>
    );
  }

  if (isContact) {
    return (
      <View style={[styles.card, { backgroundColor: theme.colors.cardMuted }]}>
        <Ionicons name="person-outline" size={16 * scale} color={theme.colors.textMuted} />
        <Text style={[styles.cardText, { color: theme.colors.text }]}>
          {String(metadata.contactName ?? body ?? 'Shared contact')}
        </Text>
      </View>
    );
  }

  if (isLocation) {
    return (
      <View style={[styles.card, { backgroundColor: theme.colors.cardMuted }]}>
        <Ionicons name="location-outline" size={16 * scale} color={theme.colors.textMuted} />
        <Text style={[styles.cardText, { color: theme.colors.text }]}>Shared location</Text>
      </View>
    );
  }

  if (url) {
    return (
      <View style={[styles.linkCard, { backgroundColor: theme.colors.cardMuted }]}>
        <Text style={[styles.linkUrl, { color: theme.colors.primary }]} numberOfLines={1}>
          {url}
        </Text>
        <Text style={[styles.linkBody, { color: theme.colors.text }]}>{body}</Text>
      </View>
    );
  }

  if (!body.trim()) {
    return (
      <Text style={[styles.bodyText, { color: theme.colors.textSubtle }]}>
        {messageType.replace(/[_-]/g, ' ') || 'Message'}
      </Text>
    );
  }

  return <Text style={[styles.bodyText, { color: theme.colors.text }]}>{body}</Text>;
}

const styles = StyleSheet.create({
  bodyText: { ...mobileTextStyles.footnote },
  card: {
    borderRadius: mobileRadius.md,
    paddingVertical: mobileSpacing.sm,
    paddingHorizontal: mobileSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mobileSpacing.sm,
  },
  cardText: { ...mobileTextStyles.footnote, fontWeight: '600' },
  callWrap: {
    borderRadius: mobileRadius.md,
    paddingVertical: mobileSpacing.sm,
    paddingHorizontal: mobileSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mobileSpacing.md,
    minWidth: 210,
  },
  callIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callTitle: { ...mobileTextStyles.footnote, fontWeight: '700' },
  callSubtitle: { ...mobileTextStyles.caption1, marginTop: 1 },
  linkCard: {
    borderRadius: mobileRadius.md,
    paddingVertical: mobileSpacing.sm,
    paddingHorizontal: mobileSpacing.md,
    gap: mobileSpacing.xs + 2,
  },
  linkUrl: { ...mobileTextStyles.footnote, fontWeight: '700' },
  linkBody: { ...mobileTextStyles.footnote },
});
