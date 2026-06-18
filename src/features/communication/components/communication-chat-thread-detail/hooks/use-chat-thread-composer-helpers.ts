import {
  getDisplayNameForUser,
  looksLikeInternalId,
} from '../utils/communication-chat-thread-detail-message';
import { normalizeMentionHandle } from '../utils/communication-chat-thread-detail-mentions';
import type { MentionSuggestion } from '../types/communication-chat-thread-detail.types';

export function resolveMentionLabel(
  handle: string,
  userIdByMentionHandle: Map<string, string>,
  usersById: Map<string, { fullname?: string | null; email?: string | null }>,
) {
  const normalized = normalizeMentionHandle(handle);
  if (!normalized) return 'unknown';
  if (normalized === 'everyone') return 'everyone';
  const userId = userIdByMentionHandle.get(normalized);
  if (userId) return getDisplayNameForUser(usersById, userId, 'unknown');
  if (looksLikeInternalId(normalized)) return 'unknown';
  return normalized;
}

export function resolveReplySenderLabel(input: {
  sender?: string;
  senderUserId?: string | null;
  currentUserId: string;
  usersById: Map<string, { fullname?: string | null; email?: string | null }>;
}) {
  if (input.senderUserId && input.senderUserId === input.currentUserId) return 'You';
  if (input.senderUserId) {
    return getDisplayNameForUser(
      input.usersById,
      input.senderUserId,
      input.sender?.trim() || 'Original message',
    );
  }
  return input.sender?.trim() || 'Original message';
}

export function handleComposerKeyDown(input: {
  event: React.KeyboardEvent<HTMLInputElement>;
  isMentionMenuOpen: boolean;
  mentionSuggestions: MentionSuggestion[];
  activeMentionIndex: number;
  setActiveMentionIndex: React.Dispatch<React.SetStateAction<number>>;
  insertMentionSuggestion: (suggestion: MentionSuggestion) => void;
  setComposerCaret: (value: number) => void;
  onSendMessage: () => Promise<void>;
}) {
  const {
    event,
    isMentionMenuOpen,
    mentionSuggestions,
    activeMentionIndex,
    setActiveMentionIndex,
    insertMentionSuggestion,
    setComposerCaret,
    onSendMessage,
  } = input;
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
}
