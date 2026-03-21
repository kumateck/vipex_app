import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListResponse,
} from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import type {
  Card,
  CardCreatePayload,
  CardListQuery,
  CardMutationInput,
  CardUpdatePayload,
} from '../types/card.types';
import { toCreateCardPayload, toUpdateCardPayload } from '../utils/card-payload';

export const cardsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listCards: builder.query<ServerListResponse<Card>, CardListQuery | void>({
      query: (query) => ({
        url: '/cards/',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Cards', result),
    }),

    getCard: builder.query<Card, string>({
      query: (id) => ({ url: `/cards/${id}` }),
      providesTags: (_result, _err, id) => [{ type: 'Cards', id }],
    }),

    updateCard: builder.mutation<{ id: string }, { id: string; body: CardMutationInput }>({
      query: ({ id, body }) => ({
        url: `/cards/${id}`,
        method: 'PATCH',
        body: toUpdateCardPayload(body) satisfies CardUpdatePayload,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Cards', id },
        ...invalidateEntityListTag('Cards'),
      ],
    }),

    createCard: builder.mutation<{ id: string }, CardMutationInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
        return {
          url: '/cards/',
          method: 'POST',
          body: toCreateCardPayload(body, {
            companyId: user.company.id,
            createdBy: user.id,
          }) satisfies CardCreatePayload,
        };
      },
      invalidatesTags: invalidateEntityListTag('Cards'),
    }),

    deleteCard: builder.mutation<void, string>({
      query: (id) => ({
        url: `/cards/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Cards', id },
        ...invalidateEntityListTag('Cards'),
      ],
    }),
  }),
});

export const {
  useListCardsQuery,
  useGetCardQuery,
  useUpdateCardMutation,
  useCreateCardMutation,
  useDeleteCardMutation,
} = cardsApi;
