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
  CommunicationEngagementRequestsDecideInput,
  CommunicationEngagementRequestTargetItem,
  CommunicationEngagementRequestsItem,
  CommunicationEngagementRequestsListInput,
} from './dto';

type UserScopeRow = {
  userId: string;
  branchType: number;
  branchId: string;
  locationId: string | null;
};

function canDirectChatByScope(input: { requester: UserScopeRow; target: UserScopeRow }) {
  if (input.requester.branchType === BranchType.HEADOFFICE) return true;
  if (input.requester.locationId) {
    return (
      input.target.branchId === input.requester.branchId &&
      input.target.locationId === input.requester.locationId
    );
  }
  return input.target.branchId === input.requester.branchId;
}

function toItem(row: {
  id: string;
  companyId: string;
  requesterUserId: string;
  targetUserId: string;
  status: string;
  reasonCode: string | null;
  reasonNote: string | null;
  linkedEntityType: string | null;
  linkedEntityId: string | null;
  scope: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  declinedBy: string | null;
  declinedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  requesterFullname?: string | null;
  requesterRoleName?: string | null;
  requesterBranchName?: string | null;
  requesterLocationName?: string | null;
  targetFullname?: string | null;
  targetRoleName?: string | null;
  targetBranchName?: string | null;
  targetLocationName?: string | null;
}): CommunicationEngagementRequestsItem {
  return {
    ...row,
    approvedAt: row.approvedAt ? row.approvedAt.toISOString() : null,
    declinedAt: row.declinedAt ? row.declinedAt.toISOString() : null,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  };
}

export async function listCommunicationEngagementRequestsRepo(
  input: CommunicationEngagementRequestsListInput,
): Promise<CommunicationEngagementRequestsItem[]> {
  const where = [eq(commEngagementRequests.companyId, input.companyId)];
  if (input.status) {
    where.push(eq(commEngagementRequests.status, input.status));
  }
  if (input.view === 'incoming') {
    where.push(eq(commEngagementRequests.targetUserId, input.userId));
  } else if (input.view === 'outgoing') {
    where.push(eq(commEngagementRequests.requesterUserId, input.userId));
  } else {
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

export async function getCommunicationUserScopeRepo(input: {
  companyId: string;
  userId: string;
}): Promise<UserScopeRow | null> {
  const [row] = await db
    .select({
      userId: users.id,
      branchType: branches.type,
      branchId: users.branchId,
      locationId: users.locationId,
    })
    .from(users)
    .innerJoin(branches, eq(branches.id, users.branchId))
    .where(and(eq(users.companyId, input.companyId), eq(users.id, input.userId)))
    .limit(1);

  if (!row) return null;
  return {
    userId: row.userId,
    branchType: row.branchType,
    branchId: row.branchId,
    locationId: row.locationId,
  };
}

export async function listCommunicationEngagementRequestTargetsRepo(input: {
  companyId: string;
  requesterUserId: string;
}): Promise<CommunicationEngagementRequestTargetItem[]> {
  const requesterScope = await getCommunicationUserScopeRepo({
    companyId: input.companyId,
    userId: input.requesterUserId,
  });
  if (!requesterScope) return [];
  if (requesterScope.branchType === BranchType.HEADOFFICE) return [];

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
    .select({
      threadId: commThreadParticipants.threadId,
      userId: commThreadParticipants.userId,
    })
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
    for (const userId of participants) {
      if (userId !== input.requesterUserId) existingDirectPeerIds.add(userId);
    }
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

export async function hasApprovedEngagementAccessRepo(input: {
  companyId: string;
  requesterUserId: string;
  targetUserId: string;
}): Promise<boolean> {
  const rows = await db
    .select({ expiresAt: commEngagementRequests.expiresAt })
    .from(commEngagementRequests)
    .where(
      and(
        eq(commEngagementRequests.companyId, input.companyId),
        eq(commEngagementRequests.requesterUserId, input.requesterUserId),
        eq(commEngagementRequests.targetUserId, input.targetUserId),
        eq(commEngagementRequests.status, 'approved'),
      ),
    );

  if (!rows.length) return false;
  const nowMs = Date.now();
  return rows.some((row) => !row.expiresAt || row.expiresAt.getTime() >= nowMs);
}

export async function hasPendingEngagementRequestRepo(input: {
  companyId: string;
  requesterUserId: string;
  targetUserId: string;
}) {
  const [row] = await db
    .select({ id: commEngagementRequests.id })
    .from(commEngagementRequests)
    .where(
      and(
        eq(commEngagementRequests.companyId, input.companyId),
        eq(commEngagementRequests.requesterUserId, input.requesterUserId),
        eq(commEngagementRequests.targetUserId, input.targetUserId),
        eq(commEngagementRequests.status, 'pending'),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function getPendingEngagementRequestForDecisionRepo(input: {
  id: string;
  companyId: string;
}) {
  const [row] = await db
    .select({
      id: commEngagementRequests.id,
      requesterUserId: commEngagementRequests.requesterUserId,
      targetUserId: commEngagementRequests.targetUserId,
      status: commEngagementRequests.status,
    })
    .from(commEngagementRequests)
    .where(
      and(
        eq(commEngagementRequests.id, input.id),
        eq(commEngagementRequests.companyId, input.companyId),
        eq(commEngagementRequests.status, 'pending'),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function requiresRequestForDirectThreadRepo(input: {
  companyId: string;
  requesterUserId: string;
  targetUserId: string;
}): Promise<boolean> {
  const requester = await getCommunicationUserScopeRepo({
    companyId: input.companyId,
    userId: input.requesterUserId,
  });
  const target = await getCommunicationUserScopeRepo({
    companyId: input.companyId,
    userId: input.targetUserId,
  });
  if (!requester || !target) return false;
  return !canDirectChatByScope({ requester, target });
}

export async function decideCommunicationEngagementRequestRepo(
  input: CommunicationEngagementRequestsDecideInput,
): Promise<CommunicationEngagementRequestsItem> {
  const now = new Date();
  const [updated] = await db
    .update(commEngagementRequests)
    .set(
      input.approve
        ? {
            status: 'approved',
            approvedBy: input.actingUserId,
            approvedAt: now,
            updatedAt: now,
          }
        : {
            status: 'declined',
            declinedBy: input.actingUserId,
            declinedAt: now,
            updatedAt: now,
          },
    )
    .where(
      and(
        eq(commEngagementRequests.id, input.id),
        eq(commEngagementRequests.companyId, input.companyId),
        eq(commEngagementRequests.status, 'pending'),
      ),
    )
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
  if (!updated) throw new Error('Failed to update engagement request');
  return toItem(updated);
}
