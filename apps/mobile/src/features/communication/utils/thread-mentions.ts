import type { MobileUserOption } from '@mobile/types/communication';

export function normalizeMentionHandle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');
}

export function getUserMentionHandles(user: MobileUserOption) {
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

export function buildMentionLookup(users: MobileUserOption[]) {
  const map = new Map<string, string>();
  for (const user of users) {
    for (const handle of getUserMentionHandles(user)) {
      if (!map.has(handle)) map.set(handle, user.id);
    }
  }
  return map;
}

export function extractMentionsFromText(text: string, mentionLookup: Map<string, string>) {
  const mentionedUserIds = new Set<string>();
  let mentionAll = false;
  const regex = /(^|\s)@([a-zA-Z0-9._-]+)/g;
  let match = regex.exec(text);
  while (match) {
    const token = normalizeMentionHandle(match[2] ?? '');
    if (token === 'everyone') {
      mentionAll = true;
    } else {
      const userId = mentionLookup.get(token);
      if (userId) mentionedUserIds.add(userId);
    }
    match = regex.exec(text);
  }
  return { mentionAll, mentionedUserIds: [...mentionedUserIds] };
}

export function extractActiveMention(
  value: string,
  cursor: number,
): { query: string; startIndex: number; endIndex: number } | null {
  const safeCursor = Math.max(0, Math.min(cursor, value.length));
  const left = value.slice(0, safeCursor);
  const match = left.match(/(^|\s)@([a-zA-Z0-9._-]*)$/);
  if (!match) return null;
  const token = match[2] ?? '';
  const atIndex = left.lastIndexOf('@');
  if (atIndex < 0) return null;
  return { query: token, startIndex: atIndex + 1, endIndex: safeCursor };
}
