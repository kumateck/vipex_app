import { Bell } from 'lucide-react';
import type { CommunicationMessage } from '../../../api/communication.api';
import { asRecord, firstString } from './communication-chat-thread-detail-media';

export function prettyValue(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatMessageTime(value?: string | null) {
  if (!value) return '--:--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '--:--';
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDayLabel(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const now = new Date();
  if (
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getDate() === now.getDate()
  ) {
    return 'Today';
  }
  return parsed.toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getDayKey(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${parsed.getMonth()}-${parsed.getDate()}`;
}

export function getDisplayNameForUser(
  usersById: Map<string, { fullname?: string | null; email?: string | null }>,
  userId?: string | null,
  fallback = 'Unknown user',
) {
  if (!userId) return fallback;
  const user = usersById.get(userId);
  if (!user) return fallback;
  return user.fullname || user.email || fallback;
}

export function ensureDisplayNameOnly(value?: string | null, fallback = 'Unknown user') {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed || looksLikeInternalId(trimmed)) return fallback;
  return trimmed;
}

export function looksLikeInternalId(value: string) {
  return /^[a-z0-9]{12,}$/i.test(value.replace(/^@/, ''));
}

export function extractReplyPreview(
  message: CommunicationMessage,
): { sender?: string; senderUserId?: string | null; body: string; replyId?: string | null } | null {
  const metadata = asRecord(message.metadataJson);
  if (!metadata) return null;
  const nestedReply = asRecord(metadata.replyTo);
  const sender = firstString([
    metadata.replyToSenderName,
    metadata.replyToSender,
    nestedReply?.senderName,
    nestedReply?.sender,
  ]);
  const senderUserId = firstString([
    metadata.replyToSenderUserId,
    nestedReply?.senderUserId,
    metadata.replyToSenderId,
  ]);
  const body = firstString([
    metadata.replyToBody,
    metadata.replyBody,
    metadata.quotedBody,
    metadata.quote,
    nestedReply?.body,
    nestedReply?.text,
  ]);
  const replyId = firstString([
    message.replyToMessageId,
    metadata.replyToMessageId,
    metadata.replyToId,
    metadata.replyId,
    nestedReply?.id,
  ]);
  if (!body && !replyId) return null;
  const safeSender = sender && looksLikeInternalId(sender) ? undefined : sender;
  return {
    sender: safeSender ?? undefined,
    senderUserId: senderUserId ?? null,
    body: body ?? '',
    replyId: replyId ?? null,
  };
}

export function extractReactions(
  message: CommunicationMessage,
): Array<{ emoji: string; count: number }> {
  const metadata = asRecord(message.metadataJson);
  if (!metadata) return [];
  const raw = metadata.reactions;
  if (!Array.isArray(raw)) return [];
  const counts = new Map<string, number>();
  for (const item of raw) {
    let emoji = '';
    if (typeof item === 'string') {
      emoji = item.trim();
    } else {
      const record = asRecord(item);
      emoji = firstString([record?.emoji, record?.icon, record?.value]) ?? '';
    }
    if (!emoji) continue;
    counts.set(emoji, (counts.get(emoji) ?? 0) + 1);
  }
  return [...counts.entries()].map(([emoji, count]) => ({ emoji, count })).slice(0, 3);
}

export function extractRecordingDurationLabel(message: CommunicationMessage): string | null {
  const metadata = asRecord(message.metadataJson);
  if (!metadata) return null;
  const raw = metadata.recordingDurationSec ?? metadata.durationSec ?? metadata.duration;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) {
    const mins = Math.floor(raw / 60);
    const secs = Math.floor(raw % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return null;
}

export function hasUserFlag(
  message: CommunicationMessage,
  userId: string,
  flag: 'pinnedByUserIds' | 'starredByUserIds',
): boolean {
  if (!userId) return false;
  const metadata = asRecord(message.metadataJson);
  const values = metadata?.[flag];
  if (!Array.isArray(values)) return false;
  return values.some((value) => value === userId);
}

export function isWithinMinutes(value?: string | null, minutes = 5): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return false;
  return Date.now() - time <= minutes * 60 * 1000;
}

export function renderCallOrMeetingBubble(
  message: CommunicationMessage,
  liveCallStatus?: string | null,
) {
  const metadata = asRecord(message.metadataJson);
  if (!metadata) return null;

  if (message.messageType === 'call') {
    const callType = firstString([metadata.callType, metadata.type]) ?? 'audio';
    const scope = firstString([metadata.scope, metadata.threadType]) ?? 'thread';
    const status = firstString([liveCallStatus, metadata.status]) ?? 'pending';
    const startedAt = firstString([metadata.startedAt, metadata.createdAt]);
    return (
      <div className="mt-2 rounded-lg border bg-background/40 p-3 text-sm">
        <p className="font-semibold">Call • {prettyValue(callType)}</p>
        <p className="text-xs text-muted-foreground">
          {prettyValue(scope)} • {prettyValue(status)}
          {startedAt ? ` • ${formatMessageTime(startedAt)}` : ''}
        </p>
      </div>
    );
  }

  if (message.messageType === 'meeting') {
    const title = firstString([metadata.title]) ?? 'Meeting';
    const link = firstString([metadata.link, metadata.url, metadata.meetingLink]);
    const startsAt = firstString([metadata.startsAt, metadata.startAt]);
    return (
      <div className="mt-2 rounded-lg border bg-background/40 p-3 text-sm">
        <p className="font-semibold">{title}</p>
        {startsAt ? (
          <p className="text-xs text-muted-foreground">
            Starts: {new Date(startsAt).toLocaleString()}
          </p>
        ) : null}
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-xs underline"
          >
            Join meeting
          </a>
        ) : null}
      </div>
    );
  }

  return null;
}

export function renderMeetingReminderBubble(message: CommunicationMessage, nowTs: number) {
  if (message.messageType !== 'meeting') return null;
  const metadata = asRecord(message.metadataJson);
  if (!metadata) return null;

  const startsAt = firstString([metadata.startsAt, metadata.startAt]);
  if (!startsAt) return null;
  const startsAtTs = new Date(startsAt).getTime();
  if (!Number.isFinite(startsAtTs)) return null;

  const reminderRaw = metadata.reminderMinutes;
  const reminderMinutes =
    typeof reminderRaw === 'number' && Number.isFinite(reminderRaw)
      ? Math.max(0, Math.floor(reminderRaw))
      : 0;
  if (!reminderMinutes) return null;

  const reminderStartTs = startsAtTs - reminderMinutes * 60_000;
  const isReminderWindow = nowTs >= reminderStartTs && nowTs < startsAtTs;
  const justStarted = nowTs >= startsAtTs && nowTs < startsAtTs + 30 * 60_000;
  if (!isReminderWindow && !justStarted) return null;

  if (isReminderWindow) {
    const minutesLeft = Math.max(1, Math.ceil((startsAtTs - nowTs) / 60_000));
    return (
      <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
        <p className="inline-flex items-center gap-1 font-semibold text-amber-200">
          <Bell className="h-3.5 w-3.5" />
          Reminder
        </p>
        <p className="text-amber-100/90">
          Starts in {minutesLeft} minute{minutesLeft === 1 ? '' : 's'}.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs">
      <p className="inline-flex items-center gap-1 font-semibold text-emerald-200">
        <Bell className="h-3.5 w-3.5" />
        Meeting Started
      </p>
      <p className="text-emerald-100/90">This meeting is now in progress.</p>
    </div>
  );
}

export function renderRichText(body: string, resolveMentionLabel: (handle: string) => string) {
  const segments = body.split(/(@[A-Za-z0-9_.-]+)/g);
  return (
    <>
      {segments.map((segment, index) => {
        if (/^@[A-Za-z0-9_.-]+$/.test(segment)) {
          const mentionHandle = segment.slice(1);
          const displayLabel = resolveMentionLabel(mentionHandle);
          return (
            <span
              key={`${segment}-${index}`}
              className="rounded-md bg-blue-500/25 px-1 text-blue-200"
            >
              @{displayLabel}
            </span>
          );
        }
        return <span key={`${segment}-${index}`}>{segment}</span>;
      })}
    </>
  );
}
