import type {
  CommunicationEngagementRequestTarget,
  CommunicationThread,
  MobileUserOption,
} from '@mobile/types/communication';

export function normalizeIdentity(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}

function toMillis(value?: string | null) {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function preferText(current?: string | null, incoming?: string | null) {
  const next = incoming?.trim();
  if (next) return next;
  const existing = current?.trim();
  return existing || null;
}

export function dedupeMobileUserOptions(users: MobileUserOption[]): MobileUserOption[] {
  const byId = new Map<string, MobileUserOption>();
  users.forEach((user) => {
    const existing = byId.get(user.id);
    if (!existing) {
      byId.set(user.id, user);
      return;
    }

    byId.set(user.id, {
      ...existing,
      ...user,
      email: preferText(existing.email, user.email) || existing.email,
      fullname: preferText(existing.fullname, user.fullname) || existing.fullname,
      roleName: preferText(existing.roleName, user.roleName),
      branchName: preferText(existing.branchName, user.branchName),
      locationName: preferText(existing.locationName, user.locationName),
      branchId: preferText(existing.branchId, user.branchId),
      locationId: preferText(existing.locationId, user.locationId),
      branchType: user.branchType ?? existing.branchType ?? null,
    });
  });
  return [...byId.values()];
}

export function dedupeRequestTargets(
  targets: CommunicationEngagementRequestTarget[],
): CommunicationEngagementRequestTarget[] {
  const byId = new Map<string, CommunicationEngagementRequestTarget>();
  targets.forEach((target) => {
    if (!byId.has(target.id)) byId.set(target.id, target);
  });
  return [...byId.values()];
}

export function choosePreferredDirectThread(
  current: CommunicationThread,
  candidate: CommunicationThread,
) {
  const currentTs = toMillis(current.lastMessageAt);
  const candidateTs = toMillis(candidate.lastMessageAt);
  if (candidateTs !== currentTs) {
    return candidateTs > currentTs ? candidate : current;
  }
  if (!current.lastMessagePreview && candidate.lastMessagePreview) return candidate;
  if (!current.lastMessageType && candidate.lastMessageType) return candidate;
  return current;
}

export function buildCurrentUserTypingIdentitySet(input: {
  currentUserId: string | null;
  currentUserEmail?: string | null;
  currentUserFullname?: string | null;
  users: MobileUserOption[];
}) {
  const selfId = normalizeIdentity(input.currentUserId);
  const selfEmail = normalizeIdentity(input.currentUserEmail);
  const selfName = normalizeIdentity(input.currentUserFullname);
  const set = new Set<string>();
  if (selfId) set.add(selfId);
  if (selfEmail) set.add(selfEmail);
  if (selfName) set.add(selfName);

  input.users.forEach((user) => {
    const userId = normalizeIdentity(user.id);
    const userEmail = normalizeIdentity(user.email);
    const userName = normalizeIdentity(user.fullname);
    if ((selfEmail && userEmail === selfEmail) || (selfName && userName === selfName)) {
      if (userId) set.add(userId);
    }
  });

  return set;
}

export function buildDirectThreadByUserId(threads: CommunicationThread[]) {
  const map = new Map<string, CommunicationThread>();
  threads.forEach((thread) => {
    if (!thread.directPeerUserId) return;
    const existing = map.get(thread.directPeerUserId);
    map.set(
      thread.directPeerUserId,
      existing ? choosePreferredDirectThread(existing, thread) : thread,
    );
  });
  return map;
}
