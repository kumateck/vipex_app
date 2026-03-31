import { BadRequest, Forbidden, NotFound } from '@/server/utils/http-error';
import { createUploadSvc } from '@/server/features/uploads/service';
import type {
  ItSupportTicketEventItem,
  ItSupportTicketItem,
  ItSupportTicketNoteCreateInput,
  ItSupportTicketsCreateInput,
  ItSupportTicketsListInput,
  ItSupportTicketsUpdateInput,
} from './dto';
import {
  createItSupportTicketRepo,
  getItSupportTicketRepo,
  ItSupportTicketUploadModelType,
  listItSupportTicketEventsRepo,
  listItSupportTicketsRepo,
  createItSupportTicketNoteRepo,
  updateItSupportTicketRepo,
} from './repository';

const ALLOWED_STATUSES = new Set(['open', 'in_progress', 'pending_user', 'resolved', 'closed']);
const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high', 'urgent']);

function normalizeNullableString(value?: string | null) {
  if (value == null) return null;
  const normalized = value.trim();
  return normalized.length ? normalized : null;
}

export async function listItSupportTicketsSvc(
  input: ItSupportTicketsListInput,
): Promise<ItSupportTicketItem[]> {
  return listItSupportTicketsRepo(input);
}

export async function createItSupportTicketSvc(
  input: ItSupportTicketsCreateInput,
): Promise<ItSupportTicketItem> {
  const subject = input.subject.trim();
  if (!subject) throw BadRequest('Subject is required');

  const priority = normalizeNullableString(input.priority)?.toLowerCase() ?? 'medium';
  if (!ALLOWED_PRIORITIES.has(priority)) {
    throw BadRequest(`Invalid priority: ${priority}`);
  }

  const created = await createItSupportTicketRepo({
    ...input,
    subject,
    priority,
    category: normalizeNullableString(input.category)?.toLowerCase() ?? 'general',
    description: normalizeNullableString(input.description),
    branchId: normalizeNullableString(input.branchId),
    locationId: normalizeNullableString(input.locationId),
    assignedToUserId: normalizeNullableString(input.assignedToUserId),
  });

  const attachments = input.attachments ?? [];
  for (const attachment of attachments) {
    await createUploadSvc({
      companyId: input.companyId,
      uploadedBy: input.userId,
      modelType: ItSupportTicketUploadModelType,
      modelId: created.id,
      fileName: attachment.fileName,
      dataUrl: attachment.dataUrl,
    });
  }

  const reloaded = await getItSupportTicketRepo({
    companyId: input.companyId,
    ticketId: created.id,
  });
  if (!reloaded) throw NotFound('IT support ticket not found after create');
  return reloaded;
}

export async function updateItSupportTicketSvc(
  input: ItSupportTicketsUpdateInput,
): Promise<ItSupportTicketItem> {
  const status = normalizeNullableString(input.status)?.toLowerCase() ?? null;
  if (status && !ALLOWED_STATUSES.has(status)) {
    throw BadRequest(`Invalid status: ${status}`);
  }
  const priority = normalizeNullableString(input.priority)?.toLowerCase() ?? null;
  if (priority && !ALLOWED_PRIORITIES.has(priority)) {
    throw BadRequest(`Invalid priority: ${priority}`);
  }

  const updated = await updateItSupportTicketRepo({
    ...input,
    status,
    priority,
    category: normalizeNullableString(input.category)?.toLowerCase() ?? null,
    assignedToUserId:
      typeof input.assignedToUserId === 'undefined'
        ? undefined
        : normalizeNullableString(input.assignedToUserId),
    note: normalizeNullableString(input.note),
  });
  if (!updated) throw NotFound('IT support ticket not found');
  return updated;
}

export async function getItSupportTicketSvc(input: {
  companyId: string;
  ticketId: string;
}): Promise<ItSupportTicketItem> {
  const ticket = await getItSupportTicketRepo(input);
  if (!ticket) throw NotFound('IT support ticket not found');
  return ticket;
}

export async function listItSupportTicketEventsSvc(input: {
  companyId: string;
  ticketId: string;
}): Promise<ItSupportTicketEventItem[]> {
  const ticket = await getItSupportTicketRepo(input);
  if (!ticket) throw NotFound('IT support ticket not found');
  return listItSupportTicketEventsRepo(input);
}

export async function createItSupportTicketNoteSvc(
  input: ItSupportTicketNoteCreateInput,
): Promise<ItSupportTicketEventItem> {
  const note = normalizeNullableString(input.note);
  if (!note) throw BadRequest('Note is required');
  const ticket = await getItSupportTicketRepo({
    companyId: input.companyId,
    ticketId: input.ticketId,
  });
  if (!ticket) throw NotFound('IT support ticket not found');
  if (!input.canManageTickets && ticket.assignedToUserId !== input.userId) {
    throw Forbidden('Only assigned personnel can add comments to this ticket');
  }
  return createItSupportTicketNoteRepo({ ...input, note });
}
