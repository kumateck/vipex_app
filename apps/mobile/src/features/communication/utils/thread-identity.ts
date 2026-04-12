export function normalizeIdentity(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}

export function extractHttpStatus(error: unknown): number | null {
  const source = error instanceof Error ? error.message : String(error);
  const match = source.match(/\((\d{3})\)/);
  const parsed = match ? Number(match[1]) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export function resolveDirectThreadTitle(input: {
  routeTitle: string;
  messages: Array<{ senderUserId?: string | null; senderName?: string | null }>;
  usersById: Map<string, { fullname?: string | null; email?: string | null }>;
  directPeerUserId?: string | null;
  currentUserIdentitySet?: Set<string>;
  currentUserSub?: string | null;
  currentUserFullname?: string | null;
  currentUserEmail?: string | null;
}) {
  const selfIdentity = new Set<string>(
    [input.currentUserSub, input.currentUserFullname, input.currentUserEmail]
      .map((value) => normalizeIdentity(value))
      .filter(Boolean),
  );
  input.currentUserIdentitySet?.forEach((value) => {
    const normalized = normalizeIdentity(value);
    if (normalized) selfIdentity.add(normalized);
  });
  for (const [userId, user] of input.usersById.entries()) {
    if (!selfIdentity.has(normalizeIdentity(userId))) continue;
    const fullname = normalizeIdentity(user.fullname);
    const email = normalizeIdentity(user.email);
    if (fullname) selfIdentity.add(fullname);
    if (email) selfIdentity.add(email);
  }
  const safeRouteTitle =
    input.routeTitle.trim() && !selfIdentity.has(normalizeIdentity(input.routeTitle))
      ? input.routeTitle.trim()
      : '';
  const directPeerName = input.directPeerUserId
    ? (input.usersById.get(input.directPeerUserId)?.fullname?.trim() ?? '')
    : '';
  if (directPeerName && !selfIdentity.has(normalizeIdentity(directPeerName))) {
    return directPeerName;
  }

  for (let index = input.messages.length - 1; index >= 0; index -= 1) {
    const message = input.messages[index];
    if (!message) continue;
    if (message.senderUserId && selfIdentity.has(normalizeIdentity(message.senderUserId))) continue;
    const fromUsers = message.senderUserId
      ? input.usersById.get(message.senderUserId)?.fullname?.trim()
      : '';
    if (fromUsers) return fromUsers;
    const fromSenderName = message.senderName?.trim();
    if (fromSenderName && !selfIdentity.has(normalizeIdentity(fromSenderName)))
      return fromSenderName;
  }

  return safeRouteTitle || 'Direct chat';
}

export function buildCurrentUserIdentitySet(input: {
  currentUserSub?: string | null;
  currentUserFullname?: string | null;
  currentUserEmail?: string | null;
  userOptions: Array<{ id: string; email: string; fullname: string }>;
}) {
  const set = new Set<string>();
  const sessionSub = normalizeIdentity(input.currentUserSub);
  const sessionEmail = normalizeIdentity(input.currentUserEmail);
  const sessionName = normalizeIdentity(input.currentUserFullname);
  if (sessionSub) set.add(sessionSub);
  if (sessionEmail) set.add(sessionEmail);
  input.userOptions.forEach((user) => {
    const userEmail = normalizeIdentity(user.email);
    const userName = normalizeIdentity(user.fullname);
    if ((sessionEmail && userEmail === sessionEmail) || (sessionName && userName === sessionName)) {
      set.add(normalizeIdentity(user.id));
    }
  });
  return set;
}
