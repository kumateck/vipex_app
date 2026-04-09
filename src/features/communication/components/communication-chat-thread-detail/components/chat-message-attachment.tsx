import { Play } from 'lucide-react';
import type { MediaAttachment } from '../types/communication-chat-thread-detail.types';

type ChatMessageAttachmentProps = {
  attachment: MediaAttachment;
  isOwnMessage: boolean;
  onOpenVideo: (url: string, label?: string) => void;
};

export function ChatMessageAttachment({
  attachment,
  isOwnMessage,
  onOpenVideo,
}: ChatMessageAttachmentProps) {
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
        onClick={() => onOpenVideo(attachment.url, attachment.label)}
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
