import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListQuery,
  type ServerListResponse,
} from '@/services/rtk-query';

export type CustomerWalletAccount = {
  id: string;
  customerId: string;
  fullname: string;
  telephone: string | null;
  email: string | null;
  customerType: number;
  creditEligible: boolean;
  creditLimitPsw: number;
  paymentTermsDays: number;
  balancePsw: number;
  outstandingPsw: number;
  openItemsCount: number;
  oldestOpenChargeAt: string | null;
  overdueDays: number;
  approvalStatus: 'NONE' | 'BLOCK_RECOMMENDED' | 'UNBLOCK_RECOMMENDED';
};

export const customerWalletCreditApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listCustomerWalletAccounts: builder.query<
      ServerListResponse<CustomerWalletAccount>,
      ServerListQuery<{
        creditEligible?: boolean;
        overdueOnly?: boolean;
        approvalOnly?: boolean;
      }> | void
    >({
      query: (query) => ({
        url: '/customer-wallet-credit/accounts',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('CustomerWalletCredit', result),
    }),

    listCustomerWalletApprovals: builder.query<
      ServerListResponse<CustomerWalletAccount>,
      ServerListQuery<{ creditEligible?: boolean; overdueOnly?: boolean }> | void
    >({
      query: (query) => ({
        url: '/customer-wallet-credit/approvals',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('CustomerWalletCredit', result),
    }),

    createCustomerWalletPayment: builder.mutation<
      {
        creditTransactionId: string;
        allocatedAmountPsw: number;
        unallocatedAmountPsw: number;
        allocations: Array<{ chargeTransactionId: string; amountPsw: number }>;
      },
      {
        customerId: string;
        amountCedis: number | string;
        notes?: string | null;
        referenceId?: string | null;
      }
    >({
      query: ({ customerId, ...body }) => ({
        url: `/customer-wallet-credit/accounts/${customerId}/payments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('CustomerWalletCredit'),
    }),

    blockCustomerWalletAccount: builder.mutation<{ id: string }, { customerId: string }>({
      query: ({ customerId }) => ({
        url: `/customer-wallet-credit/accounts/${customerId}/block`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'CustomerWalletCredit', id: customerId },
        ...invalidateEntityListTag('CustomerWalletCredit'),
      ],
    }),

    unblockCustomerWalletAccount: builder.mutation<{ id: string }, { customerId: string }>({
      query: ({ customerId }) => ({
        url: `/customer-wallet-credit/accounts/${customerId}/unblock`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'CustomerWalletCredit', id: customerId },
        ...invalidateEntityListTag('CustomerWalletCredit'),
      ],
    }),
  }),
});

export const {
  useListCustomerWalletAccountsQuery,
  useListCustomerWalletApprovalsQuery,
  useCreateCustomerWalletPaymentMutation,
  useBlockCustomerWalletAccountMutation,
  useUnblockCustomerWalletAccountMutation,
} = customerWalletCreditApi;
