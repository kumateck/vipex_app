import { and, count, desc, eq, ilike, isNotNull, ne, or, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  branches,
  customers,
  employees,
  locations,
  notificationCampaigns,
  notificationDispatches,
  NotificationCampaignStatus,
  notificationProviders,
  notificationTemplates,
  parcels,
  users,
} from '@/db/schemas';

export type ListNotificationProvidersParams = {
  companyId: string;
  limit: number;
  offset: number;
  search?: string | null;
  channel?: string | null;
  isActive?: boolean | null;
};

export async function listNotificationProvidersRepo(params: ListNotificationProvidersParams) {
  const where = [eq(notificationProviders.companyId, params.companyId)];
  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    where.push(
      or(
        ilike(notificationProviders.name, q),
        ilike(notificationProviders.providerKey, q),
        ilike(notificationProviders.channel, q),
      )!,
    );
  }
  if (params.channel?.trim()) {
    where.push(eq(notificationProviders.channel, params.channel.trim().toLowerCase()));
  }
  if (typeof params.isActive === 'boolean') {
    where.push(eq(notificationProviders.isActive, params.isActive));
  }

  const [countRow] = await db
    .select({ c: count() })
    .from(notificationProviders)
    .where(and(...where));

  const rows = await db
    .select({
      id: notificationProviders.id,
      channel: notificationProviders.channel,
      providerKey: notificationProviders.providerKey,
      name: notificationProviders.name,
      configJson: notificationProviders.configJson,
      isActive: notificationProviders.isActive,
      isDefault: notificationProviders.isDefault,
      createdAt: notificationProviders.createdAt,
      updatedAt: notificationProviders.updatedAt,
    })
    .from(notificationProviders)
    .where(and(...where))
    .orderBy(desc(notificationProviders.isDefault), desc(notificationProviders.createdAt))
    .limit(params.limit)
    .offset(params.offset);

  return {
    data: rows,
    totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
  };
}

export async function createNotificationProviderRepo(
  values: typeof notificationProviders.$inferInsert,
) {
  const [row] = await db.insert(notificationProviders).values(values).returning({
    id: notificationProviders.id,
  });
  return row ?? null;
}

export async function updateNotificationProviderRepo(
  id: string,
  companyId: string,
  patch: Partial<typeof notificationProviders.$inferInsert>,
) {
  const [row] = await db
    .update(notificationProviders)
    .set(patch)
    .where(and(eq(notificationProviders.id, id), eq(notificationProviders.companyId, companyId)))
    .returning({ id: notificationProviders.id });

  return row ?? null;
}

export async function clearDefaultProviderByChannelRepo(companyId: string, channel: string) {
  await db
    .update(notificationProviders)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(
      and(
        eq(notificationProviders.companyId, companyId),
        eq(notificationProviders.channel, channel.toLowerCase()),
        eq(notificationProviders.isDefault, true),
      ),
    );
}

export async function getNotificationProviderByIdRepo(id: string, companyId: string) {
  const [row] = await db
    .select()
    .from(notificationProviders)
    .where(and(eq(notificationProviders.id, id), eq(notificationProviders.companyId, companyId)))
    .limit(1);

  return row ?? null;
}

export async function getDefaultProviderByChannelRepo(companyId: string, channel: string) {
  const [row] = await db
    .select({
      id: notificationProviders.id,
      channel: notificationProviders.channel,
      providerKey: notificationProviders.providerKey,
      name: notificationProviders.name,
      configJson: notificationProviders.configJson,
      isActive: notificationProviders.isActive,
      isDefault: notificationProviders.isDefault,
    })
    .from(notificationProviders)
    .where(
      and(
        eq(notificationProviders.companyId, companyId),
        eq(notificationProviders.channel, channel.toLowerCase()),
        eq(notificationProviders.isDefault, true),
        eq(notificationProviders.isActive, true),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function getNotificationTemplateByCodeRepo(
  companyId: string,
  channel: string,
  code: string,
) {
  const [row] = await db
    .select({
      id: notificationTemplates.id,
      channel: notificationTemplates.channel,
      code: notificationTemplates.code,
      subject: notificationTemplates.subject,
      body: notificationTemplates.body,
    })
    .from(notificationTemplates)
    .where(
      and(
        eq(notificationTemplates.companyId, companyId),
        eq(notificationTemplates.channel, channel.toLowerCase()),
        sql`lower(${notificationTemplates.code}) = ${code.toLowerCase()}`,
        eq(notificationTemplates.isActive, true),
      ),
    )
    .limit(1);

  return row ?? null;
}

export type ListNotificationTemplatesParams = {
  companyId: string;
  limit: number;
  offset: number;
  search?: string | null;
  channel?: string | null;
  isActive?: boolean | null;
};

export async function listNotificationTemplatesRepo(params: ListNotificationTemplatesParams) {
  const where = [eq(notificationTemplates.companyId, params.companyId)];
  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    where.push(
      or(
        ilike(notificationTemplates.name, q),
        ilike(notificationTemplates.code, q),
        ilike(notificationTemplates.body, q),
      )!,
    );
  }
  if (params.channel?.trim()) {
    where.push(eq(notificationTemplates.channel, params.channel.trim().toLowerCase()));
  }
  if (typeof params.isActive === 'boolean') {
    where.push(eq(notificationTemplates.isActive, params.isActive));
  }

  const [countRow] = await db
    .select({ c: count() })
    .from(notificationTemplates)
    .where(and(...where));

  const rows = await db
    .select({
      id: notificationTemplates.id,
      channel: notificationTemplates.channel,
      code: notificationTemplates.code,
      name: notificationTemplates.name,
      subject: notificationTemplates.subject,
      body: notificationTemplates.body,
      variablesJson: notificationTemplates.variablesJson,
      isActive: notificationTemplates.isActive,
      createdAt: notificationTemplates.createdAt,
      updatedAt: notificationTemplates.updatedAt,
    })
    .from(notificationTemplates)
    .where(and(...where))
    .orderBy(desc(notificationTemplates.createdAt), desc(notificationTemplates.id))
    .limit(params.limit)
    .offset(params.offset);

  return {
    data: rows,
    totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
  };
}

export async function createNotificationTemplateRepo(
  values: typeof notificationTemplates.$inferInsert,
) {
  const [row] = await db.insert(notificationTemplates).values(values).returning({
    id: notificationTemplates.id,
  });

  return row ?? null;
}

export async function updateNotificationTemplateRepo(
  id: string,
  companyId: string,
  patch: Partial<typeof notificationTemplates.$inferInsert>,
) {
  const [row] = await db
    .update(notificationTemplates)
    .set(patch)
    .where(and(eq(notificationTemplates.id, id), eq(notificationTemplates.companyId, companyId)))
    .returning({ id: notificationTemplates.id });

  return row ?? null;
}

export async function getNotificationTemplateByIdRepo(id: string, companyId: string) {
  const [row] = await db
    .select()
    .from(notificationTemplates)
    .where(and(eq(notificationTemplates.id, id), eq(notificationTemplates.companyId, companyId)))
    .limit(1);

  return row ?? null;
}

export type ListNotificationCampaignsParams = {
  companyId: string;
  limit: number;
  offset: number;
  search?: string | null;
  channel?: string | null;
  status?: number | null;
  pendingOnly?: boolean | null;
};

export async function listNotificationCampaignsRepo(params: ListNotificationCampaignsParams) {
  const where = [eq(notificationCampaigns.companyId, params.companyId)];
  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    where.push(
      or(
        ilike(notificationCampaigns.name, q),
        ilike(notificationCampaigns.eventCode, q),
        ilike(notificationCampaigns.audienceType, q),
      )!,
    );
  }
  if (params.channel?.trim()) {
    where.push(eq(notificationCampaigns.channel, params.channel.trim().toLowerCase()));
  }
  if (typeof params.status === 'number') {
    where.push(eq(notificationCampaigns.status, params.status));
  }
  if (params.pendingOnly) {
    where.push(eq(notificationCampaigns.status, NotificationCampaignStatus.SUBMITTED));
  }

  const [countRow] = await db
    .select({ c: count() })
    .from(notificationCampaigns)
    .where(and(...where));

  const rows = await db
    .select({
      id: notificationCampaigns.id,
      name: notificationCampaigns.name,
      eventCode: notificationCampaigns.eventCode,
      channel: notificationCampaigns.channel,
      templateId: notificationCampaigns.templateId,
      subjectOverride: notificationCampaigns.subjectOverride,
      bodyOverride: notificationCampaigns.bodyOverride,
      audienceType: notificationCampaigns.audienceType,
      status: notificationCampaigns.status,
      scheduledAt: notificationCampaigns.scheduledAt,
      submittedBy: notificationCampaigns.submittedBy,
      submittedAt: notificationCampaigns.submittedAt,
      approvedBy: notificationCampaigns.approvedBy,
      approvedAt: notificationCampaigns.approvedAt,
      rejectedBy: notificationCampaigns.rejectedBy,
      rejectedAt: notificationCampaigns.rejectedAt,
      approvalNote: notificationCampaigns.approvalNote,
      sentBy: notificationCampaigns.sentBy,
      sentAt: notificationCampaigns.sentAt,
      createdBy: notificationCampaigns.createdBy,
      createdAt: notificationCampaigns.createdAt,
      updatedAt: notificationCampaigns.updatedAt,
      templateName: notificationTemplates.name,
    })
    .from(notificationCampaigns)
    .leftJoin(notificationTemplates, eq(notificationTemplates.id, notificationCampaigns.templateId))
    .where(and(...where))
    .orderBy(desc(notificationCampaigns.createdAt), desc(notificationCampaigns.id))
    .limit(params.limit)
    .offset(params.offset);

  return {
    data: rows,
    totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
  };
}

export async function createNotificationCampaignRepo(
  values: typeof notificationCampaigns.$inferInsert,
) {
  const [row] = await db.insert(notificationCampaigns).values(values).returning({
    id: notificationCampaigns.id,
  });
  return row ?? null;
}

export async function getNotificationCampaignByIdRepo(id: string, companyId: string) {
  const [row] = await db
    .select()
    .from(notificationCampaigns)
    .where(and(eq(notificationCampaigns.id, id), eq(notificationCampaigns.companyId, companyId)))
    .limit(1);

  return row ?? null;
}

export async function updateNotificationCampaignRepo(
  id: string,
  companyId: string,
  patch: Partial<typeof notificationCampaigns.$inferInsert>,
) {
  const [row] = await db
    .update(notificationCampaigns)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(notificationCampaigns.id, id), eq(notificationCampaigns.companyId, companyId)))
    .returning({ id: notificationCampaigns.id });

  return row ?? null;
}

export type ListNotificationDispatchesParams = {
  companyId: string;
  limit: number;
  offset: number;
  search?: string | null;
  channel?: string | null;
  status?: string | null;
  campaignId?: string | null;
};

export async function listNotificationDispatchesRepo(params: ListNotificationDispatchesParams) {
  const where = [eq(notificationDispatches.companyId, params.companyId)];
  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    where.push(
      or(
        ilike(notificationDispatches.recipientName, q),
        ilike(notificationDispatches.recipientAddress, q),
        ilike(notificationDispatches.body, q),
        ilike(notificationDispatches.subject, q),
      )!,
    );
  }
  if (params.channel?.trim()) {
    where.push(eq(notificationDispatches.channel, params.channel.trim().toLowerCase()));
  }
  if (params.status?.trim()) {
    where.push(eq(notificationDispatches.status, params.status.trim().toLowerCase()));
  }
  if (params.campaignId?.trim()) {
    where.push(eq(notificationDispatches.campaignId, params.campaignId.trim()));
  }

  const [countRow] = await db
    .select({ c: count() })
    .from(notificationDispatches)
    .where(and(...where));

  const rows = await db
    .select({
      id: notificationDispatches.id,
      campaignId: notificationDispatches.campaignId,
      channel: notificationDispatches.channel,
      providerId: notificationDispatches.providerId,
      providerKey: notificationDispatches.providerKey,
      recipientType: notificationDispatches.recipientType,
      recipientId: notificationDispatches.recipientId,
      recipientName: notificationDispatches.recipientName,
      recipientAddress: notificationDispatches.recipientAddress,
      subject: notificationDispatches.subject,
      body: notificationDispatches.body,
      status: notificationDispatches.status,
      attemptCount: notificationDispatches.attemptCount,
      providerMessageId: notificationDispatches.providerMessageId,
      errorMessage: notificationDispatches.errorMessage,
      metadataJson: notificationDispatches.metadataJson,
      createdAt: notificationDispatches.createdAt,
      updatedAt: notificationDispatches.updatedAt,
      campaignName: notificationCampaigns.name,
    })
    .from(notificationDispatches)
    .leftJoin(
      notificationCampaigns,
      eq(notificationCampaigns.id, notificationDispatches.campaignId),
    )
    .where(and(...where))
    .orderBy(desc(notificationDispatches.createdAt), desc(notificationDispatches.id))
    .limit(params.limit)
    .offset(params.offset);

  return {
    data: rows,
    totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
  };
}

export async function createNotificationDispatchRepo(
  values: typeof notificationDispatches.$inferInsert,
) {
  const [row] = await db.insert(notificationDispatches).values(values).returning({
    id: notificationDispatches.id,
  });

  return row ?? null;
}

export async function getNotificationDispatchByIdRepo(id: string, companyId: string) {
  const [row] = await db
    .select()
    .from(notificationDispatches)
    .where(and(eq(notificationDispatches.id, id), eq(notificationDispatches.companyId, companyId)))
    .limit(1);

  return row ?? null;
}

export async function updateNotificationDispatchResultRepo(
  id: string,
  companyId: string,
  patch: Partial<typeof notificationDispatches.$inferInsert>,
) {
  const [row] = await db
    .update(notificationDispatches)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(notificationDispatches.id, id), eq(notificationDispatches.companyId, companyId)))
    .returning({ id: notificationDispatches.id });

  return row ?? null;
}

type RecipientRow = {
  recipientType: 'customer' | 'user' | 'employee';
  recipientId: string;
  recipientName: string | null;
  recipientAddress: string;
  recipientPhone: string | null;
};

export async function getNotificationSenderContextRepo(input: {
  companyId: string;
  userId: string;
}) {
  const [row] = await db
    .select({
      senderName: users.fullname,
      senderPhone: users.telephone,
      branch: branches.name,
      location: locations.name,
    })
    .from(users)
    .leftJoin(branches, eq(branches.id, users.branchId))
    .leftJoin(locations, eq(locations.id, users.locationId))
    .where(and(eq(users.id, input.userId), eq(users.companyId, input.companyId)))
    .limit(1);

  return row ?? null;
}

export async function resolveAudienceRecipientsRepo(input: {
  companyId: string;
  channel: string;
  audienceType: string;
}) {
  const channel = input.channel.toLowerCase();
  const isSms = channel === 'sms';
  const audienceType = input.audienceType.toLowerCase();

  if (audienceType === 'customers_all') {
    const rows = await db
      .select({
        recipientType: sql<'customer'>`'customer'`,
        recipientId: customers.id,
        recipientName: customers.fullname,
        recipientAddress: isSms ? customers.telephone : customers.email,
        recipientPhone: customers.telephone,
      })
      .from(customers)
      .where(
        and(
          eq(customers.companyId, input.companyId),
          eq(customers.isDeleted, false),
          isSms ? isNotNull(customers.telephone) : isNotNull(customers.email),
        ),
      );

    return rows.filter((row) => Boolean(row.recipientAddress)) as RecipientRow[];
  }

  if (audienceType === 'users_all') {
    const rows = await db
      .select({
        recipientType: sql<'user'>`'user'`,
        recipientId: users.id,
        recipientName: users.fullname,
        recipientAddress: isSms ? users.telephone : users.email,
        recipientPhone: users.telephone,
      })
      .from(users)
      .where(
        and(
          eq(users.companyId, input.companyId),
          isSms ? isNotNull(users.telephone) : isNotNull(users.email),
        ),
      );

    return rows.filter((row) => Boolean(row.recipientAddress)) as RecipientRow[];
  }

  if (audienceType === 'employees_all') {
    const rows = await db
      .select({
        recipientType: sql<'employee'>`'employee'`,
        recipientId: employees.id,
        recipientName: employees.displayName,
        recipientAddress: isSms ? employees.telephone : employees.email,
        recipientPhone: employees.telephone,
      })
      .from(employees)
      .where(
        and(
          eq(employees.companyId, input.companyId),
          eq(employees.isDeleted, false),
          isSms ? isNotNull(employees.telephone) : isNotNull(employees.email),
        ),
      );

    return rows.filter((row) => Boolean(row.recipientAddress)) as RecipientRow[];
  }

  if (audienceType === 'employees_birthday_today') {
    const rows = await db
      .select({
        recipientType: sql<'employee'>`'employee'`,
        recipientId: employees.id,
        recipientName: employees.displayName,
        recipientAddress: isSms ? employees.telephone : employees.email,
        recipientPhone: employees.telephone,
      })
      .from(employees)
      .where(
        and(
          eq(employees.companyId, input.companyId),
          eq(employees.isDeleted, false),
          isNotNull(employees.dateOfBirth),
          isSms ? isNotNull(employees.telephone) : isNotNull(employees.email),
          sql`EXTRACT(MONTH FROM ${employees.dateOfBirth}) = EXTRACT(MONTH FROM CURRENT_DATE)`,
          sql`EXTRACT(DAY FROM ${employees.dateOfBirth}) = EXTRACT(DAY FROM CURRENT_DATE)`,
        ),
      );

    return rows.filter((row) => Boolean(row.recipientAddress)) as RecipientRow[];
  }

  return [] as RecipientRow[];
}

export async function getParcelRecipientsRepo(companyId: string, parcelId: string) {
  const rows = await db
    .select({
      parcelId: parcels.id,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      branch: branches.name,
      branchPhone: branches.telephone,
      location: locations.name,
      secondReceiverId: parcels.secondReceiverId,
      primaryReceiverId: customers.id,
      primaryReceiverName: customers.fullname,
      primaryReceiverPhone: customers.telephone,
      primaryReceiverPhone2: customers.telephone2,
      primaryReceiverEmail: customers.email,
    })
    .from(parcels)
    .innerJoin(customers, eq(customers.id, parcels.receiverId))
    .leftJoin(branches, eq(branches.id, parcels.destinationId))
    .leftJoin(locations, eq(locations.id, parcels.pickupLocationId))
    .where(
      and(
        eq(parcels.id, parcelId),
        eq(parcels.companyId, companyId),
        eq(parcels.isDeleted, false),
        eq(customers.isDeleted, false),
      ),
    )
    .limit(1);

  const parcel = rows[0];
  if (!parcel) return null;

  const secondary = parcel.secondReceiverId
    ? await db
        .select({
          id: customers.id,
          fullname: customers.fullname,
          telephone: customers.telephone,
          email: customers.email,
        })
        .from(customers)
        .where(
          and(
            eq(customers.id, parcel.secondReceiverId),
            eq(customers.companyId, companyId),
            eq(customers.isDeleted, false),
          ),
        )
        .limit(1)
    : [];

  return {
    parcelId: parcel.parcelId,
    bookingCode: parcel.bookingCode,
    trackingCode: parcel.trackingCode,
    branch: parcel.branch,
    branchPhone: parcel.branchPhone,
    location: parcel.location,
    primary: {
      id: parcel.primaryReceiverId,
      name: parcel.primaryReceiverName,
      phone: parcel.primaryReceiverPhone,
      phone2: parcel.primaryReceiverPhone2,
      email: parcel.primaryReceiverEmail,
      type: 'receiver',
    },
    secondary: secondary[0]
      ? {
          id: secondary[0].id,
          name: secondary[0].fullname,
          phone: secondary[0].telephone,
          email: secondary[0].email,
          type: 'second_receiver',
        }
      : null,
  };
}

export async function listNotificationTemplateOptionsRepo(
  companyId: string,
  channel?: string | null,
) {
  const where = [
    eq(notificationTemplates.companyId, companyId),
    eq(notificationTemplates.isActive, true),
  ];
  if (channel?.trim()) {
    where.push(eq(notificationTemplates.channel, channel.trim().toLowerCase()));
  }

  return db
    .select({
      id: notificationTemplates.id,
      code: notificationTemplates.code,
      name: notificationTemplates.name,
      channel: notificationTemplates.channel,
    })
    .from(notificationTemplates)
    .where(and(...where))
    .orderBy(notificationTemplates.name);
}

export async function listCampaignRecipientsDispatchesRepo(campaignId: string, companyId: string) {
  return db
    .select()
    .from(notificationDispatches)
    .where(
      and(
        eq(notificationDispatches.companyId, companyId),
        eq(notificationDispatches.campaignId, campaignId),
        ne(notificationDispatches.status, 'cancelled'),
      ),
    );
}
