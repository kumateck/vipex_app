import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/config';
import { itSupportTicketEvents, itSupportTickets, uploads } from '@/db/schemas';
import type {
  ItSupportTicketAttachment,
  ItSupportTicketItem,
  ItSupportTicketsCreateInput,
  ItSupportTicketsListInput,
  ItSupportTicketsUpdateInput,
} from './dto';

const IT_SUPPORT_TICKET_UPLOAD_MODEL = 'it-support-ticket';

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

type TicketRow = {
  id: string;
  companyId: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  category: string;
  branchId: string | null;
  locationId: string | null;
  requesterUserId: string;
  assignedToUserId: string | null;
  resolvedAt: Date | null;
  closedAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

async function listAttachmentsByTicketIds(
  companyId: string,
  ticketIds: string[],
): Promise<Map<string, ItSupportTicketAttachment[]>> {
  const map = new Map<string, ItSupportTicketAttachment[]>();
  if (!ticketIds.length) return map;

  const rows = await db
    .select({
      id: uploads.id,
      modelId: uploads.modelId,
      fileName: uploads.fileName,
      contentType: uploads.contentType,
      fileUrl: uploads.fileUrl,
      sizeBytes: uploads.sizeBytes,
      createdAt: uploads.createdAt,
    })
    .from(uploads)
    .where(
      and(
        eq(uploads.companyId, companyId),
        eq(uploads.modelType, IT_SUPPORT_TICKET_UPLOAD_MODEL),
        eq(uploads.isDeleted, false),
        inArray(uploads.modelId, ticketIds),
      ),
    )
    .orderBy(desc(uploads.createdAt), desc(uploads.id));

  for (const row of rows) {
    const item: ItSupportTicketAttachment = {
      id: row.id,
      fileName: row.fileName,
      contentType: row.contentType,
      url: row.fileUrl,
      sizeBytes: Number(row.sizeBytes ?? 0),
      createdAt: toIso(row.createdAt),
    };
    const existing = map.get(row.modelId) ?? [];
    existing.push(item);
    map.set(row.modelId, existing);
  }

  return map;
}

function mapTicket(row: TicketRow, attachments: ItSupportTicketAttachment[]): ItSupportTicketItem {
  return {
    id: row.id,
    companyId: row.companyId,
    subject: row.subject,
    description: row.description,
    status: row.status,
    priority: row.priority,
    category: row.category,
    branchId: row.branchId,
    locationId: row.locationId,
    requesterUserId: row.requesterUserId,
    assignedToUserId: row.assignedToUserId,
    resolvedAt: toIso(row.resolvedAt),
    closedAt: toIso(row.closedAt),
    createdBy: row.createdBy,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    attachments,
  };
}

export async function listItSupportTicketsRepo(
  input: ItSupportTicketsListInput,
): Promise<ItSupportTicketItem[]> {
  const where = [
    eq(itSupportTickets.companyId, input.companyId),
    eq(itSupportTickets.isDeleted, false),
  ];
  if (input.status) where.push(eq(itSupportTickets.status, input.status));
  if (input.priority) where.push(eq(itSupportTickets.priority, input.priority));
  if (input.assignedToUserId)
    where.push(eq(itSupportTickets.assignedToUserId, input.assignedToUserId));

  const rows = await db
    .select({
      id: itSupportTickets.id,
      companyId: itSupportTickets.companyId,
      subject: itSupportTickets.subject,
      description: itSupportTickets.description,
      status: itSupportTickets.status,
      priority: itSupportTickets.priority,
      category: itSupportTickets.category,
      branchId: itSupportTickets.branchId,
      locationId: itSupportTickets.locationId,
      requesterUserId: itSupportTickets.requesterUserId,
      assignedToUserId: itSupportTickets.assignedToUserId,
      resolvedAt: itSupportTickets.resolvedAt,
      closedAt: itSupportTickets.closedAt,
      createdBy: itSupportTickets.createdBy,
      createdAt: itSupportTickets.createdAt,
      updatedAt: itSupportTickets.updatedAt,
    })
    .from(itSupportTickets)
    .where(and(...where))
    .orderBy(desc(itSupportTickets.createdAt), desc(itSupportTickets.id));

  const ticketIds = rows.map((row) => row.id);
  const attachmentsByTicketId = await listAttachmentsByTicketIds(input.companyId, ticketIds);

  return rows.map((row) => mapTicket(row, attachmentsByTicketId.get(row.id) ?? []));
}

export async function createItSupportTicketRepo(
  input: ItSupportTicketsCreateInput,
): Promise<ItSupportTicketItem> {
  const [created] = await db
    .insert(itSupportTickets)
    .values({
      companyId: input.companyId,
      subject: input.subject.trim(),
      description: input.description ?? null,
      status: 'open',
      priority: input.priority ?? 'medium',
      category: input.category ?? 'general',
      branchId: input.branchId ?? null,
      locationId: input.locationId ?? null,
      requesterUserId: input.userId,
      assignedToUserId: input.assignedToUserId ?? null,
      createdBy: input.userId,
    })
    .returning({
      id: itSupportTickets.id,
      companyId: itSupportTickets.companyId,
      subject: itSupportTickets.subject,
      description: itSupportTickets.description,
      status: itSupportTickets.status,
      priority: itSupportTickets.priority,
      category: itSupportTickets.category,
      branchId: itSupportTickets.branchId,
      locationId: itSupportTickets.locationId,
      requesterUserId: itSupportTickets.requesterUserId,
      assignedToUserId: itSupportTickets.assignedToUserId,
      resolvedAt: itSupportTickets.resolvedAt,
      closedAt: itSupportTickets.closedAt,
      createdBy: itSupportTickets.createdBy,
      createdAt: itSupportTickets.createdAt,
      updatedAt: itSupportTickets.updatedAt,
    });
  if (!created) throw new Error('Failed to create IT support ticket');

  await db.insert(itSupportTicketEvents).values({
    ticketId: created.id,
    eventType: 'ticket_created',
    eventNote: 'IT support ticket created',
    toStatus: created.status,
    performedBy: input.userId,
  });

  return mapTicket(created, []);
}

export async function getItSupportTicketRepo(input: {
  companyId: string;
  ticketId: string;
}): Promise<ItSupportTicketItem | null> {
  const [row] = await db
    .select({
      id: itSupportTickets.id,
      companyId: itSupportTickets.companyId,
      subject: itSupportTickets.subject,
      description: itSupportTickets.description,
      status: itSupportTickets.status,
      priority: itSupportTickets.priority,
      category: itSupportTickets.category,
      branchId: itSupportTickets.branchId,
      locationId: itSupportTickets.locationId,
      requesterUserId: itSupportTickets.requesterUserId,
      assignedToUserId: itSupportTickets.assignedToUserId,
      resolvedAt: itSupportTickets.resolvedAt,
      closedAt: itSupportTickets.closedAt,
      createdBy: itSupportTickets.createdBy,
      createdAt: itSupportTickets.createdAt,
      updatedAt: itSupportTickets.updatedAt,
    })
    .from(itSupportTickets)
    .where(
      and(
        eq(itSupportTickets.companyId, input.companyId),
        eq(itSupportTickets.id, input.ticketId),
        eq(itSupportTickets.isDeleted, false),
      ),
    )
    .limit(1);

  if (!row) return null;
  const attachmentsByTicketId = await listAttachmentsByTicketIds(input.companyId, [row.id]);
  return mapTicket(row, attachmentsByTicketId.get(row.id) ?? []);
}

export async function updateItSupportTicketRepo(
  input: ItSupportTicketsUpdateInput,
): Promise<ItSupportTicketItem | null> {
  const existing = await getItSupportTicketRepo({
    companyId: input.companyId,
    ticketId: input.ticketId,
  });
  if (!existing) return null;

  const nextStatus = input.status ?? existing.status;
  const [updated] = await db
    .update(itSupportTickets)
    .set({
      status: nextStatus,
      priority: input.priority ?? existing.priority,
      category: input.category ?? existing.category,
      assignedToUserId:
        typeof input.assignedToUserId === 'undefined'
          ? existing.assignedToUserId
          : (input.assignedToUserId ?? null),
      resolvedAt: nextStatus === 'resolved' ? new Date() : null,
      closedAt: nextStatus === 'closed' ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(itSupportTickets.companyId, input.companyId),
        eq(itSupportTickets.id, input.ticketId),
        eq(itSupportTickets.isDeleted, false),
      ),
    )
    .returning({
      id: itSupportTickets.id,
      companyId: itSupportTickets.companyId,
      subject: itSupportTickets.subject,
      description: itSupportTickets.description,
      status: itSupportTickets.status,
      priority: itSupportTickets.priority,
      category: itSupportTickets.category,
      branchId: itSupportTickets.branchId,
      locationId: itSupportTickets.locationId,
      requesterUserId: itSupportTickets.requesterUserId,
      assignedToUserId: itSupportTickets.assignedToUserId,
      resolvedAt: itSupportTickets.resolvedAt,
      closedAt: itSupportTickets.closedAt,
      createdBy: itSupportTickets.createdBy,
      createdAt: itSupportTickets.createdAt,
      updatedAt: itSupportTickets.updatedAt,
    });

  if (!updated) return null;

  await db.insert(itSupportTicketEvents).values({
    ticketId: updated.id,
    eventType: 'ticket_updated',
    eventNote: input.note ?? null,
    fromStatus: existing.status,
    toStatus: updated.status,
    performedBy: input.userId,
  });

  const attachmentsByTicketId = await listAttachmentsByTicketIds(input.companyId, [updated.id]);
  return mapTicket(updated, attachmentsByTicketId.get(updated.id) ?? []);
}

export const ItSupportTicketUploadModelType = IT_SUPPORT_TICKET_UPLOAD_MODEL;
