import { api } from '@/services/api';
import type {
  OtpAuthorizationTarget,
  OtpAuthorizationWorkflow,
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
};

const authorizationApi = api.injectEndpoints({
  endpoints: (builder) => ({
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
            ]
          : [],
    }),
  }),
});

export const { useParcelOtpAuthorizationQuery, useAuthorizeParcelWithoutOtpMutation } =
  authorizationApi;
