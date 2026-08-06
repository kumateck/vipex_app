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

export type ThreadReaction = { emoji: string; count: number };

export function asRecord(input: unknown): Record<string, unknown> {
  return input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
}

export function firstString(values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

export function hasTextHint(value: string, hints: string[]) {
  const lowered = value.toLowerCase();
  return hints.some((hint) => lowered.includes(hint));
}

export function extractFirstUrl(text: string) {
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match?.[0] ?? null;
}

export function toStatusLabel(rawStatus: string) {
  const status = rawStatus.toLowerCase();
  if (status.includes('missed') || status.includes('unanswered') || status.includes('no_answer'))
    return 'missed';
  if (status.includes('ring')) return 'ringing';
  if (status.includes('answered_elsewhere') || status.includes('other_device'))
    return 'answered_elsewhere';
  if (status.includes('answer') || status.includes('connected') || status.includes('accepted'))
    return 'answered';
  return 'call';
}

export function capitalize(value: string) {
  if (!value) return '';
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function looksLikeInternalId(value: string) {
  return /^[a-z0-9]{12,}$/i.test(value.replace(/^@/, ''));
}

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
  return { sender: safeSender ?? undefined, senderUserId: senderUserId ?? null, body };
}

export function extractThreadMessageReactions(message: ThreadMessageLike): ThreadReaction[] {
  return extractReactions(asRecord(message.metadataJson));
}
