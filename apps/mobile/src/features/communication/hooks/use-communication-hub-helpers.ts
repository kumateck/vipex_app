import type { CommunicationCallSession } from '@mobile/types/communication';
import type { CommunicationLoadState, UserChatEntry } from '../types';

export const EMPTY_DATA: CommunicationLoadState = {
  threads: [],
  textChannels: [],
  voiceChannels: [],
  users: [],
  requestTargets: [],
  incomingRequests: [],
  outgoingRequests: [],
  activeCalls: [],
  threadUnreadById: new Map(),
  voiceUnreadById: new Map(),
};

export function toActiveCallByChannelId(calls: CommunicationCallSession[]) {
  const map = new Map<string, CommunicationCallSession>();
  calls.forEach((call) => {
    if (call.channelId) map.set(call.channelId, call);
  });
  return map;
}

export function toUserEntries(input: {
  users: CommunicationLoadState['users'];
  currentUserId: string | null;
  currentUser: {
    branch?: { type?: number | null; id?: string | null } | null;
    branchType?: number | null;
    branchId?: string | null;
    location?: { id?: string | null } | null;
  } | null;
  requestTargetIdSet: Set<string>;
}): UserChatEntry[] {
  const branchType = input.currentUser?.branch?.type ?? input.currentUser?.branchType ?? null;
  const isHeadOffice = branchType === 0;
  const currentBranchId = input.currentUser?.branch?.id ?? input.currentUser?.branchId ?? null;
  const currentLocationId = input.currentUser?.location?.id ?? null;
  return input.users
    .filter((user) => user.id !== input.currentUserId)
    .map((user) => {
      const sameBranch = Boolean(currentBranchId && user.branchId === currentBranchId);
      const sameLocation = Boolean(currentLocationId && user.locationId === currentLocationId);
      const canDirect = isHeadOffice
        ? true
        : currentLocationId
          ? sameBranch && sameLocation
          : sameBranch;
      return {
        id: user.id,
        fullname: user.fullname,
        roleName: user.roleName ?? null,
        branchName: user.branchName ?? null,
        locationName: user.locationName ?? null,
        thread: null,
        requiresRequest: !canDirect,
        canRequest: input.requestTargetIdSet.has(user.id),
      } satisfies UserChatEntry;
    })
    .sort((a, b) => a.fullname.localeCompare(b.fullname));
}

export function toChatEntries(input: {
  directThreadByUserId: Map<string, CommunicationLoadState['threads'][number]>;
  userById: Map<string, CommunicationLoadState['users'][number]>;
}): UserChatEntry[] {
  return [...input.directThreadByUserId.entries()]
    .map(([peerId, thread]) => {
      const user = input.userById.get(peerId);
      return {
        id: peerId,
        fullname: user?.fullname?.trim() || thread.title?.trim() || 'Unknown user',
        roleName: user?.roleName ?? null,
        branchName: user?.branchName ?? null,
        locationName: user?.locationName ?? null,
        thread,
        requiresRequest: false,
        canRequest: false,
      } satisfies UserChatEntry;
    })
    .sort((a, b) => {
      const aTime = a.thread?.lastMessageAt ? new Date(a.thread.lastMessageAt).getTime() : 0;
      const bTime = b.thread?.lastMessageAt ? new Date(b.thread.lastMessageAt).getTime() : 0;
      if (aTime !== bTime) return bTime - aTime;
      return a.fullname.localeCompare(b.fullname);
    });
}
