import type { AiChatChartPoint, AiChatChartType } from './tools/types';

export type AiChatToolInvocationDto = {
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
  chartType: AiChatChartType;
  chartPoints: AiChatChartPoint[];
};

export type AiChatMessageDto = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolInvocations: AiChatToolInvocationDto[];
  provider: string | null;
  hitIterationCap: boolean;
  succeeded: boolean;
  createdAt: string;
};

export type AiChatConversationDto = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages: AiChatMessageDto[];
};

export type SendAiChatMessageInput = {
  companyId: string;
  userId: string;
  conversationId?: string | null;
  message: string;
};

export type SendAiChatMessageResult = {
  conversationId: string;
  message: AiChatMessageDto;
};

export type GetLatestAiChatConversationInput = {
  companyId: string;
  userId: string;
};
