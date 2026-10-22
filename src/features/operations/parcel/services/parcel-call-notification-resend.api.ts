import { api } from '@/services/api';
import type {
  ParcelCallNotificationSummary,
  SavedParcelCallOutcome,
} from '@/shared/notification-hub';

const callNotificationResendApi = api.injectEndpoints({
  endpoints: (builder) => ({
    resendParcelCallNotification: builder.mutation<
      ParcelCallNotificationSummary & { parcelId: string; trackingCode: string },
      {
        parcelId: string;
        expectedOutcome: SavedParcelCallOutcome;
        sendSms: boolean;
        sendEmail: boolean;
        includeSecondReceiver: boolean;
      }
    >({
      query: (body) => ({
        url: '/notification-hub/events/parcel-status-call/resend',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'NotificationHub', id: 'LIST' }],
    }),
  }),
});

export const { useResendParcelCallNotificationMutation } = callNotificationResendApi;
