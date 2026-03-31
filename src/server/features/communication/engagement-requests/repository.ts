import { and, desc, eq, or } from 'drizzle-orm';
import { db } from '@/db/config';
import { commEngagementRequests } from '@/db/schemas';
import type {
  CommunicationEngagementRequestsCreateInput,
  CommunicationEngagementRequestsDecideInput,
  CommunicationEngagementRequestsItem,
  CommunicationEngagementRequestsListInput,
} from './dto';

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

  return rows.map(toItem);
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

export async function getPendingEngagementRequestForDecisionRepo(input: {
  id: string;
  companyId: string;
}) {
  const [row] = await db
    .select({
      id: commEngagementRequests.id,
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
