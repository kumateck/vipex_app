import { api } from '@/services/api';
import type {
  RegisteredDevice,
  ReviewAction,
  DeviceStatus,
} from '../types/device-management.types';

export const deviceManagementApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listRegisteredDevices: builder.query<RegisteredDevice[], void>({
      query: () => '/auth/devices/',
      providesTags: ['Auth'],
    }),
    reviewRegisteredDevice: builder.mutation<
      { id: string; status: DeviceStatus },
      { id: string; action: ReviewAction; reason?: string }
    >({
      query: ({ id, action, reason }) => ({
        url: `/auth/devices/${id}/review`,
        method: 'POST',
        body: { action, reason },
      }),
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const { useListRegisteredDevicesQuery, useReviewRegisteredDeviceMutation } =
  deviceManagementApi;
