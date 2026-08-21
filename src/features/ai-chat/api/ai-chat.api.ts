import { api } from '@/services/api';

export type AiChatChartType = 'bar' | 'donut' | 'line' | 'none';

export type AiChatToolInvocation = {
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
  chartType: AiChatChartType;
  chartPoints: { label: string; value: number }[];
};

export type AiChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolInvocations: AiChatToolInvocation[];
  provider: string | null;
  hitIterationCap: boolean;
  succeeded: boolean;
  createdAt: string;
};

export type AiChatConversation = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages: AiChatMessage[];
};

export const aiChatApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLatestAiChatConversation: builder.query<AiChatConversation | null, void>({
      query: () => ({ url: '/ai-chat/conversations/latest' }),
      providesTags: [{ type: 'AiChatConversation', id: 'CURRENT' }],
    }),
    sendAiChatMessage: builder.mutation<
      { conversationId: string; message: AiChatMessage },
      { conversationId?: string | null; message: string }
    >({
      query: (body) => ({ url: '/ai-chat/messages', method: 'POST', body }),
      invalidatesTags: [{ type: 'AiChatConversation', id: 'CURRENT' }],
    }),
  }),
});

export const { useGetLatestAiChatConversationQuery, useSendAiChatMessageMutation } = aiChatApi;
