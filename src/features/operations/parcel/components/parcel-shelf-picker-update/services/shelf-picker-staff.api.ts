import { api } from '@/services/api';
import type { StaffOption } from '../shelf-picker-update-types';

const shelfPickerStaffApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listShelfPickerStaff: builder.query<
      StaffOption[],
      { companyId: string; branchId: string; userId: string }
    >({
      query: () => '/shipments/parcels/shelf-picker-staff',
      providesTags: ['Users'],
    }),
  }),
});

export const { useListShelfPickerStaffQuery } = shelfPickerStaffApi;
