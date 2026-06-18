import type { CommunicationMessage, MobileUserOption } from '@mobile/types/communication';
import {
  normalizeIdentity,
  resolveDirectThreadTitle,
} from '@mobile/features/communication/utils/thread-identity';

type ThreadMessage = CommunicationMessage & { _optimistic?: boolean; _failed?: boolean };

export function getParticipantCount(messages: ThreadMessage[], currentUserId: string | null) {
  const ids = new Set<string>();
  if (currentUserId) ids.add(currentUserId);
  messages.forEach((message) => {
    const sender = normalizeIdentity(message.senderUserId);
    if (sender) ids.add(sender);
  });
  return Math.max(1, ids.size);
}

export function getTypingUsers(
  typingByUserId: Record<string, boolean>,
  usersById: Map<string, { fullname?: string | null; email?: string | null }>,
) {
  return [
    ...new Set(
      Object.entries(typingByUserId)
        .filter(([, typing]) => typing)
        .map(([userId]) => usersById.get(userId)?.fullname?.trim() || 'Someone'),
    ),
  ];
}

export function resolveThreadTitle(input: {
  threadType: string;
  routeTitle: string;
  messages: ThreadMessage[];
  usersById: Map<string, MobileUserOption>;
  peerUserId: string;
  currentUserIdentitySet: Set<string>;
  currentUserSub?: string | null;
  currentUserFullname?: string | null;
  currentUserEmail?: string | null;
}) {
  if (input.threadType !== 'direct') return input.routeTitle;
  return resolveDirectThreadTitle({
    routeTitle: input.routeTitle,
    messages: input.messages,
    usersById: input.usersById,
    directPeerUserId: input.peerUserId || null,
    currentUserIdentitySet: input.currentUserIdentitySet,
    currentUserSub: input.currentUserSub,
    currentUserFullname: input.currentUserFullname,
    currentUserEmail: input.currentUserEmail,
  });
}
