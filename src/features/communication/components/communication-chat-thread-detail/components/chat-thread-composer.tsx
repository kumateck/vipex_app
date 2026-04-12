import type { RefObject } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Link2, Mic, Plus, SendHorizontal, Smile } from 'lucide-react';
import type { CommunicationMessage } from '../../../api/communication.api';
import type {
  ComposerMessageKind,
  MentionSuggestion,
} from '../types/communication-chat-thread-detail.types';
import { getDisplayNameForUser } from '../utils/communication-chat-thread-detail-message';
import { ChatThreadMentionMenu } from './chat-thread-mention-menu';

type ChatThreadComposerProps = {
  normalizedThreadId: string;
  currentUserId: string;
  replyToMessage: CommunicationMessage | null;
  setReplyToMessage: (message: CommunicationMessage | null) => void;
  editingMessage: CommunicationMessage | null;
  setEditingMessage: (message: CommunicationMessage | null) => void;
  usersById: Map<string, { fullname?: string | null; email?: string | null }>;
  showMediaComposer: boolean;
  setShowMediaComposer: (value: boolean) => void;
  messageKind: ComposerMessageKind;
  setMessageKind: (value: ComposerMessageKind) => void;
  mediaUrl: string;
  setMediaUrl: (value: string) => void;
  mediaLabel: string;
  setMediaLabel: (value: string) => void;
  isSendingMessage: boolean;
  openFilePicker: (accept: string) => void;
  onOpenCallDialog: () => void;
  onOpenMeetingDialog: () => void;
  onRecordAudio: () => void;
  onRecordVideo: () => void;
  isMentionMenuOpen: boolean;
  mentionSuggestions: MentionSuggestion[];
  activeMentionIndex: number;
  insertMentionSuggestion: (suggestion: MentionSuggestion) => void;
  composerInputRef: RefObject<HTMLInputElement | null>;
  newMessage: string;
  setComposerCaret: (value: number) => void;
  onMessageInputChange: (value: string) => void;
  onInputBlur: () => void;
  onInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  canSendMessage: boolean;
  onSendMessage: () => void;
  isPreparingRecording: boolean;
};

export function ChatThreadComposer({
  normalizedThreadId,
  currentUserId,
  replyToMessage,
  setReplyToMessage,
  editingMessage,
  setEditingMessage,
  usersById,
  showMediaComposer,
  setShowMediaComposer,
  messageKind,
  setMessageKind,
  mediaUrl,
  setMediaUrl,
  mediaLabel,
  setMediaLabel,
  isSendingMessage,
  openFilePicker,
  onOpenCallDialog,
  onOpenMeetingDialog,
  onRecordAudio,
  onRecordVideo,
  isMentionMenuOpen,
  mentionSuggestions,
  activeMentionIndex,
  insertMentionSuggestion,
  composerInputRef,
  newMessage,
  setComposerCaret,
  onMessageInputChange,
  onInputBlur,
  onInputKeyDown,
  canSendMessage,
  onSendMessage,
  isPreparingRecording,
}: ChatThreadComposerProps) {
  const isMediaMode = messageKind !== 'text';
  const replySenderLabel = replyToMessage
    ? replyToMessage.senderUserId === currentUserId
      ? 'You'
      : replyToMessage.senderUserId
        ? getDisplayNameForUser(
            usersById,
            replyToMessage.senderUserId,
            replyToMessage.senderName?.trim() || 'message',
          )
        : replyToMessage.senderName?.trim() || 'message'
    : 'message';
  const resetToTextComposer = () => {
    setMessageKind('text');
    setShowMediaComposer(false);
  };

  return (
    <div className="z-20 shrink-0 border-t bg-background/95 px-2 py-2 backdrop-blur sm:px-3">
      {replyToMessage ? (
        <div className="mb-2 flex items-start justify-between rounded-lg border bg-muted/40 px-3 py-2 text-xs">
          <div>
            <p className="font-medium">Replying to {replySenderLabel}</p>
            <p className="line-clamp-1 text-muted-foreground">
              {replyToMessage.body?.trim() || '(attachment)'}
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
              onMessageInputChange('');
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
              onClick={() => openFilePicker('image/png,image/jpeg,image/webp,video/mp4,video/webm')}
            >
              Photos and video
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenCallDialog}>Start call bubble</DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenMeetingDialog}>Schedule meeting</DropdownMenuItem>
            <DropdownMenuItem onClick={onRecordAudio}>Record audio</DropdownMenuItem>
            <DropdownMenuItem onClick={onRecordVideo}>Record video</DropdownMenuItem>
            <DropdownMenuItem onClick={resetToTextComposer}>Contact</DropdownMenuItem>
            <DropdownMenuItem onClick={resetToTextComposer}>Poll</DropdownMenuItem>
            <DropdownMenuItem onClick={resetToTextComposer}>Event</DropdownMenuItem>
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
          <ChatThreadMentionMenu
            activeMentionIndex={activeMentionIndex}
            insertMentionSuggestion={insertMentionSuggestion}
            isMentionMenuOpen={isMentionMenuOpen}
            mentionSuggestions={mentionSuggestions}
          />
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
            onBlur={onInputBlur}
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
              onSendMessage();
              return;
            }
            onRecordAudio();
          }}
          disabled={isSendingMessage || isPreparingRecording || !normalizedThreadId}
          title={canSendMessage ? 'Send message' : 'Record audio'}
        >
          {canSendMessage ? <SendHorizontal className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
