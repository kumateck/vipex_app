import { api } from '@/services/api';

export type HelpAssistantAskSource = {
  guideId: string;
  title: string;
};

export type HelpAssistantAskResponse = {
  answer: string;
  sources: HelpAssistantAskSource[];
  provider: string;
  grounded: boolean;
};

export const helpAssistantApi = api.injectEndpoints({
  endpoints: (builder) => ({
    askHelpAssistant: builder.mutation<HelpAssistantAskResponse, { question: string }>({
      query: (body) => ({
        url: '/help-assistant/ask',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useAskHelpAssistantMutation } = helpAssistantApi;
