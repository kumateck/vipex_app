import type { UserOption } from '@/features/users/api/users.api';
import type { MentionSuggestion } from '../types/communication-chat-thread-detail.types';

export function normalizeMentionHandle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');
}

export function getUserMentionHandles(user: UserOption) {
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

export function preferredMentionHandle(user: UserOption) {
  const handles = getUserMentionHandles(user);
  return handles[1] ?? handles[2] ?? handles[0] ?? normalizeMentionHandle(user.id);
}

export function buildMentionLookup(users: UserOption[]) {
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

export function extractMentionsFromText(text: string, mentionLookup: Map<string, string>) {
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

export function getActiveMentionQuery(text: string, caret: number) {
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

export function buildMentionSuggestions(
  userOptions: UserOption[],
  activeMentionQuery: { query: string } | null,
): MentionSuggestion[] {
  if (!activeMentionQuery) return [];
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
}
