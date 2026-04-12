import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppearance } from '@mobile/providers/appearance-provider';

type ThreadMessageLike = {
  senderUserId?: string | null;
  messageType?: string | null;
  body?: string | null;
  metadataJson?: unknown;
};

export type ThreadReplyPreview = {
  sender?: string;
  senderUserId?: string | null;
  body: string;
};

function extractFirstUrl(text: string) {
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match?.[0] ?? null;
}

function asRecord(input: unknown): Record<string, unknown> {
  return input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
}

function firstString(values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function hasTextHint(value: string, hints: string[]) {
  const lowered = value.toLowerCase();
  return hints.some((hint) => lowered.includes(hint));
}

function toStatusLabel(rawStatus: string) {
  const status = rawStatus.toLowerCase();
  if (status.includes('missed') || status.includes('unanswered') || status.includes('no_answer')) {
    return 'missed';
  }
  if (status.includes('ring')) return 'ringing';
  if (status.includes('answered_elsewhere') || status.includes('other_device'))
    return 'answered_elsewhere';
  if (status.includes('answer') || status.includes('connected') || status.includes('accepted'))
    return 'answered';
  return 'call';
}

function capitalize(value: string) {
  if (!value) return '';
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function looksLikeInternalId(value: string) {
  return /^[a-z0-9]{12,}$/i.test(value.replace(/^@/, ''));
}

export function extractThreadReplyPreview(message: ThreadMessageLike): ThreadReplyPreview | null {
  const metadata = asRecord(message.metadataJson);
  const nestedReply = asRecord(metadata.replyTo);
  const sender = firstString([
    metadata.replyToSenderName,
    metadata.replyToSender,
    nestedReply.senderName,
    nestedReply.sender,
  ]);
  const senderUserId = firstString([
    metadata.replyToSenderUserId,
    nestedReply.senderUserId,
    metadata.replyToSenderId,
  ]);
  const body = firstString([
    metadata.replyToBody,
    metadata.replyBody,
    metadata.quotedBody,
    metadata.quote,
    nestedReply.body,
    nestedReply.text,
  ]);
  if (!body) return null;
  const safeSender = sender && looksLikeInternalId(sender) ? undefined : sender;
  return {
    sender: safeSender ?? undefined,
    senderUserId: senderUserId ?? null,
    body,
  };
}

export type ThreadReaction = { emoji: string; count: number };

function extractReactions(metadata: Record<string, unknown>) {
  const raw = metadata.reactions;
  if (!Array.isArray(raw)) return [];
  const counts = new Map<string, number>();
  raw.forEach((item) => {
    const emoji =
      typeof item === 'string'
        ? item.trim()
        : (firstString([asRecord(item).emoji, asRecord(item).icon, asRecord(item).value]) ?? '');
    if (!emoji) return;
    counts.set(emoji, (counts.get(emoji) ?? 0) + 1);
  });
  return [...counts.entries()]
    .map(([emoji, count]) => ({ emoji, count }) satisfies ThreadReaction)
    .slice(0, 3);
}

export function extractThreadMessageReactions(message: ThreadMessageLike): ThreadReaction[] {
  const metadata = asRecord(message.metadataJson);
  return extractReactions(metadata);
}

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
    const iconColor =
      normalizedStatus === 'missed' ? '#EF4444' : theme.scheme === 'dark' ? '#CBD5E1' : '#64748B';

    return (
      <View
        style={[
          styles.callWrap,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.bgElevated },
        ]}
      >
        <View style={[styles.callIconBadge, { backgroundColor: theme.colors.card }]}>
          <Ionicons name={iconName} size={17 * scale} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.callTitle, { color: theme.colors.text, fontSize: 12 }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text style={[styles.callSubtitle, { color: theme.colors.textSubtle, fontSize: 12 }]}>
            {subtitle}
          </Text>
        </View>
      </View>
    );
  }

  if (isVoice) {
    return (
      <View
        style={[
          styles.card,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.bgElevated },
        ]}
      >
        <Ionicons name="mic-outline" size={16 * scale} color={theme.colors.textMuted} />
        <Text style={[styles.cardText, { color: theme.colors.text, fontSize: 12 }]}>
          Voice message
        </Text>
      </View>
    );
  }

  if (isContact) {
    return (
      <View
        style={[
          styles.card,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.bgElevated },
        ]}
      >
        <Ionicons name="person-outline" size={16 * scale} color={theme.colors.textMuted} />
        <Text style={[styles.cardText, { color: theme.colors.text, fontSize: 12 }]}>
          {String(metadata.contactName ?? body ?? 'Shared contact')}
        </Text>
      </View>
    );
  }

  if (isLocation) {
    return (
      <View
        style={[
          styles.card,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.bgElevated },
        ]}
      >
        <Ionicons name="location-outline" size={16 * scale} color={theme.colors.textMuted} />
        <Text style={[styles.cardText, { color: theme.colors.text, fontSize: 12 }]}>
          Shared location
        </Text>
      </View>
    );
  }

  if (url) {
    return (
      <View
        style={[
          styles.linkCard,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.bgElevated },
        ]}
      >
        <Text
          style={[styles.linkUrl, { color: theme.colors.primary, fontSize: 12 }]}
          numberOfLines={1}
        >
          {url}
        </Text>
        <Text style={[styles.linkBody, { color: theme.colors.text, fontSize: 12 }]}>{body}</Text>
      </View>
    );
  }

  if (!body.trim()) {
    return (
      <Text style={[styles.bodyText, { color: theme.colors.textSubtle, fontSize: 12 }]}>
        {messageType.replace(/[_-]/g, ' ') || 'Message'}
      </Text>
    );
  }

  return (
    <Text style={[styles.bodyText, { color: theme.colors.text, fontSize: 12, lineHeight: 16 }]}>
      {body}
    </Text>
  );
}

const styles = StyleSheet.create({
  bodyText: { fontSize: 12, lineHeight: 16 },
  card: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardText: { fontSize: 12, fontWeight: '600' },
  callWrap: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 210,
  },
  callIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callTitle: { fontSize: 12, fontWeight: '700' },
  callSubtitle: { marginTop: 1, fontSize: 12 },
  linkCard: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 6,
  },
  linkUrl: { fontSize: 12, fontWeight: '700' },
  linkBody: { fontSize: 12, lineHeight: 16 },
});
