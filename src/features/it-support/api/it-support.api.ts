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

export type ItSupportTicketEvent = {
  id: string;
  ticketId: string;
  eventType: string;
  eventNote: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  performedBy: string | null;
  performedByUserName: string | null;
  createdAt: string | null;
};

export const itSupportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listItSupportTickets: builder.query<
      ItSupportTicket[],
      {
        status?: string;
        priority?: string;
        assignedToUserId?: string;
        branchId?: string;
        locationId?: string;
      } | void
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
        branchId?: string | null;
        locationId?: string | null;
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

    getItSupportTicket: builder.query<ItSupportTicket, string>({
      query: (id) => ({
        url: `/it-support/tickets/${id}`,
      }),
      providesTags: (_result, _error, id) => [{ type: 'ItSupport', id }],
    }),

    listItSupportTicketEvents: builder.query<ItSupportTicketEvent[], string>({
      query: (ticketId) => ({
        url: `/it-support/tickets/${ticketId}/events`,
      }),
      providesTags: (_result, _error, ticketId) => [
        { type: 'ItSupport', id: ticketId },
        { type: 'ItSupport', id: `${ticketId}:events` },
      ],
    }),

    createItSupportTicketNote: builder.mutation<ItSupportTicketEvent, { id: string; note: string }>(
      {
        query: ({ id, note }) => ({
          url: `/it-support/tickets/${id}/notes`,
          method: 'POST',
          body: { note },
        }),
        invalidatesTags: (_result, _error, { id }) => [
          { type: 'ItSupport', id },
          { type: 'ItSupport', id: `${id}:events` },
        ],
      },
    ),
  }),
});

export const {
  useListItSupportTicketsQuery,
  useCreateItSupportTicketMutation,
  useUpdateItSupportTicketMutation,
  useGetItSupportTicketQuery,
  useListItSupportTicketEventsQuery,
  useCreateItSupportTicketNoteMutation,
} = itSupportApi;
