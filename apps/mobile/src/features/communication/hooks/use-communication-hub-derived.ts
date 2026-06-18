import { useEffect, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  toActiveCallByChannelId,
  toChatEntries,
  toUserEntries,
} from './use-communication-hub-helpers';
import {
  buildCurrentUserTypingIdentitySet,
  buildDirectThreadByUserId,
  dedupeMobileUserOptions,
  dedupeRequestTargets,
} from '@mobile/features/communication/utils/hub-dedupe';
import type { CommunicationLoadState, UserChatEntry } from '../types';

export function useCommunicationHubDerived({
  data,
  currentUser,
  currentUserId,
  selectedRequestTargetId,
  setSelectedRequestTargetId,
}: {
  data: CommunicationLoadState;
  currentUser: {
    branch?: { type?: number | null; id?: string | null } | null;
    branchType?: number | null;
    branchId?: string | null;
    location?: { id?: string | null } | null;
    email?: string | null;
    fullname?: string | null;
  } | null;
  currentUserId: string | null;
  selectedRequestTargetId: string | null;
  setSelectedRequestTargetId: Dispatch<SetStateAction<string | null>>;
}) {
  const dedupedUsers = useMemo(() => dedupeMobileUserOptions(data.users), [data.users]);
  const dedupedRequestTargets = useMemo(
    () => dedupeRequestTargets(data.requestTargets),
    [data.requestTargets],
  );

  const currentUserTypingIdentitySet = useMemo(() => {
    return buildCurrentUserTypingIdentitySet({
      currentUserId,
      currentUserEmail: currentUser?.email ?? null,
      currentUserFullname: currentUser?.fullname ?? null,
      users: dedupedUsers,
    });
  }, [currentUser?.email, currentUser?.fullname, currentUserId, dedupedUsers]);

  const directThreads = useMemo(
    () => data.threads.filter((thread) => thread.threadType === 'direct'),
    [data.threads],
  );
  const groupThreads = useMemo(
    () => data.threads.filter((thread) => thread.threadType === 'group'),
    [data.threads],
  );
  const userById = useMemo(
    () => new Map(dedupedUsers.map((user) => [user.id, user])),
    [dedupedUsers],
  );
  const directThreadByUserId = useMemo(
    () => buildDirectThreadByUserId(directThreads),
    [directThreads],
  );
  const requestTargetIdSet = useMemo(
    () => new Set(dedupedRequestTargets.map((target) => target.id)),
    [dedupedRequestTargets],
  );
  const activeCallByChannelId = useMemo(
    () => toActiveCallByChannelId(data.activeCalls),
    [data.activeCalls],
  );

  const userEntries = useMemo<UserChatEntry[]>(
    () =>
      toUserEntries({
        users: dedupedUsers,
        currentUserId,
        currentUser: currentUser ?? null,
        requestTargetIdSet,
      }),
    [currentUser, currentUserId, dedupedUsers, requestTargetIdSet],
  );

  const chatEntries = useMemo<UserChatEntry[]>(
    () => toChatEntries({ directThreadByUserId, userById }),
    [directThreadByUserId, userById],
  );

  const usersWithoutThread = useMemo(
    () => userEntries.filter((entry) => !directThreadByUserId.has(entry.id)),
    [directThreadByUserId, userEntries],
  );

  const requestableUsers = useMemo(
    () => usersWithoutThread.filter((entry) => entry.requiresRequest && entry.canRequest),
    [usersWithoutThread],
  );

  useEffect(() => {
    if (!selectedRequestTargetId) return;
    const exists = requestableUsers.some((entry) => entry.id === selectedRequestTargetId);
    if (!exists) setSelectedRequestTargetId(null);
  }, [requestableUsers, selectedRequestTargetId, setSelectedRequestTargetId]);

  return {
    dedupedUsers,
    dedupedRequestTargets,
    currentUserTypingIdentitySet,
    directThreads,
    groupThreads,
    directThreadByUserId,
    activeCallByChannelId,
    userEntries,
    chatEntries,
    usersWithoutThread,
    requestableUsers,
  };
}
