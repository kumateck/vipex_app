import { api } from '@/services/api';
import type {
  OtpAuthorizationTarget,
  OtpAuthorizationWorkflow,
  OtpApprovalQueue,
  OtpApprovalQueueQuery,
  PickupOtpAuthorization,
} from '@/shared/shipments/receiver-otp-exception';

type ApprovalQuery = {
  id: string;
  workflow: OtpAuthorizationWorkflow;
  handoverTarget: OtpAuthorizationTarget;
};
type ApprovalRequest = ApprovalQuery & {
  reason: string;
  expectedReceiverId: string;
  expectedCollectorId: string;
  expectedOtpRequestId?: string;
};

const queueTag = { type: 'Bookings', id: 'otp-approval-queue' } as const;

const authorizationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    pendingOtpApprovals: builder.query<OtpApprovalQueue, OtpApprovalQueueQuery>({
      query: (params) => ({ url: '/shipments/parcels/otp-approval-queue', params }),
      providesTags: [queueTag],
    }),
    parcelOtpAuthorization: builder.query<
      { approval: PickupOtpAuthorization | null },
      ApprovalQuery
    >({
      query: ({ id, ...params }) => ({ url: `/shipments/parcels/${id}/otp-authorization`, params }),
      providesTags: (_result, _error, { id }) => [
        { type: 'Bookings', id: `otp-authorization-${id}` },
      ],
    }),
    authorizeParcelWithoutOtp: builder.mutation<PickupOtpAuthorization, ApprovalRequest>({
      query: ({ id, ...body }) => ({
        url: `/shipments/parcels/${id}/otp-authorization`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, _error, { id }) =>
        result
          ? [
              { type: 'Bookings', id: `otp-authorization-${id}` },
              { type: 'Bookings', id },
              queueTag,
            ]
          : [],
    }),
  }),
});

export const {
  useParcelOtpAuthorizationQuery,
  useAuthorizeParcelWithoutOtpMutation,
  usePendingOtpApprovalsQuery,
} = authorizationApi;
