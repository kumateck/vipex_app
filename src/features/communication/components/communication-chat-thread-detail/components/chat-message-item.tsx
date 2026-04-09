import { ChevronDown, Forward, Pencil, Pin, Reply, Smile, Star, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CommunicationMessage } from '../../../api/communication.api';
import { QUICK_REACTION_EMOJIS } from '../types/communication-chat-thread-detail.types';
import {
  formatMessageTime,
  renderCallOrMeetingBubble,
  renderMeetingReminderBubble,
  renderRichText,
} from '../utils/communication-chat-thread-detail-message';
import { ChatMessageAttachment } from './chat-message-attachment';
import { ChatMessageReactions } from './chat-message-reactions';

type ChatMessageItemProps = {
  message: CommunicationMessage;
  dayLabel: string | null;
  isOwnMessage: boolean;
  senderLabel: string;
  replyPreview: { sender?: string; senderUserId?: string | null; body: string } | null;
  attachments: ReturnType<
    typeof import('../utils/communication-chat-thread-detail-media').extractMediaAttachments
  >;
  reactions: Array<{ emoji: string; count: number }>;
  recordingDuration: string | null;
  liveCallStatus: string | null;
  pinned: boolean;
  starred: boolean;
  canEditDelete: boolean;
  isReactionMenuOpen: boolean;
  isActionsMenuOpen: boolean;
  nowTs: number;
  resolveMentionLabel: (handle: string) => string;
  resolveReplySenderLabel: (replyPreview: {
    sender?: string;
    senderUserId?: string | null;
  }) => string;
  onReply: () => void;
  onForward: () => void;
  onTogglePin: () => void;
  onToggleStar: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onQuickReact: (emoji: string) => void;
  onToggleReactionMenu: () => void;
  onReactionMenuOpenChange: (open: boolean) => void;
  onToggleActionsMenu: (open: boolean) => void;
  onOpenVideoAttachment: (url: string, label?: string) => void;
};

export function ChatMessageItem({
  message,
  dayLabel,
  isOwnMessage,
  senderLabel,
  replyPreview,
  attachments,
  reactions,
  recordingDuration,
  liveCallStatus,
  pinned,
  starred,
  canEditDelete,
  isReactionMenuOpen,
  isActionsMenuOpen,
  nowTs,
  resolveMentionLabel,
  resolveReplySenderLabel,
  onReply,
  onForward,
  onTogglePin,
  onToggleStar,
  onEdit,
  onDelete,
  onQuickReact,
  onToggleReactionMenu,
  onReactionMenuOpenChange,
  onToggleActionsMenu,
  onOpenVideoAttachment,
}: ChatMessageItemProps) {
  return (
    <div className="group/message mb-3 space-y-2 last:mb-0">
      {dayLabel ? (
        <div className="flex justify-center">
          <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            {dayLabel}
          </span>
        </div>
      ) : null}

      <div className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
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
          <div className={`absolute top-1 z-20 ${isOwnMessage ? '-left-11' : '-right-11'}`}>
            <button
              type="button"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/90 text-[#54656f] shadow-sm transition-all duration-75 group-hover/message:opacity-100 focus-visible:opacity-100 dark:border-white/15 dark:bg-[#1f2c34]/95 dark:text-[#aebac1] ${
                isReactionMenuOpen ? 'opacity-100' : 'opacity-0'
              }`}
              onClick={onToggleReactionMenu}
            >
              <Smile className="h-4 w-4" />
            </button>
          </div>

          <div className={`absolute top-1 z-20 ${isOwnMessage ? 'left-2' : 'right-2'}`}>
            <DropdownMenu open={isActionsMenuOpen} onOpenChange={onToggleActionsMenu}>
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
                <DropdownMenuItem onClick={onReply}>
                  <Reply className="mr-2 h-3.5 w-3.5" /> Reply
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onForward}>
                  <Forward className="mr-2 h-3.5 w-3.5" /> Forward
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onTogglePin}>
                  <Pin className="mr-2 h-3.5 w-3.5" />
                  {pinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onToggleStar}>
                  <Star className="mr-2 h-3.5 w-3.5" />
                  {starred ? 'Unstar' : 'Star'}
                </DropdownMenuItem>
                {canEditDelete ? (
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                  </DropdownMenuItem>
                ) : null}
                {canEditDelete ? (
                  <DropdownMenuItem onClick={onDelete}>
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {!isOwnMessage ? (
            <p className="mb-0.5 text-xs font-semibold text-muted-foreground">{senderLabel}</p>
          ) : null}

          {replyPreview ? (
            <div className="mb-1 rounded-lg border bg-muted/50 px-2 py-1 text-xs">
              <p className="font-semibold text-muted-foreground">
                {resolveReplySenderLabel(replyPreview)}
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
                  <ChatMessageAttachment
                    attachment={attachment}
                    isOwnMessage={isOwnMessage}
                    onOpenVideo={onOpenVideoAttachment}
                  />
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
            onOpenPicker={onToggleReactionMenu}
          />

          <DropdownMenu open={isReactionMenuOpen} onOpenChange={onReactionMenuOpenChange}>
            <DropdownMenuTrigger asChild>
              <span
                className={`absolute -bottom-3 z-10 h-0 w-0 ${isOwnMessage ? 'right-2' : 'left-2'}`}
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
                    onClick={() => onQuickReact(emoji)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm transition hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div
            className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${
              isOwnMessage ? 'text-[#667781] dark:text-[#8696a0]' : 'text-muted-foreground'
            }`}
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
}
