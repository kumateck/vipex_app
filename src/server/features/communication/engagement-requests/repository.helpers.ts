import { and, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { BranchType } from '@/db/schemas/enums';
import { branches, commEngagementRequests, users } from '@/db/schemas';
import type {
  CommunicationEngagementRequestsDecideInput,
  CommunicationEngagementRequestsItem,
} from './dto';

export type UserScopeRow = {
  userId: string;
  branchType: number;
  branchId: string;
  locationId: string | null;
};

export function canDirectChatByScope(input: { requester: UserScopeRow; target: UserScopeRow }) {
  if (input.requester.branchType === BranchType.HEADOFFICE) return true;
  if (input.requester.locationId) {
    return (
      input.target.branchId === input.requester.branchId &&
      input.target.locationId === input.requester.locationId
    );
  }
  return input.target.branchId === input.requester.branchId;
}

export function toItem(row: {
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
