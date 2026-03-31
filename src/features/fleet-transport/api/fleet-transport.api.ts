import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListQuery,
  type ServerListResponse,
} from '@/services/rtk-query';

export type FleetVehicle = {
  id: string;
  plateNumber: string;
  model: string;
  assignedDriverUserId: string | null;
  assignedDriverName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FleetFuelLog = {
  id: string;
  logNo: string;
  vehicleId: string;
  vehiclePlateNumber: string | null;
  liters: number;
  fuelCostPsw: number;
  odometerKm: number | null;
  stationName: string | null;
  note: string | null;
  status: number;
  loggedByUserId: string;
  loggedByName: string | null;
  approvedByUserId: string | null;
  rejectedByUserId: string | null;
  rejectionReason: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const fleetTransportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listFleetVehicles: builder.query<
      ServerListResponse<FleetVehicle>,
      ServerListQuery<{ isActive?: boolean }> | void
    >({
      query: (query) => ({
        url: '/fleet-transport/vehicles',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('FleetTransport', result),
    }),

    createFleetVehicle: builder.mutation<
      { id: string },
      {
        branchId?: string | null;
        plateNumber: string;
        model: string;
        assignedDriverUserId?: string | null;
      }
    >({
      query: (body) => ({
        url: '/fleet-transport/vehicles',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('FleetTransport'),
    }),

    updateFleetVehicle: builder.mutation<
      { id: string },
      {
        id: string;
        body: {
          branchId?: string | null;
          plateNumber?: string;
          model?: string;
          assignedDriverUserId?: string | null;
          isActive?: boolean;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/fleet-transport/vehicles/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'FleetTransport', id },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    listFleetFuelLogs: builder.query<
      ServerListResponse<FleetFuelLog>,
      ServerListQuery<{ status?: number; vehicleId?: string; pendingOnly?: boolean }> | void
    >({
      query: (query) => ({
        url: '/fleet-transport/fuel-logs',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('FleetTransport', result),
    }),

    createFleetFuelLog: builder.mutation<
      { id: string },
      {
        branchId?: string | null;
        vehicleId: string;
        liters: number;
        fuelCostPsw: number;
        odometerKm?: number | null;
        stationName?: string | null;
        note?: string | null;
      }
    >({
      query: (body) => ({
        url: '/fleet-transport/fuel-logs',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('FleetTransport'),
    }),

    approveFleetFuelLog: builder.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => ({
        url: `/fleet-transport/fuel-logs/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'FleetTransport', id },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),

    rejectFleetFuelLog: builder.mutation<{ id: string }, { id: string; rejectionReason: string }>({
      query: ({ id, rejectionReason }) => ({
        url: `/fleet-transport/fuel-logs/${id}/reject`,
        method: 'POST',
        body: { rejectionReason },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'FleetTransport', id },
        ...invalidateEntityListTag('FleetTransport'),
      ],
    }),
  }),
});

export const {
  useListFleetVehiclesQuery,
  useCreateFleetVehicleMutation,
  useUpdateFleetVehicleMutation,
  useListFleetFuelLogsQuery,
  useCreateFleetFuelLogMutation,
  useApproveFleetFuelLogMutation,
  useRejectFleetFuelLogMutation,
} = fleetTransportApi;
