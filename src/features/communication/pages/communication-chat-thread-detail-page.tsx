import { useEffect, useMemo, useRef, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  Forward,
  Link2,
  Mic,
  Pencil,
  Phone,
  Pin,
  Play,
  Plus,
  Reply,
  SendHorizontal,
  Smile,
  Star,
  Trash2,
  Video,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileDropUpload } from '@/components/ui/file-drop-upload';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { useUploadImageMutation } from '@/features/uploads/api/uploads.api';
import { useListUserOptionsQuery, type UserOption } from '@/features/users/api/users.api';
import { useAuthStore } from '@/stores/auth-store';
import {
  type CommunicationMessage,
  useCreateCommunicationCallMutation,
  useCreateCommunicationMessageMutation,
  useDeleteCommunicationMessageMutation,
  useListCommunicationMessagesQuery,
  useListCommunicationCallsQuery,
  useListCommunicationThreadsQuery,
  useMarkCommunicationThreadReadMutation,
  useToggleCommunicationMessageFlagMutation,
  useToggleCommunicationMessageReactionMutation,
  useUpdateCommunicationMessageMutation,
} from '../api/communication.api';
import { useCommunicationSocket } from '../hooks/use-communication-socket';

function prettyValue(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMessageTime(value?: string | null) {
  if (!value) return '--:--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '--:--';
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDayLabel(value?: string | null) {
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

function getDayKey(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${parsed.getMonth()}-${parsed.getDate()}`;
}

function normalizeMentionHandle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');
}

function getUserMentionHandles(user: UserOption) {
  const handles = new Set<string>();
  handles.add(normalizeMentionHandle(user.id));
  const emailPrefix = user.email.split('@')[0] ?? '';
  if (emailPrefix) handles.add(normalizeMentionHandle(emailPrefix));
  const full = normalizeMentionHandle(user.fullname.replace(/\s+/g, ''));
  if (full) handles.add(full);
  const first = normalizeMentionHandle(user.fullname.split(/\s+/)[0] ?? '');
  if (first) handles.add(first);
  return [...handles].filter(Boolean);
}

function preferredMentionHandle(user: UserOption) {
  const handles = getUserMentionHandles(user);
  return handles[1] ?? handles[2] ?? handles[0] ?? normalizeMentionHandle(user.id);
}

function getDisplayNameForUser(
  usersById: Map<string, UserOption>,
  userId?: string | null,
  fallback = 'Unknown user',
) {
  if (!userId) return fallback;
  const user = usersById.get(userId);
  if (!user) return fallback;
  return user.fullname || user.email || fallback;
}

function ensureDisplayNameOnly(value?: string | null, fallback = 'Unknown user') {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed || looksLikeInternalId(trimmed)) return fallback;
  return trimmed;
}

function looksLikeInternalId(value: string) {
  return /^[a-z0-9]{12,}$/i.test(value.replace(/^@/, ''));
}

function buildMentionLookup(users: UserOption[]) {
  const map = new Map<string, string>();
  for (const user of users) {
    const handles = getUserMentionHandles(user);
    for (const handle of handles) {
      if (!handle) continue;
      if (!map.has(handle)) {
        map.set(handle, user.id);
      }
    }
  }
  return map;
}

function extractMentionsFromText(text: string, mentionLookup: Map<string, string>) {
  const mentionedUserIds = new Set<string>();
  let mentionAll = false;
  const regex = /(^|\s)@([a-zA-Z0-9._-]+)/g;
  let match: RegExpExecArray | null = regex.exec(text);
  while (match) {
    const raw = match[2] ?? '';
    const token = normalizeMentionHandle(raw);
    if (token === 'everyone') {
      mentionAll = true;
    } else {
      const userId = mentionLookup.get(token);
      if (userId) mentionedUserIds.add(userId);
    }
    match = regex.exec(text);
  }
  return {
    mentionAll,
    mentionedUserIds: [...mentionedUserIds],
  };
}

function getActiveMentionQuery(text: string, caret: number) {
  if (caret < 0 || caret > text.length) return null;
  const beforeCaret = text.slice(0, caret);
  const match = /(^|\s)@([a-zA-Z0-9._-]*)$/.exec(beforeCaret);
  if (!match) return null;
  const raw = match[2] ?? '';
  return {
    start: caret - raw.length - 1,
    end: caret,
    queryRaw: raw,
    query: normalizeMentionHandle(raw),
  };
}

type MediaKind = 'image' | 'video' | 'audio' | 'file';

type MediaAttachment = {
  kind: MediaKind;
  url: string;
  label?: string;
  thumbnailUrl?: string;
};

type ComposerMessageKind = 'text' | MediaKind;
type PendingFileUpload = {
  file: File;
  dataUrl: string;
  previewUrl: string;
  kind: MediaKind;
  recordingDurationSec?: number;
  videoThumbnailDataUrl?: string;
};
type RecordingMode = 'audio' | 'video';

type MentionSuggestion = {
  key: string;
  label: string;
  subLabel: string;
  insertHandle: string;
};

const typingDotStyle = ['0ms', '180ms', '360ms'] as const;
const QUICK_REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'] as const;
const SUPPORTED_UPLOAD_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'application/pdf',
  'text/plain',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

function normalizeMimeType(mimeType: string | null | undefined) {
  if (!mimeType) return '';
  return mimeType.split(';')[0]?.trim().toLowerCase() ?? '';
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  const kb = sizeBytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function formatDurationClock(totalSec: number) {
  const mins = Math.floor(totalSec / 60);
  const secs = Math.max(0, totalSec % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function getFileExtensionByMimeType(mimeType: string, fallback: string) {
  const normalizedMimeType = normalizeMimeType(mimeType);
  const map: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
  };
  return map[normalizedMimeType] ?? fallback;
}

function pickSupportedRecorderMimeType(mode: RecordingMode): string | null {
  if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') return null;
  const candidates =
    mode === 'video' ? ['video/webm', 'video/mp4'] : ['audio/webm', 'audio/ogg', 'audio/mp4'];
  for (const candidate of candidates) {
    if (window.MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function toDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed reading file: ${file.name}`));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  });
}

async function extractVideoThumbnailDataUrl(file: File): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  const objectUrl = URL.createObjectURL(file);

  try {
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'metadata';
    video.src = objectUrl;
    video.playsInline = true;

    await new Promise<void>((resolve, reject) => {
      const onLoadedData = () => resolve();
      const onError = () => reject(new Error('Failed to load video for thumbnail'));
      video.addEventListener('loadeddata', onLoadedData, { once: true });
      video.addEventListener('error', onError, { once: true });
    });

    if (!video.videoWidth || !video.videoHeight) return null;
    const maxWidth = 360;
    const targetWidth = Math.min(maxWidth, video.videoWidth);
    const targetHeight = Math.max(
      1,
      Math.round((video.videoHeight * targetWidth) / video.videoWidth),
    );

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(video, 0, 0, targetWidth, targetHeight);
    return canvas.toDataURL('image/jpeg', 0.72);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function firstString(values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function normalizeMediaKind(raw: unknown): MediaKind | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim().toLowerCase();
  if (value === 'image' || value === 'video' || value === 'audio' || value === 'file') return value;
  if (value.startsWith('image/')) return 'image';
  if (value.startsWith('video/')) return 'video';
  if (value.startsWith('audio/')) return 'audio';
  return null;
}

function inferKindFromUrl(url: string): MediaKind {
  const normalized = url.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)(\?|#|$)/.test(normalized)) return 'image';
  if (/\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/.test(normalized)) return 'video';
  if (/\.(mp3|wav|m4a|aac|oga|flac)(\?|#|$)/.test(normalized)) return 'audio';
  return 'file';
}

function extractMediaAttachments(message: CommunicationMessage): MediaAttachment[] {
  const metadata = asRecord(message.metadataJson);
  const attachmentsRaw = metadata?.attachments;

  if (Array.isArray(attachmentsRaw)) {
    const parsedAttachments = attachmentsRaw
      .map((attachment): MediaAttachment | null => {
        const record = asRecord(attachment);
        if (!record) return null;
        const url = firstString([record.url, record.src, record.href]);
        if (!url) return null;
        const kind =
          normalizeMediaKind(record.kind ?? record.type ?? record.mimeType) ??
          inferKindFromUrl(url);
        const label = firstString([record.name, record.filename, record.title]) ?? undefined;
        const thumbnailUrl =
          firstString([
            record.thumbnailUrl,
            record.thumbnailSrc,
            record.posterUrl,
            record.previewImage,
          ]) ?? undefined;
        return { kind, url, label, thumbnailUrl };
      })
      .filter((attachment): attachment is MediaAttachment => attachment !== null);
    if (parsedAttachments.length) return parsedAttachments;
  }

  const singleUrl = firstString([
    metadata?.url,
    metadata?.src,
    metadata?.href,
    metadata?.mediaUrl,
    metadata?.fileUrl,
  ]);
  if (!singleUrl) return [];

  const explicitKind = normalizeMediaKind(
    metadata?.kind ?? metadata?.type ?? metadata?.mimeType ?? message.messageType,
  );
  return [
    {
      kind: explicitKind ?? inferKindFromUrl(singleUrl),
      url: singleUrl,
      label: firstString([metadata?.name, metadata?.filename, metadata?.title]) ?? undefined,
      thumbnailUrl:
        firstString([
          metadata?.thumbnailUrl,
          metadata?.thumbnailSrc,
          metadata?.posterUrl,
          metadata?.previewImage,
        ]) ?? undefined,
    },
  ];
}

function extractReplyPreview(
  message: CommunicationMessage,
): { sender?: string; senderUserId?: string | null; body: string } | null {
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
  if (!body) return null;
  const safeSender = sender && looksLikeInternalId(sender) ? undefined : sender;
  return { sender: safeSender ?? undefined, senderUserId: senderUserId ?? null, body };
}

function extractReactions(message: CommunicationMessage): Array<{ emoji: string; count: number }> {
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

function extractRecordingDurationLabel(message: CommunicationMessage): string | null {
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

function hasUserFlag(
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

function isWithinMinutes(value?: string | null, minutes = 5): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return false;
  return Date.now() - time <= minutes * 60 * 1000;
}

function renderCallOrMeetingBubble(message: CommunicationMessage, liveCallStatus?: string | null) {
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

function renderMeetingReminderBubble(message: CommunicationMessage, nowTs: number) {
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

function renderRichText(body: string, resolveMentionLabel: (handle: string) => string) {
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

function renderAttachment(
  attachment: MediaAttachment,
  isOwnMessage: boolean,
  options?: { onOpenVideo?: (url: string, label?: string) => void },
) {
  if (attachment.kind === 'image') {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer">
        <img
          src={attachment.url}
          alt={attachment.label || 'Image attachment'}
          className="mt-2 max-h-80 w-full max-w-md rounded-xl object-cover"
          loading="lazy"
        />
      </a>
    );
  }

  if (attachment.kind === 'video') {
    return (
      <button
        type="button"
        onClick={() => options?.onOpenVideo?.(attachment.url, attachment.label)}
        className="relative mt-2 block w-full max-w-md overflow-hidden rounded-xl border border-border/60"
      >
        {attachment.thumbnailUrl ? (
          <img
            src={attachment.thumbnailUrl}
            alt={attachment.label || 'Video attachment'}
            className="max-h-80 w-full object-cover"
          />
        ) : (
          <video
            src={attachment.url}
            className="max-h-80 w-full object-cover"
            preload="metadata"
            muted
          />
        )}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-black shadow">
            <Play className="h-7 w-7 fill-current" />
          </span>
        </span>
      </button>
    );
  }

  if (attachment.kind === 'audio') {
    return (
      <audio src={attachment.url} controls className="mt-2 w-full max-w-md" preload="metadata" />
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className={`mt-2 inline-flex rounded-lg border px-3 py-2 text-xs font-medium underline-offset-2 hover:underline ${
        isOwnMessage ? 'border-primary-foreground/40' : 'border-border'
      }`}
    >
      {attachment.label || 'Open attachment'}
    </a>
  );
}

function ChatMessageReactions({
  isOwnMessage,
  reactions,
  isActive,
  onOpenPicker,
}: {
  isOwnMessage: boolean;
  reactions: Array<{ emoji: string; count: number }>;
  isActive: boolean;
  onOpenPicker: () => void;
}) {
  if (!reactions.length) return null;
  const visible = reactions.slice(0, 3);
  const totalCount = reactions.reduce((acc, item) => acc + item.count, 0);

  return (
    <button
      type="button"
      onClick={onOpenPicker}
      className={`absolute -bottom-3 z-20 inline-flex items-center gap-1 rounded-full bg-white px-2 py-[2px] text-sm shadow-sm transition-all duration-75 hover:scale-105 hover:shadow-md dark:bg-[#1f2c34] ${
        isActive ? 'bg-sky-50 dark:bg-[#27363f]' : ''
      } ${isOwnMessage ? 'right-2' : 'left-2'}`}
    >
      {visible.map((reaction) => (
        <span key={`reaction-pill-${reaction.emoji}`} className="inline-flex items-center gap-0.5">
          <span>{reaction.emoji}</span>
          {reaction.count > 1 ? (
            <span className="text-[10px] text-muted-foreground">{reaction.count}</span>
          ) : null}
        </span>
      ))}
      {totalCount > visible.length ? (
        <span className="ml-1 rounded-full bg-black/5 px-1 text-[10px] text-muted-foreground dark:bg-white/10">
          {totalCount}
        </span>
      ) : null}
    </button>
  );
}

export function CommunicationChatThreadDetailPage({ threadId }: { threadId: string }) {
  const currentUserId = useAuthStore((state) => state.user?.id ?? '');
  const navigate = useNavigate();
  const normalizedThreadId = threadId.trim();
  const [messageLimit, setMessageLimit] = useState(60);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messageKind, setMessageKind] = useState<ComposerMessageKind>('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaLabel, setMediaLabel] = useState('');
  const [showMediaComposer, setShowMediaComposer] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<PendingFileUpload | null>(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isRecorderDialogOpen, setIsRecorderDialogOpen] = useState(false);
  const [isVideoPlayerDialogOpen, setIsVideoPlayerDialogOpen] = useState(false);
  const [activeVideoAttachment, setActiveVideoAttachment] = useState<{
    url: string;
    label?: string;
  } | null>(null);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('audio');
  const [replyToMessage, setReplyToMessage] = useState<CommunicationMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<CommunicationMessage | null>(null);
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingStartAt, setMeetingStartAt] = useState<Date | undefined>(undefined);
  const [meetingReminderMinutes, setMeetingReminderMinutes] = useState('15');
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [createCallType, setCreateCallType] = useState<'audio' | 'video'>('audio');
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparingRecording, setIsPreparingRecording] = useState(false);
  const [recordingPreviewUrl, setRecordingPreviewUrl] = useState<string | null>(null);
  const [recordingElapsedSec, setRecordingElapsedSec] = useState(0);
  const [filePickerAccept, setFilePickerAccept] = useState('*/*');
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [typingUserIdsByThread, setTypingUserIdsByThread] = useState<Record<string, string[]>>({});
  const [reactionMenuMessageId, setReactionMenuMessageId] = useState<string | null>(null);
  const [actionsMenuMessageId, setActionsMenuMessageId] = useState<string | null>(null);
  const [composerCaret, setComposerCaret] = useState(0);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const composerTypingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingPresenceTimerByUserRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const composerInputRef = useRef<HTMLInputElement | null>(null);
  const recorderPreviewRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderChunksRef = useRef<Blob[]>([]);
  const shouldKeepRecordingResultRef = useRef(true);
  const recordingStartedAtRef = useRef<number | null>(null);
  const recordingTickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const preserveScrollOnPrependRef = useRef<{ top: number; height: number } | null>(null);
  const firstLoadDoneRef = useRef(false);
  const stickToBottomRef = useRef(true);

  const { data: userOptions = [] } = useListUserOptionsQuery();
  const { data: threads = [], refetch: refetchThreads } = useListCommunicationThreadsQuery();
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useListCommunicationMessagesQuery(
    normalizedThreadId ? { threadId: normalizedThreadId, limit: messageLimit } : skipToken,
  );
  const [createMessage, { isLoading: isSendingMessage }] = useCreateCommunicationMessageMutation();
  const [updateMessage] = useUpdateCommunicationMessageMutation();
  const [deleteMessage] = useDeleteCommunicationMessageMutation();
  const [toggleMessageFlag] = useToggleCommunicationMessageFlagMutation();
  const [toggleMessageReaction] = useToggleCommunicationMessageReactionMutation();
  const [markThreadRead] = useMarkCommunicationThreadReadMutation();
  const [createCall, { isLoading: isCreatingCall }] = useCreateCommunicationCallMutation();
  const [uploadImage, { isLoading: isUploadingFile }] = useUploadImageMutation();
  const { data: threadCalls = [] } = useListCommunicationCallsQuery(
    normalizedThreadId ? { threadId: normalizedThreadId } : skipToken,
  );

  const { isConnected: isSocketConnected, setTyping } = useCommunicationSocket({
    onMessageCreated: (payload) => {
      refetchThreads();
      if (payload.threadId === normalizedThreadId) {
        refetchMessages();
      }
    },
    onTypingUpdated: ({ threadId: updatedThreadId, userId, isTyping }) => {
      const timerKey = `${updatedThreadId}:${userId}`;
      if (typingPresenceTimerByUserRef.current[timerKey]) {
        clearTimeout(typingPresenceTimerByUserRef.current[timerKey]);
        delete typingPresenceTimerByUserRef.current[timerKey];
      }

      setTypingUserIdsByThread((prev) => {
        const current = new Set(prev[updatedThreadId] ?? []);
        if (isTyping) current.add(userId);
        else current.delete(userId);
        return { ...prev, [updatedThreadId]: [...current] };
      });

      if (isTyping) {
        typingPresenceTimerByUserRef.current[timerKey] = setTimeout(() => {
          setTypingUserIdsByThread((prev) => {
            const current = new Set(prev[updatedThreadId] ?? []);
            current.delete(userId);
            return { ...prev, [updatedThreadId]: [...current] };
          });
          delete typingPresenceTimerByUserRef.current[timerKey];
        }, 3500);
      }
    },
  });

  useEffect(() => {
    setMessageLimit(60);
    setIsLoadingOlder(false);
    preserveScrollOnPrependRef.current = null;
    firstLoadDoneRef.current = false;
    stickToBottomRef.current = true;
  }, [normalizedThreadId]);

  useEffect(() => {
    return () => {
      if (composerTypingStopTimerRef.current) clearTimeout(composerTypingStopTimerRef.current);
      if (recordingTickTimerRef.current) clearInterval(recordingTickTimerRef.current);
      const timers = typingPresenceTimerByUserRef.current;
      for (const key of Object.keys(timers)) {
        clearTimeout(timers[key]);
      }
      typingPresenceTimerByUserRef.current = {};
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTs(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (pendingUpload?.previewUrl) {
        URL.revokeObjectURL(pendingUpload.previewUrl);
      }
    };
  }, [pendingUpload]);

  useEffect(() => {
    return () => {
      if (recordingPreviewUrl) {
        URL.revokeObjectURL(recordingPreviewUrl);
      }
    };
  }, [recordingPreviewUrl]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === normalizedThreadId) ?? null,
    [normalizedThreadId, threads],
  );

  const usersById = useMemo(() => {
    return new Map(userOptions.map((user) => [user.id, user]));
  }, [userOptions]);
  const mentionLookup = useMemo(() => buildMentionLookup(userOptions), [userOptions]);
  const userIdByMentionHandle = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of userOptions) {
      const handles = getUserMentionHandles(user);
      for (const handle of handles) {
        if (!handle) continue;
        map.set(handle, user.id);
      }
    }
    return map;
  }, [userOptions]);
  const activeMentionQuery = useMemo(
    () => getActiveMentionQuery(newMessage, composerCaret),
    [composerCaret, newMessage],
  );
  const mentionSuggestions = useMemo(() => {
    if (!activeMentionQuery) return [] as MentionSuggestion[];
    const query = activeMentionQuery.query;
    const everyone: MentionSuggestion = {
      key: 'everyone',
      label: '@everyone',
      subLabel: 'Notify everyone in this chat',
      insertHandle: 'everyone',
    };

    const users = userOptions
      .map((user) => {
        const handles = getUserMentionHandles(user);
        const label = user.fullname || user.email || user.id;
        const primaryHandle = preferredMentionHandle(user);
        const searchTerms = [label, user.email, user.id, ...handles, `@${primaryHandle}`]
          .join(' ')
          .toLowerCase();
        const starts =
          query.length === 0 ||
          primaryHandle.startsWith(query) ||
          label.toLowerCase().startsWith(query) ||
          user.email.toLowerCase().startsWith(query);

        return {
          key: user.id,
          label,
          subLabel: `@${primaryHandle}`,
          insertHandle: primaryHandle,
          matches: query.length === 0 || searchTerms.includes(query),
          starts,
        };
      })
      .filter((item) => item.matches)
      .sort((a, b) => Number(b.starts) - Number(a.starts) || a.label.localeCompare(b.label))
      .slice(0, 8)
      .map((item) => ({
        key: item.key,
        label: item.label,
        subLabel: item.subLabel,
        insertHandle: item.insertHandle,
      }));

    const includeEveryone = query.length === 0 || 'everyone'.includes(query);
    return includeEveryone ? [everyone, ...users].slice(0, 8) : users;
  }, [activeMentionQuery, userOptions]);
  const isMentionMenuOpen = Boolean(activeMentionQuery && mentionSuggestions.length);

  useEffect(() => {
    setActiveMentionIndex(0);
  }, [activeMentionQuery?.start, activeMentionQuery?.query]);

  const typingUserLabels = useMemo(() => {
    const typingUserIds = typingUserIdsByThread[normalizedThreadId] ?? [];
    return typingUserIds
      .filter((userId) => userId !== currentUserId)
      .map(
        (userId) =>
          usersById.get(userId)?.fullname ?? usersById.get(userId)?.email ?? 'Unknown user',
      )
      .slice(0, 3);
  }, [currentUserId, normalizedThreadId, typingUserIdsByThread, usersById]);

  useEffect(() => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;
    const preserve = preserveScrollOnPrependRef.current;
    if (preserve) {
      const nextTop = viewport.scrollHeight - preserve.height + preserve.top;
      viewport.scrollTop = nextTop;
      preserveScrollOnPrependRef.current = null;
      setIsLoadingOlder(false);
      return;
    }

    if (!firstLoadDoneRef.current || stickToBottomRef.current) {
      viewport.scrollTop = viewport.scrollHeight;
      firstLoadDoneRef.current = true;
    }
  }, [messages.length, typingUserLabels.length]);

  useEffect(() => {
    if (!isLoadingMessages && isLoadingOlder && !preserveScrollOnPrependRef.current) {
      setIsLoadingOlder(false);
    }
  }, [isLoadingMessages, isLoadingOlder]);

  useEffect(() => {
    if (!normalizedThreadId || isLoadingMessages || !messages.length) return;
    void markThreadRead({ threadId: normalizedThreadId });
  }, [isLoadingMessages, markThreadRead, messages.length, normalizedThreadId]);

  const onMessageInputChange = (value: string) => {
    setNewMessage(value);
    if (!normalizedThreadId) return;
    setTyping(normalizedThreadId, value.trim().length > 0);
    if (composerTypingStopTimerRef.current) clearTimeout(composerTypingStopTimerRef.current);
    composerTypingStopTimerRef.current = setTimeout(() => {
      setTyping(normalizedThreadId, false);
    }, 1800);
  };

  const isMediaMode = messageKind !== 'text';
  const canSendMessage = isMediaMode ? Boolean(mediaUrl.trim()) : Boolean(newMessage.trim());

  const insertMentionSuggestion = (suggestion: MentionSuggestion) => {
    if (!activeMentionQuery) return;
    const prefix = newMessage.slice(0, activeMentionQuery.start);
    const suffix = newMessage.slice(activeMentionQuery.end);
    const insertion = `@${suggestion.insertHandle} `;
    const nextValue = `${prefix}${insertion}${suffix}`;
    const nextCaret = prefix.length + insertion.length;

    setNewMessage(nextValue);
    setComposerCaret(nextCaret);

    requestAnimationFrame(() => {
      const input = composerInputRef.current;
      if (!input) return;
      input.focus();
      input.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const onSendMessage = async () => {
    if (!normalizedThreadId) return;
    if (!canSendMessage) {
      toast.error(isMediaMode ? 'Media URL is required.' : 'Message is empty.');
      return;
    }

    try {
      const trimmedBody = newMessage.trim();
      const trimmedMediaUrl = mediaUrl.trim();
      const mentionData = extractMentionsFromText(trimmedBody, mentionLookup);
      if (mentionData.mentionAll) {
        const shouldNotifyAll = window.confirm(
          'This message contains @everyone and will notify everyone in this chat. Continue?',
        );
        if (!shouldNotifyAll) return;
      } else if (mentionData.mentionedUserIds.length) {
        const mentionedLabels = mentionData.mentionedUserIds
          .slice(0, 5)
          .map((userId) => getDisplayNameForUser(usersById, userId));
        const shouldNotifyUsers = window.confirm(
          `This message will notify: ${mentionedLabels.join(', ')}${mentionData.mentionedUserIds.length > mentionedLabels.length ? ' and others' : ''}. Continue?`,
        );
        if (!shouldNotifyUsers) return;
      }
      const metadataJson = isMediaMode
        ? {
            url: trimmedMediaUrl,
            kind: messageKind,
            ...(mediaLabel.trim() ? { name: mediaLabel.trim() } : {}),
          }
        : null;

      if (editingMessage) {
        const existingMetadata = asRecord(editingMessage.metadataJson) ?? {};
        await updateMessage({
          id: editingMessage.id,
          threadId: normalizedThreadId,
          body: trimmedBody || null,
          metadataJson: {
            ...existingMetadata,
            ...(metadataJson ?? {}),
            mentionAll: mentionData.mentionAll,
            mentionedUserIds: mentionData.mentionedUserIds,
          },
        }).unwrap();
        setEditingMessage(null);
      } else {
        const replyMetadata = replyToMessage
          ? {
              replyTo: {
                id: replyToMessage.id,
                body: replyToMessage.body ?? '',
                sender: getDisplayNameForUser(usersById, replyToMessage.senderUserId),
                senderName: getDisplayNameForUser(usersById, replyToMessage.senderUserId),
                senderUserId: replyToMessage.senderUserId ?? null,
              },
              replyToBody: replyToMessage.body ?? '',
              replyToSender: getDisplayNameForUser(usersById, replyToMessage.senderUserId),
              replyToSenderName: getDisplayNameForUser(usersById, replyToMessage.senderUserId),
              replyToSenderUserId: replyToMessage.senderUserId ?? null,
            }
          : {};
        await createMessage({
          threadId: normalizedThreadId,
          body: trimmedBody || null,
          messageType: isMediaMode ? messageKind : 'text',
          metadataJson: {
            ...(metadataJson ?? {}),
            ...replyMetadata,
            mentionAll: mentionData.mentionAll,
            mentionedUserIds: mentionData.mentionedUserIds,
          },
          replyToMessageId: replyToMessage?.id ?? null,
        }).unwrap();
      }

      setNewMessage('');
      setMediaUrl('');
      setMediaLabel('');
      setReplyToMessage(null);
      setTyping(normalizedThreadId, false);
      refetchMessages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message.');
    }
  };

  const resolveMentionLabel = (handle: string) => {
    const normalized = normalizeMentionHandle(handle);
    if (!normalized) return 'unknown';
    if (normalized === 'everyone') return 'everyone';

    const userId = userIdByMentionHandle.get(normalized);
    if (userId) return getDisplayNameForUser(usersById, userId, 'unknown');

    if (looksLikeInternalId(normalized)) return 'unknown';
    return normalized;
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (isMentionMenuOpen) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveMentionIndex((prev) => (prev + 1) % mentionSuggestions.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveMentionIndex((prev) => (prev <= 0 ? mentionSuggestions.length - 1 : prev - 1));
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        const suggestion = mentionSuggestions[activeMentionIndex] ?? mentionSuggestions[0];
        if (suggestion) insertMentionSuggestion(suggestion);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setComposerCaret(-1);
        return;
      }
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void onSendMessage();
    }
  };

  const openFilePicker = (accept: string) => {
    setFilePickerAccept(accept);
    setIsUploadDialogOpen(true);
  };

  const handlePickedFile = async (file: File) => {
    if (!file) return;
    if (!SUPPORTED_UPLOAD_MIME_TYPES.has(file.type)) {
      toast.error(
        'Unsupported file type. Use image, audio/video, pdf, txt, zip, doc, docx, xls, or xlsx.',
      );
      return;
    }

    try {
      const dataUrl = await toDataUrl(file);
      const previewUrl = URL.createObjectURL(file);
      const kind =
        normalizeMediaKind(file.type) ?? (file.type.startsWith('image/') ? 'image' : 'file');
      const videoThumbnailDataUrl =
        kind === 'video' ? ((await extractVideoThumbnailDataUrl(file)) ?? undefined) : undefined;
      if (pendingUpload?.previewUrl) {
        URL.revokeObjectURL(pendingUpload.previewUrl);
      }
      setPendingUpload({ file, dataUrl, previewUrl, kind, videoThumbnailDataUrl });
      setUploadCaption('');
      setIsUploadDialogOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to open file preview.');
    }
  };

  const onPickFilesFromDrop = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    void handlePickedFile(file);
  };

  const clearPendingUpload = () => {
    if (pendingUpload?.previewUrl) {
      URL.revokeObjectURL(pendingUpload.previewUrl);
    }
    setPendingUpload(null);
    setUploadCaption('');
    setIsUploadDialogOpen(false);
  };

  const stopRecordingStream = () => {
    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
      mediaStreamRef.current = null;
    }
    if (recorderPreviewRef.current) {
      recorderPreviewRef.current.srcObject = null;
    }
  };

  const closeRecorderDialog = (discardRecording = true) => {
    if (recordingTickTimerRef.current) {
      clearInterval(recordingTickTimerRef.current);
      recordingTickTimerRef.current = null;
    }
    recordingStartedAtRef.current = null;
    setRecordingElapsedSec(0);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      shouldKeepRecordingResultRef.current = !discardRecording;
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    mediaRecorderChunksRef.current = [];
    setIsRecording(false);
    setIsPreparingRecording(false);
    setIsRecorderDialogOpen(false);
    stopRecordingStream();
  };

  const onRecordMedia = async (mode: RecordingMode) => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      toast.error('Recording is not supported in this browser.');
      return;
    }
    if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') {
      toast.error('Media recording is not supported in this browser.');
      return;
    }

    try {
      setRecordingMode(mode);
      setIsRecorderDialogOpen(true);
      setIsPreparingRecording(true);

      const oldPreviewUrl = recordingPreviewUrl;
      if (oldPreviewUrl) {
        URL.revokeObjectURL(oldPreviewUrl);
        setRecordingPreviewUrl(null);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === 'video',
      });
      mediaStreamRef.current = stream;

      const mimeType = pickSupportedRecorderMimeType(mode) ?? undefined;
      const recorder = new window.MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      mediaRecorderChunksRef.current = [];
      shouldKeepRecordingResultRef.current = true;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          mediaRecorderChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        toast.error('Recording failed. Please try again.');
        closeRecorderDialog();
      };

      recorder.onstop = () => {
        void (async () => {
          try {
            if (!shouldKeepRecordingResultRef.current) {
              closeRecorderDialog(false);
              return;
            }

            const chunks = mediaRecorderChunksRef.current;
            mediaRecorderChunksRef.current = [];
            if (!chunks.length) {
              closeRecorderDialog(false);
              return;
            }

            const blobType =
              chunks[0]?.type || mimeType || (mode === 'video' ? 'video/webm' : 'audio/webm');
            const normalizedBlobType = normalizeMimeType(blobType);
            const blob = new Blob(chunks, { type: blobType });
            const extension = getFileExtensionByMimeType(
              normalizedBlobType || blobType,
              mode === 'video' ? 'webm' : 'wav',
            );
            const file = new File([blob], `recording-${Date.now()}.${extension}`, {
              type: normalizedBlobType || blobType,
            });
            const startedAt = recordingStartedAtRef.current;
            const recordingDurationSec =
              startedAt && startedAt > 0
                ? Math.max(1, Math.round((Date.now() - startedAt) / 1000))
                : undefined;
            if (!SUPPORTED_UPLOAD_MIME_TYPES.has(normalizeMimeType(file.type))) {
              toast.error('Recorded format is not supported by the upload API.');
              closeRecorderDialog(false);
              return;
            }

            const dataUrl = await toDataUrl(file);
            const previewUrl = URL.createObjectURL(file);
            const previousPreview = recordingPreviewUrl;
            if (previousPreview) {
              URL.revokeObjectURL(previousPreview);
            }
            setRecordingPreviewUrl(previewUrl);
            const videoThumbnailDataUrl =
              mode === 'video'
                ? ((await extractVideoThumbnailDataUrl(file)) ?? undefined)
                : undefined;
            setPendingUpload({
              file,
              dataUrl,
              previewUrl,
              kind: mode,
              recordingDurationSec,
              videoThumbnailDataUrl,
            });
            setUploadCaption('');
            setIsUploadDialogOpen(true);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to process recording.');
          } finally {
            closeRecorderDialog(false);
          }
        })();
      };

      if (recorderPreviewRef.current) {
        recorderPreviewRef.current.srcObject = stream;
        if (mode === 'video') {
          void recorderPreviewRef.current.play().catch(() => null);
        }
      }

      recorder.start();
      recordingStartedAtRef.current = Date.now();
      setRecordingElapsedSec(0);
      if (recordingTickTimerRef.current) clearInterval(recordingTickTimerRef.current);
      recordingTickTimerRef.current = setInterval(() => {
        const startedAt = recordingStartedAtRef.current;
        if (!startedAt) return;
        setRecordingElapsedSec(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
      }, 250);
      setIsRecording(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to start recording.');
      closeRecorderDialog();
    } finally {
      setIsPreparingRecording(false);
    }
  };

  const onStopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    shouldKeepRecordingResultRef.current = true;
    recorder.stop();
    setIsRecording(false);
    stopRecordingStream();
  };

  const onUploadPickedFile = async () => {
    if (!pendingUpload || !normalizedThreadId) return;
    try {
      const uploaded = await uploadImage({
        modelType: 'communication-message',
        modelId: normalizedThreadId,
        fileName: pendingUpload.file.name,
        dataUrl: pendingUpload.dataUrl,
      }).unwrap();

      await createMessage({
        threadId: normalizedThreadId,
        body: uploadCaption.trim() || null,
        messageType: pendingUpload.kind,
        metadataJson: {
          url: uploaded.url,
          kind: pendingUpload.kind,
          name: uploaded.fileName,
          contentType: uploaded.contentType,
          sizeBytes: uploaded.sizeBytes,
          uploadId: uploaded.id,
          ...(pendingUpload.kind === 'video' && pendingUpload.videoThumbnailDataUrl
            ? { thumbnailUrl: pendingUpload.videoThumbnailDataUrl }
            : {}),
          ...(typeof pendingUpload.recordingDurationSec === 'number'
            ? {
                recordingDurationSec: pendingUpload.recordingDurationSec,
                durationSec: pendingUpload.recordingDurationSec,
              }
            : {}),
        },
      }).unwrap();

      clearPendingUpload();
      setTyping(normalizedThreadId, false);
      refetchMessages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload file.');
    }
  };

  const onReplyMessage = (message: CommunicationMessage) => {
    setReplyToMessage(message);
    setEditingMessage(null);
  };

  const onEditMessage = (message: CommunicationMessage) => {
    setEditingMessage(message);
    setNewMessage(message.body ?? '');
    setReplyToMessage(null);
  };

  const onDeleteMessage = async (message: CommunicationMessage) => {
    if (!normalizedThreadId) return;
    try {
      await deleteMessage({ id: message.id, threadId: normalizedThreadId }).unwrap();
      toast.success('Message deleted');
      refetchMessages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete message.');
    }
  };

  const onToggleFlag = async (
    message: CommunicationMessage,
    flag: 'pinnedByUserIds' | 'starredByUserIds',
  ) => {
    if (!normalizedThreadId) return;
    const enabled = !hasUserFlag(message, currentUserId, flag);
    try {
      await toggleMessageFlag({
        id: message.id,
        threadId: normalizedThreadId,
        flag,
        enabled,
      }).unwrap();
      refetchMessages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update message flag.');
    }
  };

  const onQuickReact = async (message: CommunicationMessage, emoji: string) => {
    if (!normalizedThreadId) return;
    try {
      await toggleMessageReaction({
        id: message.id,
        threadId: normalizedThreadId,
        emoji,
        enabled: true,
      }).unwrap();
      refetchMessages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add reaction.');
    }
  };

  const onForwardMessage = async (message: CommunicationMessage) => {
    if (!normalizedThreadId) return;
    try {
      await createMessage({
        threadId: normalizedThreadId,
        body: message.body,
        messageType: message.messageType,
        metadataJson: {
          ...(asRecord(message.metadataJson) ?? {}),
          forwardedFrom: {
            messageId: message.id,
            senderUserId: message.senderUserId,
            createdAt: message.createdAt,
          },
        },
      }).unwrap();
      toast.success('Message forwarded');
      refetchMessages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to forward message.');
    }
  };

  const onCreateCallBubble = async () => {
    if (!normalizedThreadId || !selectedThread) return;
    try {
      const call = await createCall({
        threadId: normalizedThreadId,
        callType: createCallType,
      }).unwrap();
      await createMessage({
        threadId: normalizedThreadId,
        messageType: 'call',
        body: null,
        metadataJson: {
          callId: call.id,
          status: call.status,
          callType: call.callType,
          scope: selectedThread.threadType,
          startedAt: call.startedAt ?? call.createdAt,
        },
      }).unwrap();
      setIsCallDialogOpen(false);
      toast.success('Call bubble created');
      refetchMessages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create call bubble.');
    }
  };

  const onCreateMeetingBubble = async () => {
    if (!normalizedThreadId || !meetingTitle.trim()) {
      toast.error('Meeting title is required.');
      return;
    }
    try {
      await createMessage({
        threadId: normalizedThreadId,
        messageType: 'meeting',
        body: null,
        metadataJson: {
          title: meetingTitle.trim(),
          link: meetingLink.trim() || null,
          startsAt: meetingStartAt ? meetingStartAt.toISOString() : null,
          reminderMinutes: Number.isFinite(Number(meetingReminderMinutes))
            ? Math.max(0, Number(meetingReminderMinutes))
            : 0,
          participantCount: selectedThread?.participantCount ?? null,
          scope: selectedThread?.threadType ?? 'thread',
        },
      }).unwrap();
      setIsMeetingDialogOpen(false);
      setMeetingTitle('');
      setMeetingLink('');
      setMeetingStartAt(undefined);
      setMeetingReminderMinutes('15');
      toast.success('Meeting bubble created');
      refetchMessages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create meeting bubble.');
    }
  };

  const onMessagesScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceToBottom < 80;

    const hasMoreOlderMessages = messages.length >= messageLimit;
    if (!hasMoreOlderMessages || isLoadingOlder || isLoadingMessages) return;
    if (el.scrollTop > 72) return;

    preserveScrollOnPrependRef.current = {
      top: el.scrollTop,
      height: el.scrollHeight,
    };
    setIsLoadingOlder(true);
    setMessageLimit((prev) => prev + 40);
  };

  const onOpenVideoAttachment = (url: string, label?: string) => {
    setActiveVideoAttachment({ url, label });
    setIsVideoPlayerDialogOpen(true);
  };

  return (
    <div className="w-full p-3">
      <div className="flex h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-2xl border bg-background shadow">
        <div className="z-20 flex shrink-0 items-center justify-between border-b bg-background/95 px-3 py-2 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => navigate('/communication/chat')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
              {(selectedThread?.title || 'T').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {selectedThread?.title || 'Untitled thread'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {selectedThread ? prettyValue(selectedThread.threadType) : 'Conversation thread'}
                {selectedThread?.participantCount
                  ? ` • ${selectedThread.participantCount} members`
                  : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => {
                setCreateCallType('audio');
                setIsCallDialogOpen(true);
              }}
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => {
                setCreateCallType('video');
                setIsCallDialogOpen(true);
              }}
            >
              <Video className="h-4 w-4" />
            </Button>
            <Badge
              variant={isSocketConnected ? 'default' : 'outline'}
              className="ml-1 hidden sm:inline-flex"
            >
              {isSocketConnected ? 'Live' : 'Offline'}
            </Badge>
          </div>
        </div>

        <div
          ref={messagesViewportRef}
          onScroll={onMessagesScroll}
          className="flex-1 overflow-y-auto bg-[#efeae2] px-2 py-3 dark:bg-[#0b141a] sm:px-4"
          style={{
            backgroundImage:
              'radial-gradient(circle at 24px 24px, rgba(120,120,120,0.08) 1.2px, transparent 0), radial-gradient(circle at 0 0, rgba(120,120,120,0.05) 1px, transparent 0)',
            backgroundSize: '48px 48px, 32px 32px',
          }}
        >
          {isLoadingOlder ? (
            <div className="flex justify-center py-2">
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                Loading older messages...
              </span>
            </div>
          ) : null}
          {isLoadingMessages ? (
            <p className="p-4 text-sm text-muted-foreground">Loading messages...</p>
          ) : null}

          {!isLoadingMessages && messages.length
            ? messages.map((message, index) => {
                const isOwnMessage = Boolean(
                  currentUserId && message.senderUserId === currentUserId,
                );
                const senderLabel = message.senderUserId
                  ? getDisplayNameForUser(usersById, message.senderUserId)
                  : 'System';
                const attachments = extractMediaAttachments(message);
                const replyPreview = extractReplyPreview(message);
                const reactions = extractReactions(message);
                const recordingDuration = extractRecordingDurationLabel(message);
                const messageMetadata = asRecord(message.metadataJson);
                const callIdFromMessage = firstString([
                  messageMetadata?.callId,
                  messageMetadata?.sessionId,
                ]);
                const liveCallStatus = callIdFromMessage
                  ? (threadCalls.find((call) => call.id === callIdFromMessage)?.status ?? null)
                  : null;
                const pinned = hasUserFlag(message, currentUserId, 'pinnedByUserIds');
                const starred = hasUserFlag(message, currentUserId, 'starredByUserIds');
                const canEditDelete = Boolean(
                  currentUserId &&
                    message.senderUserId === currentUserId &&
                    isWithinMinutes(message.createdAt, 5),
                );
                const isReactionMenuOpen = reactionMenuMessageId === message.id;
                const isActionsMenuOpen = actionsMenuMessageId === message.id;
                const thisDay = getDayKey(message.createdAt);
                const prevDay = index > 0 ? getDayKey(messages[index - 1]?.createdAt) : null;
                const dayLabel =
                  thisDay && thisDay !== prevDay ? formatDayLabel(message.createdAt) : null;

                return (
                  <div key={message.id} className="group/message mb-3 space-y-2 last:mb-0">
                    {dayLabel ? (
                      <div className="flex justify-center">
                        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                          {dayLabel}
                        </span>
                      </div>
                    ) : null}

                    <div
                      className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isOwnMessage ? (
                        <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                          {senderLabel.slice(0, 1).toUpperCase()}
                        </div>
                      ) : null}

                      <div
                        className={`relative max-w-[88%] rounded-2xl px-3 py-2 sm:max-w-[72%] ${reactions.length ? 'pb-4' : ''} ${
                          isOwnMessage
                            ? 'rounded-br-sm bg-[#d9fdd3] text-[#111b21] dark:bg-[#005c4b] dark:text-[#e9edef]'
                            : 'rounded-bl-sm border border-black/5 bg-white text-[#111b21] dark:border-white/10 dark:bg-[#202c33] dark:text-[#e9edef]'
                        }`}
                      >
                        <div
                          className={`absolute top-1 z-20 ${isOwnMessage ? '-left-11' : '-right-11'}`}
                        >
                          <button
                            type="button"
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/90 text-[#54656f] shadow-sm transition-all duration-75 group-hover/message:opacity-100 focus-visible:opacity-100 dark:border-white/15 dark:bg-[#1f2c34]/95 dark:text-[#aebac1] ${
                              isReactionMenuOpen ? 'opacity-100' : 'opacity-0'
                            }`}
                            onClick={() =>
                              setReactionMenuMessageId((prev) =>
                                prev === message.id ? null : message.id,
                              )
                            }
                          >
                            <Smile className="h-4 w-4" />
                          </button>
                        </div>

                        <div
                          className={`absolute top-1 z-20 ${isOwnMessage ? 'left-2' : 'right-2'}`}
                        >
                          <DropdownMenu
                            open={isActionsMenuOpen}
                            onOpenChange={(open) =>
                              setActionsMenuMessageId(open ? message.id : null)
                            }
                          >
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className={`inline-flex h-6 items-center gap-1 rounded-full border border-black/10 bg-white/90 px-2 text-[11px] text-[#54656f] shadow-sm backdrop-blur transition-all duration-75 group-hover/message:opacity-100 focus-visible:opacity-100 dark:border-white/15 dark:bg-[#1f2c34]/95 dark:text-[#aebac1] ${
                                  isActionsMenuOpen ? 'opacity-100' : 'opacity-0'
                                }`}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align={isOwnMessage ? 'end' : 'start'}
                              className="w-52 rounded-2xl border-black/10 bg-white/95 p-1.5 text-[#111b21] shadow-xl backdrop-blur dark:border-white/10 dark:bg-[#111b21]/95 dark:text-[#e9edef]"
                            >
                              <DropdownMenuItem onClick={() => onReplyMessage(message)}>
                                <Reply className="mr-2 h-3.5 w-3.5" /> Reply
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void onForwardMessage(message)}>
                                <Forward className="mr-2 h-3.5 w-3.5" /> Forward
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => void onToggleFlag(message, 'pinnedByUserIds')}
                              >
                                <Pin className="mr-2 h-3.5 w-3.5" />
                                {pinned ? 'Unpin' : 'Pin'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => void onToggleFlag(message, 'starredByUserIds')}
                              >
                                <Star className="mr-2 h-3.5 w-3.5" />
                                {starred ? 'Unstar' : 'Star'}
                              </DropdownMenuItem>
                              {canEditDelete ? (
                                <DropdownMenuItem onClick={() => onEditMessage(message)}>
                                  <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                                </DropdownMenuItem>
                              ) : null}
                              {canEditDelete ? (
                                <DropdownMenuItem onClick={() => void onDeleteMessage(message)}>
                                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {!isOwnMessage ? (
                          <p className="mb-0.5 text-xs font-semibold text-muted-foreground">
                            {senderLabel}
                          </p>
                        ) : null}

                        {replyPreview ? (
                          <div className="mb-1 rounded-lg border bg-muted/50 px-2 py-1 text-xs">
                            <p className="font-semibold text-muted-foreground">
                              {replyPreview.senderUserId
                                ? getDisplayNameForUser(
                                    usersById,
                                    replyPreview.senderUserId,
                                    ensureDisplayNameOnly(replyPreview.sender),
                                  )
                                : ensureDisplayNameOnly(replyPreview.sender)}
                            </p>
                            <p className="truncate">{replyPreview.body}</p>
                          </div>
                        ) : null}

                        {message.body ? (
                          <p className="text-sm whitespace-pre-wrap">
                            {renderRichText(message.body, resolveMentionLabel)}
                          </p>
                        ) : null}
                        {renderCallOrMeetingBubble(message, liveCallStatus)}
                        {renderMeetingReminderBubble(message, nowTs)}
                        {attachments.length ? (
                          <div className="space-y-2">
                            {attachments.map((attachment, attachmentIndex) => (
                              <div
                                key={`${message.id}-attachment-${attachment.kind}-${attachment.url}-${attachmentIndex}`}
                              >
                                {renderAttachment(attachment, isOwnMessage, {
                                  onOpenVideo: onOpenVideoAttachment,
                                })}
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {recordingDuration ? (
                          <p
                            className={`mt-1 text-xs ${isOwnMessage ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}
                          >
                            Recording • {recordingDuration}
                          </p>
                        ) : null}
                        <ChatMessageReactions
                          isOwnMessage={isOwnMessage}
                          reactions={reactions}
                          isActive={isReactionMenuOpen}
                          onOpenPicker={() =>
                            setReactionMenuMessageId((prev) =>
                              prev === message.id ? null : message.id,
                            )
                          }
                        />

                        <DropdownMenu
                          open={isReactionMenuOpen}
                          onOpenChange={(open) =>
                            setReactionMenuMessageId(open ? message.id : null)
                          }
                        >
                          <DropdownMenuTrigger asChild>
                            <span
                              className={`absolute -bottom-3 z-10 h-0 w-0 ${
                                isOwnMessage ? 'right-2' : 'left-2'
                              }`}
                            />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align={isOwnMessage ? 'end' : 'start'}
                            side="top"
                            className="rounded-full border border-black/10 bg-white/95 px-2 py-1 shadow-xl backdrop-blur dark:border-white/10 dark:bg-[#1f2c34]/95"
                          >
                            <div className="flex items-center gap-1">
                              {QUICK_REACTION_EMOJIS.map((emoji) => (
                                <button
                                  key={`${message.id}-reaction-picker-${emoji}`}
                                  type="button"
                                  onClick={() => void onQuickReact(message, emoji)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm transition hover:bg-black/5 dark:hover:bg-white/10"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <div
                          className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${isOwnMessage ? 'text-[#667781] dark:text-[#8696a0]' : 'text-muted-foreground'}`}
                        >
                          {pinned ? <Pin className="h-3 w-3" /> : null}
                          {starred ? <Star className="h-3 w-3" /> : null}
                          <span>{formatMessageTime(message.createdAt)}</span>
                          {isOwnMessage ? <span>✓✓</span> : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            : null}

          {!isLoadingMessages && !messages.length ? (
            <p className="p-4 text-sm text-muted-foreground">No messages yet.</p>
          ) : null}

          {typingUserLabels.length ? (
            <div className="mt-2 flex justify-start">
              <div className="rounded-2xl rounded-bl-sm border bg-card px-3 py-2">
                <div className="flex items-center gap-1">
                  {typingDotStyle.map((delay, index) => (
                    <span
                      key={delay}
                      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                      style={{ animationDelay: delay }}
                      aria-hidden={index > 0}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {typingUserLabels.join(', ')} {typingUserLabels.length > 1 ? 'are' : 'is'}{' '}
                  typing...
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="z-20 shrink-0 border-t bg-background/95 px-2 py-2 backdrop-blur sm:px-3">
          {replyToMessage ? (
            <div className="mb-2 flex items-start justify-between rounded-lg border bg-muted/40 px-3 py-2 text-xs">
              <div>
                <p className="font-medium">
                  Replying to{' '}
                  {getDisplayNameForUser(usersById, replyToMessage.senderUserId, 'message')}
                </p>
                <p className="line-clamp-1 text-muted-foreground">
                  {replyToMessage.body ?? '(attachment)'}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setReplyToMessage(null)}>
                Clear
              </Button>
            </div>
          ) : null}
          {editingMessage ? (
            <div className="mb-2 flex items-start justify-between rounded-lg border bg-muted/40 px-3 py-2 text-xs">
              <div>
                <p className="font-medium">Editing message</p>
                <p className="line-clamp-1 text-muted-foreground">
                  {editingMessage.body ?? '(attachment)'}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingMessage(null);
                  setNewMessage('');
                }}
              >
                Cancel edit
              </Button>
            </div>
          ) : null}
          {showMediaComposer ? (
            <div className="mb-2 grid gap-2 rounded-xl border bg-muted/30 p-2 sm:grid-cols-[160px_1fr_1fr]">
              <Select
                value={messageKind}
                onValueChange={(value) => setMessageKind(value as ComposerMessageKind)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Media URL (https://...)"
                value={mediaUrl}
                onChange={(event) => setMediaUrl(event.target.value)}
                disabled={isSendingMessage}
              />
              <Input
                placeholder="Label (optional)"
                value={mediaLabel}
                onChange={(event) => setMediaLabel(event.target.value)}
                disabled={isSendingMessage}
              />
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full">
                  <Plus className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem
                  onClick={() => openFilePicker('.pdf,.txt,.zip,.doc,.docx,.xls,.xlsx')}
                >
                  File
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    openFilePicker('image/png,image/jpeg,image/webp,video/mp4,video/webm')
                  }
                >
                  Photos and video
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsCallDialogOpen(true)}>
                  Start call bubble
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsMeetingDialogOpen(true)}>
                  Schedule meeting
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void onRecordMedia('audio')}>
                  Record audio
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void onRecordMedia('video')}>
                  Record video
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setMessageKind('text');
                    setShowMediaComposer(false);
                  }}
                >
                  Contact
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setMessageKind('text');
                    setShowMediaComposer(false);
                  }}
                >
                  Poll
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setMessageKind('text');
                    setShowMediaComposer(false);
                  }}
                >
                  Event
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openFilePicker('image/png,image/jpeg,image/webp')}>
                  AI images
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full">
              <Smile className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={`h-9 w-9 rounded-full ${isMediaMode ? 'text-primary' : ''}`}
              onClick={() => {
                setShowMediaComposer(true);
                if (messageKind === 'text') setMessageKind('file');
              }}
            >
              <Link2 className="h-4 w-4" />
            </Button>

            <div className="relative flex-1">
              {isMentionMenuOpen ? (
                <div className="absolute bottom-full z-30 mb-2 w-full overflow-hidden rounded-lg border bg-popover shadow-md">
                  <Command shouldFilter={false}>
                    <CommandList>
                      <CommandEmpty>No matching users.</CommandEmpty>
                      <CommandGroup>
                        {mentionSuggestions.map((suggestion, index) => (
                          <CommandItem
                            key={suggestion.key}
                            value={`${suggestion.label} ${suggestion.subLabel}`}
                            onMouseDown={(event) => {
                              event.preventDefault();
                              insertMentionSuggestion(suggestion);
                            }}
                            className={
                              index === activeMentionIndex
                                ? 'bg-accent text-accent-foreground'
                                : undefined
                            }
                          >
                            <div className="flex w-full min-w-0 items-center justify-between gap-2">
                              <span className="truncate">{suggestion.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {suggestion.subLabel}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              ) : null}
              <Input
                ref={composerInputRef}
                placeholder={isMediaMode ? 'Add caption and send...' : 'Type a message'}
                value={newMessage}
                onChange={(event) => {
                  onMessageInputChange(event.target.value);
                  setComposerCaret(event.target.selectionStart ?? event.target.value.length);
                }}
                onClick={(event) => setComposerCaret(event.currentTarget.selectionStart ?? 0)}
                onKeyUp={(event) => setComposerCaret(event.currentTarget.selectionStart ?? 0)}
                onBlur={() => {
                  if (normalizedThreadId) setTyping(normalizedThreadId, false);
                }}
                onKeyDown={onInputKeyDown}
                disabled={isSendingMessage}
                className="h-10 rounded-full"
              />
            </div>

            <Button
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => {
                if (canSendMessage) {
                  void onSendMessage();
                  return;
                }
                void onRecordMedia('audio');
              }}
              disabled={isSendingMessage || isPreparingRecording}
              title={canSendMessage ? 'Send message' : 'Record audio'}
            >
              {canSendMessage ? (
                <SendHorizontal className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Dialog
          open={isUploadDialogOpen}
          onOpenChange={(open) => (open ? setIsUploadDialogOpen(true) : clearPendingUpload())}
        >
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Upload Attachment</DialogTitle>
              <DialogDescription>
                Preview your file, add a caption, and upload it to this thread.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <FileDropUpload
                id="chat-thread-upload"
                files={pendingUpload ? [pendingUpload.file] : []}
                onFilesChange={onPickFilesFromDrop}
                accept={filePickerAccept}
                maxFiles={1}
                disabled={isUploadingFile || isSendingMessage}
                title="Drop a file here or click to choose"
                helperText="Supports image, video/audio, PDF, TXT, ZIP, DOC/DOCX, XLS/XLSX."
              />
              {pendingUpload ? (
                <>
                  {pendingUpload.kind === 'image' ? (
                    <img
                      src={pendingUpload.previewUrl}
                      alt={pendingUpload.file.name}
                      className="max-h-80 w-full rounded-lg border object-contain"
                    />
                  ) : pendingUpload.kind === 'video' ? (
                    <video
                      src={pendingUpload.previewUrl}
                      controls
                      className="max-h-80 w-full rounded-lg border bg-black object-contain"
                    />
                  ) : pendingUpload.kind === 'audio' ? (
                    <audio
                      src={pendingUpload.previewUrl}
                      controls
                      className="w-full rounded-lg border p-2"
                    />
                  ) : (
                    <div className="rounded-lg border bg-muted p-3 text-sm">
                      <p className="font-medium">{pendingUpload.file.name}</p>
                      <p className="text-muted-foreground">
                        {formatFileSize(pendingUpload.file.size)}
                      </p>
                    </div>
                  )}

                  <Input
                    placeholder="Add a caption (optional)"
                    value={uploadCaption}
                    onChange={(event) => setUploadCaption(event.target.value)}
                    disabled={isUploadingFile || isSendingMessage}
                  />
                </>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={clearPendingUpload}
                disabled={isUploadingFile || isSendingMessage}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void onUploadPickedFile()}
                disabled={!pendingUpload || isUploadingFile || isSendingMessage}
              >
                {isUploadingFile ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isRecorderDialogOpen}
          onOpenChange={(open) => (open ? setIsRecorderDialogOpen(true) : closeRecorderDialog())}
        >
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {recordingMode === 'video' ? 'Record Video' : 'Record Audio'}
              </DialogTitle>
              <DialogDescription>
                {isRecording
                  ? 'Recording in progress. Stop to preview and upload.'
                  : 'Preparing recorder...'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {isRecording ? (
                <p className="text-sm font-medium text-destructive">
                  Recording • {formatDurationClock(recordingElapsedSec)}
                </p>
              ) : null}
              {recordingMode === 'video' ? (
                <video
                  ref={recorderPreviewRef}
                  muted
                  playsInline
                  className="max-h-80 w-full rounded-lg border bg-black object-contain"
                />
              ) : (
                <div className="rounded-lg border bg-muted p-3 text-sm">
                  {isRecording ? 'Recording audio...' : 'Requesting microphone access...'}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => closeRecorderDialog()}
                disabled={isPreparingRecording}
              >
                Cancel
              </Button>
              <Button type="button" onClick={onStopRecording} disabled={!isRecording}>
                Stop Recording
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isVideoPlayerDialogOpen}
          onOpenChange={(open) => {
            setIsVideoPlayerDialogOpen(open);
            if (!open) setActiveVideoAttachment(null);
          }}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{activeVideoAttachment?.label || 'Video'}</DialogTitle>
            </DialogHeader>
            {activeVideoAttachment ? (
              <video
                key={activeVideoAttachment.url}
                src={activeVideoAttachment.url}
                controls
                autoPlay
                className="max-h-[72vh] w-full rounded-lg bg-black"
                preload="metadata"
              />
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog open={isCallDialogOpen} onOpenChange={setIsCallDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Call Bubble</DialogTitle>
              <DialogDescription>Create a call entry in this thread.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <p className="text-sm font-medium">Call type</p>
              <Select
                value={createCallType}
                onValueChange={(value) => setCreateCallType(value as 'audio' | 'video')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCallDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void onCreateCallBubble()} disabled={isCreatingCall}>
                {isCreatingCall ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isMeetingDialogOpen} onOpenChange={setIsMeetingDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Schedule Meeting Bubble</DialogTitle>
              <DialogDescription>Share meeting details directly in this thread.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Meeting title"
                value={meetingTitle}
                onChange={(event) => setMeetingTitle(event.target.value)}
              />
              <Input
                placeholder="Meeting link (https://...)"
                value={meetingLink}
                onChange={(event) => setMeetingLink(event.target.value)}
              />
              <DateTimePicker
                value={meetingStartAt}
                onChange={setMeetingStartAt}
                placeholder="Select meeting date and time"
              />
              <Select value={meetingReminderMinutes} onValueChange={setMeetingReminderMinutes}>
                <SelectTrigger>
                  <SelectValue placeholder="Reminder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No reminder</SelectItem>
                  <SelectItem value="5">5 minutes before</SelectItem>
                  <SelectItem value="10">10 minutes before</SelectItem>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="30">30 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMeetingDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void onCreateMeetingBubble()}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
