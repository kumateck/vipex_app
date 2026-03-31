import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginatedResponseDto, PaginationRequestDto } from '@/server/types/pagination.types';
import {
  approveNotificationCampaignSvc,
  createNotificationCampaignSvc,
  createNotificationProviderSvc,
  createNotificationTemplateSvc,
  listCampaignDispatchSummarySvc,
  listNotificationCampaignsSvc,
  listNotificationDispatchesSvc,
  listNotificationProvidersSvc,
  listNotificationTemplateOptionsSvc,
  listNotificationTemplatesSvc,
  rejectNotificationCampaignSvc,
  retryNotificationDispatchSvc,
  sendNotificationCampaignSvc,
  sendParcelStatusNotificationSvc,
  setDefaultNotificationProviderSvc,
  submitNotificationCampaignSvc,
  updateNotificationProviderSvc,
  updateNotificationTemplateSvc,
} from './service';

function toIsoDate(value: Date | null) {
  return value ? value.toISOString() : null;
}

export async function listNotificationProvidersCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    search?: string;
    channel?: string;
    isActive?: boolean;
  }>,
): Promise<
  PaginatedResponseDto<{
    id: string;
    channel: string;
    providerKey: string;
    name: string;
    configJson: unknown;
    isActive: boolean;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
  }>
> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listNotificationProvidersSvc({
    companyId: q.filters!.companyId,
    limit: pagination.pageSize,
    offset: pagination.offset,
    search: q.filters?.search ?? null,
    channel: q.filters?.channel ?? null,
    isActive: q.filters?.isActive ?? null,
  });

  return {
    data: data.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function createNotificationProviderCtrl(input: {
  companyId: string;
  createdBy: string;
  channel: string;
  providerKey: string;
  name: string;
  configJson?: unknown;
  isActive?: boolean;
  isDefault?: boolean;
}) {
  return createNotificationProviderSvc(input);
}

export async function updateNotificationProviderCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  patch: {
    name?: string;
    configJson?: unknown;
    isActive?: boolean;
    isDefault?: boolean;
  };
}) {
  return updateNotificationProviderSvc(input);
}

export async function setDefaultNotificationProviderCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
}) {
  return setDefaultNotificationProviderSvc(input);
}

export async function listNotificationTemplatesCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    search?: string;
    channel?: string;
    isActive?: boolean;
  }>,
): Promise<
  PaginatedResponseDto<{
    id: string;
    channel: string;
    code: string;
    name: string;
    subject: string | null;
    body: string;
    variablesJson: unknown;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>
> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listNotificationTemplatesSvc({
    companyId: q.filters!.companyId,
    limit: pagination.pageSize,
    offset: pagination.offset,
    search: q.filters?.search ?? null,
    channel: q.filters?.channel ?? null,
    isActive: q.filters?.isActive ?? null,
  });

  return {
    data: data.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function listNotificationTemplateOptionsCtrl(input: {
  companyId: string;
  channel?: string;
}) {
  return listNotificationTemplateOptionsSvc(input);
}

export async function createNotificationTemplateCtrl(input: {
  companyId: string;
  createdBy: string;
  channel: string;
  code: string;
  name: string;
  subject?: string | null;
  body: string;
  variablesJson?: unknown;
  isActive?: boolean;
}) {
  return createNotificationTemplateSvc(input);
}

export async function updateNotificationTemplateCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  patch: {
    name?: string;
    subject?: string | null;
    body?: string;
    variablesJson?: unknown;
    isActive?: boolean;
  };
}) {
  return updateNotificationTemplateSvc(input);
}

export async function listNotificationCampaignsCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    search?: string;
    channel?: string;
    status?: number;
    pendingOnly?: boolean;
  }>,
): Promise<
  PaginatedResponseDto<{
    id: string;
    name: string;
    eventCode: string | null;
    channel: string;
    templateId: string | null;
    templateName: string | null;
    subjectOverride: string | null;
    bodyOverride: string | null;
    audienceType: string;
    status: number;
    scheduledAt: string | null;
    submittedBy: string | null;
    submittedAt: string | null;
    approvedBy: string | null;
    approvedAt: string | null;
    rejectedBy: string | null;
    rejectedAt: string | null;
    approvalNote: string | null;
    sentBy: string | null;
    sentAt: string | null;
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
  }>
> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listNotificationCampaignsSvc({
    companyId: q.filters!.companyId,
    limit: pagination.pageSize,
    offset: pagination.offset,
    search: q.filters?.search ?? null,
    channel: q.filters?.channel ?? null,
    status: q.filters?.status ?? null,
    pendingOnly: q.filters?.pendingOnly ?? null,
  });

  return {
    data: data.map((row) => ({
      ...row,
      scheduledAt: toIsoDate(row.scheduledAt),
      submittedAt: toIsoDate(row.submittedAt),
      approvedAt: toIsoDate(row.approvedAt),
      rejectedAt: toIsoDate(row.rejectedAt),
      sentAt: toIsoDate(row.sentAt),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function createNotificationCampaignCtrl(input: {
  companyId: string;
  createdBy: string;
  name: string;
  eventCode?: string | null;
  channel: string;
  templateId?: string | null;
  subjectOverride?: string | null;
  bodyOverride?: string | null;
  audienceType: string;
  scheduledAt?: string | null;
}) {
  return createNotificationCampaignSvc({
    ...input,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
  });
}

export async function submitNotificationCampaignCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
}) {
  return submitNotificationCampaignSvc(input);
}

export async function approveNotificationCampaignCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  note?: string | null;
}) {
  return approveNotificationCampaignSvc(input);
}

export async function rejectNotificationCampaignCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  note: string;
}) {
  return rejectNotificationCampaignSvc(input);
}

export async function sendNotificationCampaignCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
}) {
  return sendNotificationCampaignSvc(input);
}

export async function listNotificationDispatchesCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    search?: string;
    channel?: string;
    status?: string;
    campaignId?: string;
  }>,
): Promise<
  PaginatedResponseDto<{
    id: string;
    campaignId: string | null;
    campaignName: string | null;
    channel: string;
    providerId: string | null;
    providerKey: string | null;
    recipientType: string;
    recipientId: string | null;
    recipientName: string | null;
    recipientAddress: string;
    subject: string | null;
    body: string;
    status: string;
    attemptCount: number;
    providerMessageId: string | null;
    errorMessage: string | null;
    metadataJson: unknown;
    createdAt: string;
    updatedAt: string;
  }>
> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listNotificationDispatchesSvc({
    companyId: q.filters!.companyId,
    limit: pagination.pageSize,
    offset: pagination.offset,
    search: q.filters?.search ?? null,
    channel: q.filters?.channel ?? null,
    status: q.filters?.status ?? null,
    campaignId: q.filters?.campaignId ?? null,
  });

  return {
    data: data.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function retryNotificationDispatchCtrl(input: {
  id: string;
  companyId: string;
  actorUserId: string;
}) {
  return retryNotificationDispatchSvc(input);
}

export async function sendParcelStatusNotificationCtrl(input: {
  companyId: string;
  actorUserId: string;
  parcelId: string;
  outcome: string;
  sendSms?: boolean;
  sendEmail?: boolean;
  includeSecondReceiver?: boolean;
}) {
  return sendParcelStatusNotificationSvc(input);
}

export async function listCampaignDispatchSummaryCtrl(input: {
  companyId: string;
  campaignId: string;
}) {
  return listCampaignDispatchSummarySvc(input);
}
