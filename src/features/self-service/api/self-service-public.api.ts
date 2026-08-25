import { api } from '@/services/api';

export type SelfServiceBranchInfo = {
  branchId: string;
  branchName: string;
};

export type SelfServiceSession = SelfServiceBranchInfo & {
  sessionToken: string;
  issuedAt: string;
  expiresAt: string;
};

export type SelfServiceDraftContact = {
  fullname: string;
  phone: string;
  phone2?: string | null;
  customerId?: string | null;
};

export type SubmitSelfServiceDraftInput = {
  sessionToken: string;
  branchId: string;
  sender: SelfServiceDraftContact;
  receiver: SelfServiceDraftContact;
  destinationBranchId: string;
  destinationLocationId?: string | null;
  parcelContent: string;
  parcelValueCedis: number | string;
  callSender: boolean;
};

export type SubmitSelfServiceDraftResponse = {
  draftId: string;
  expiresAt: string;
};

export type SelfServiceCustomerMatch = {
  customerId: string;
  fullname: string;
  telephone2: string | null;
};

export type SelfServiceBranchOption = {
  id: string;
  name: string;
};

export type SelfServiceLocationOption = {
  id: string;
  name: string;
  branchId: string;
};

export const selfServicePublicApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createSelfServiceSession: builder.mutation<SelfServiceSession, string>({
      query: (branchId) => ({
        url: '/self-service/sessions',
        method: 'POST',
        body: { branchId },
      }),
    }),
    getSelfServiceBranchInfo: builder.query<
      SelfServiceBranchInfo,
      { branchId: string; sessionToken: string }
    >({
      query: ({ branchId, sessionToken }) => ({
        url: `/self-service/branches/${branchId}`,
        headers: { 'x-self-service-session': sessionToken },
      }),
    }),
    lookupSelfServiceCustomer: builder.query<
      SelfServiceCustomerMatch | null,
      { branchId: string; phone: string; sessionToken: string }
    >({
      query: ({ branchId, phone, sessionToken }) => ({
        url: '/self-service/customers/lookup',
        params: { branchId, phone },
        headers: { 'x-self-service-session': sessionToken },
      }),
    }),
    listSelfServiceDestinationBranches: builder.query<
      SelfServiceBranchOption[],
      { sourceBranchId: string; sessionToken: string }
    >({
      query: ({ sourceBranchId, sessionToken }) => ({
        url: '/self-service/destinations/branches',
        params: { sourceBranchId },
        headers: { 'x-self-service-session': sessionToken },
      }),
    }),
    listSelfServiceDestinationLocations: builder.query<
      SelfServiceLocationOption[],
      { sourceBranchId: string; destinationBranchId: string; sessionToken: string }
    >({
      query: ({ sourceBranchId, destinationBranchId, sessionToken }) => ({
        url: '/self-service/destinations/locations',
        params: { sourceBranchId, destinationBranchId },
        headers: { 'x-self-service-session': sessionToken },
      }),
    }),
    submitSelfServiceDraft: builder.mutation<
      SubmitSelfServiceDraftResponse,
      SubmitSelfServiceDraftInput
    >({
      query: ({ sessionToken, ...body }) => ({
        url: '/self-service/drafts',
        method: 'POST',
        headers: { 'x-self-service-session': sessionToken },
        body,
      }),
    }),
  }),
});

export const {
  useCreateSelfServiceSessionMutation,
  useGetSelfServiceBranchInfoQuery,
  useLookupSelfServiceCustomerQuery,
  useListSelfServiceDestinationBranchesQuery,
  useListSelfServiceDestinationLocationsQuery,
  useSubmitSelfServiceDraftMutation,
} = selfServicePublicApi;
