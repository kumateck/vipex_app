import { and, desc, eq, inArray, isNull, or } from 'drizzle-orm';
import { db } from '@/db/config';
import { BranchType } from '@/db/schemas/enums';
import {
  branches,
  commEngagementRequests,
  commThreadParticipants,
  commThreads,
  locations,
  roles,
  users,
} from '@/db/schemas';
import type {
  CommunicationEngagementRequestsCreateInput,
  CommunicationEngagementRequestTargetItem,
  CommunicationEngagementRequestsItem,
  CommunicationEngagementRequestsListInput,
} from './dto';
import { canDirectChatByScope, getCommunicationUserScopeRepo, toItem } from './repository.helpers';

export async function listCommunicationEngagementRequestsRepo(
  input: CommunicationEngagementRequestsListInput,
): Promise<CommunicationEngagementRequestsItem[]> {
  const where = [eq(commEngagementRequests.companyId, input.companyId)];
  if (input.status) where.push(eq(commEngagementRequests.status, input.status));
  if (input.view === 'incoming') where.push(eq(commEngagementRequests.targetUserId, input.userId));
  else if (input.view === 'outgoing')
    where.push(eq(commEngagementRequests.requesterUserId, input.userId));
  else {
    where.push(
      or(
        eq(commEngagementRequests.requesterUserId, input.userId),
        eq(commEngagementRequests.targetUserId, input.userId),
      )!,
    );
  }

  const rows = await db
    .select({
      id: commEngagementRequests.id,
      companyId: commEngagementRequests.companyId,
      requesterUserId: commEngagementRequests.requesterUserId,
      targetUserId: commEngagementRequests.targetUserId,
      status: commEngagementRequests.status,
      reasonCode: commEngagementRequests.reasonCode,
      reasonNote: commEngagementRequests.reasonNote,
      linkedEntityType: commEngagementRequests.linkedEntityType,
      linkedEntityId: commEngagementRequests.linkedEntityId,
      scope: commEngagementRequests.scope,
      approvedBy: commEngagementRequests.approvedBy,
      approvedAt: commEngagementRequests.approvedAt,
      declinedBy: commEngagementRequests.declinedBy,
      declinedAt: commEngagementRequests.declinedAt,
      expiresAt: commEngagementRequests.expiresAt,
      createdAt: commEngagementRequests.createdAt,
      updatedAt: commEngagementRequests.updatedAt,
    })
    .from(commEngagementRequests)
    .where(and(...where))
    .orderBy(desc(commEngagementRequests.createdAt), desc(commEngagementRequests.id));

  if (!rows.length) return [];
  const userIds = [...new Set(rows.flatMap((row) => [row.requesterUserId, row.targetUserId]))];
  const relatedUsers = await db
    .select({
      id: users.id,
      fullname: users.fullname,
      roleName: roles.name,
      branchName: branches.name,
      locationName: locations.name,
    })
    .from(users)
    .leftJoin(roles, eq(roles.id, users.roleId))
    .leftJoin(branches, eq(branches.id, users.branchId))
    .leftJoin(locations, eq(locations.id, users.locationId))
    .where(inArray(users.id, userIds));
  const relatedById = new Map(relatedUsers.map((row) => [row.id, row]));

  return rows.map((row) => {
    const requester = relatedById.get(row.requesterUserId);
    const target = relatedById.get(row.targetUserId);
    return toItem({
      ...row,
      requesterFullname: requester?.fullname ?? null,
      requesterRoleName: requester?.roleName ?? null,
      requesterBranchName: requester?.branchName ?? null,
      requesterLocationName: requester?.locationName ?? null,
      targetFullname: target?.fullname ?? null,
      targetRoleName: target?.roleName ?? null,
      targetBranchName: target?.branchName ?? null,
      targetLocationName: target?.locationName ?? null,
    });
  });
}

export async function createCommunicationEngagementRequestsRepo(
  input: CommunicationEngagementRequestsCreateInput,
): Promise<CommunicationEngagementRequestsItem> {
  const [created] = await db
    .insert(commEngagementRequests)
    .values({
      companyId: input.companyId,
      requesterUserId: input.requesterUserId,
      targetUserId: input.targetUserId,
      reasonCode: input.reasonCode ?? null,
      reasonNote: input.reasonNote ?? null,
      linkedEntityType: input.linkedEntityType ?? null,
      linkedEntityId: input.linkedEntityId ?? null,
      scope: input.scope ?? 'temporary',
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    })
    .returning({
      id: commEngagementRequests.id,
      companyId: commEngagementRequests.companyId,
      requesterUserId: commEngagementRequests.requesterUserId,
      targetUserId: commEngagementRequests.targetUserId,
      status: commEngagementRequests.status,
      reasonCode: commEngagementRequests.reasonCode,
      reasonNote: commEngagementRequests.reasonNote,
      linkedEntityType: commEngagementRequests.linkedEntityType,
      linkedEntityId: commEngagementRequests.linkedEntityId,
      scope: commEngagementRequests.scope,
      approvedBy: commEngagementRequests.approvedBy,
      approvedAt: commEngagementRequests.approvedAt,
      declinedBy: commEngagementRequests.declinedBy,
      declinedAt: commEngagementRequests.declinedAt,
      expiresAt: commEngagementRequests.expiresAt,
      createdAt: commEngagementRequests.createdAt,
      updatedAt: commEngagementRequests.updatedAt,
    });
  if (!created) throw new Error('Failed to create engagement request');
  return toItem(created);
}

export async function listCommunicationEngagementRequestTargetsRepo(input: {
  companyId: string;
  requesterUserId: string;
}): Promise<CommunicationEngagementRequestTargetItem[]> {
  const requesterScope = await getCommunicationUserScopeRepo({
    companyId: input.companyId,
    userId: input.requesterUserId,
  });
  if (!requesterScope || requesterScope.branchType === BranchType.HEADOFFICE) return [];

  const candidates = await db
    .select({
      id: users.id,
      fullname: users.fullname,
      branchId: users.branchId,
      roleName: roles.name,
      branchName: branches.name,
      locationName: locations.name,
      branchType: branches.type,
      locationId: users.locationId,
    })
    .from(users)
    .innerJoin(branches, eq(branches.id, users.branchId))
    .leftJoin(roles, eq(roles.id, users.roleId))
    .leftJoin(locations, eq(locations.id, users.locationId))
    .where(eq(users.companyId, input.companyId));

  const directPeerRows = await db
    .select({ threadId: commThreadParticipants.threadId, userId: commThreadParticipants.userId })
    .from(commThreadParticipants)
    .innerJoin(commThreads, eq(commThreads.id, commThreadParticipants.threadId))
    .where(
      and(
        eq(commThreads.companyId, input.companyId),
        eq(commThreads.threadType, 'direct'),
        eq(commThreads.isDeleted, false),
        eq(commThreadParticipants.isDeleted, false),
        isNull(commThreadParticipants.leftAt),
      ),
    );

  const participantsByThread = new Map<string, Set<string>>();
  for (const row of directPeerRows) {
    const bucket = participantsByThread.get(row.threadId) ?? new Set<string>();
    bucket.add(row.userId);
    participantsByThread.set(row.threadId, bucket);
  }
  const existingDirectPeerIds = new Set<string>();
  for (const participants of participantsByThread.values()) {
    if (!participants.has(input.requesterUserId)) continue;
    for (const userId of participants)
      if (userId !== input.requesterUserId) existingDirectPeerIds.add(userId);
  }

  return candidates
    .filter((row) => row.id !== input.requesterUserId)
    .filter((row) => !existingDirectPeerIds.has(row.id))
    .filter(
      (row) =>
        !canDirectChatByScope({
          requester: requesterScope,
          target: {
            userId: row.id,
            branchType: row.branchType,
            branchId: row.branchId,
            locationId: row.locationId,
          },
        }),
    )
    .map((row) => ({
      id: row.id,
      fullname: row.fullname,
      roleName: row.roleName ?? null,
      branchName: row.branchName ?? null,
      locationName: row.locationName ?? null,
    }))
    .sort((a, b) => a.fullname.localeCompare(b.fullname));
}

export {
  decideCommunicationEngagementRequestRepo,
  getCommunicationUserScopeRepo,
  getPendingEngagementRequestForDecisionRepo,
  hasApprovedEngagementAccessRepo,
  hasPendingEngagementRequestRepo,
  requiresRequestForDirectThreadRepo,
} from './repository.helpers';
