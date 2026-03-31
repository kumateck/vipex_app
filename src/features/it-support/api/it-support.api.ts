import { api } from '@/services/api';
import { invalidateEntityListTag } from '@/services/rtk-query';

export type ItSupportTicketAttachment = {
  id: string;
  fileName: string;
  contentType: string;
  url: string;
  sizeBytes: number;
  createdAt: string | null;
};

export type ItSupportTicket = {
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
  resolvedAt: string | null;
  closedAt: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  attachments: ItSupportTicketAttachment[];
};

export const itSupportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listItSupportTickets: builder.query<
      ItSupportTicket[],
      { status?: string; priority?: string; assignedToUserId?: string } | void
    >({
      query: (query) => ({
        url: '/it-support/tickets',
        params: query ?? undefined,
      }),
      providesTags: (result) => [
        { type: 'ItSupport', id: 'LIST' },
        ...(result?.map((ticket) => ({ type: 'ItSupport' as const, id: ticket.id })) ?? []),
      ],
    }),

    createItSupportTicket: builder.mutation<
      ItSupportTicket,
      {
        subject: string;
        description?: string | null;
        priority?: string | null;
        category?: string | null;
        branchId?: string | null;
        locationId?: string | null;
        assignedToUserId?: string | null;
        attachments?: Array<{ fileName: string; dataUrl: string }>;
      }
    >({
      query: (body) => ({
        url: '/it-support/tickets',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('ItSupport'),
    }),

    updateItSupportTicket: builder.mutation<
      ItSupportTicket,
      {
        id: string;
        status?: string | null;
        priority?: string | null;
        category?: string | null;
        assignedToUserId?: string | null;
        note?: string | null;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/it-support/tickets/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'ItSupport', id },
        ...invalidateEntityListTag('ItSupport'),
      ],
    }),
  }),
});

export const {
  useListItSupportTicketsQuery,
  useCreateItSupportTicketMutation,
  useUpdateItSupportTicketMutation,
} = itSupportApi;
