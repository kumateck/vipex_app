export function toInitials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (!parts.length) return '?';
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export function normalizeIdentity(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}

export function toMillis(value?: string | null) {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

export function choosePreferredDirectThread<
  T extends {
    lastMessageAt?: string | null;
    lastMessagePreview?: string | null;
    lastMessageType?: string | null;
  },
>(current: T, candidate: T) {
  const currentTs = toMillis(current.lastMessageAt);
  const candidateTs = toMillis(candidate.lastMessageAt);
  if (candidateTs !== currentTs) return candidateTs > currentTs ? candidate : current;
  if (!current.lastMessagePreview && candidate.lastMessagePreview) return candidate;
  if (!current.lastMessageType && candidate.lastMessageType) return candidate;
  return current;
}

export function buildCurrentUserIdentitySet(input: {
  id?: string | null;
  email?: string | null;
  fullname?: string | null;
  employeeId?: string | null;
}) {
  const set = new Set<string>();
  const selfId = normalizeIdentity(input.id);
  const selfEmail = normalizeIdentity(input.email);
  const selfName = normalizeIdentity(input.fullname);
  const selfEmployeeId = normalizeIdentity(input.employeeId);
  if (selfId) set.add(selfId);
  if (selfEmail) set.add(selfEmail);
  if (selfName) set.add(selfName);
  if (selfEmployeeId) set.add(selfEmployeeId);
  return set;
}
