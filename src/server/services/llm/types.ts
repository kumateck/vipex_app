export type LlmComplexityTier = 'simple' | 'complex';

export type LlmCompletionParams = {
  systemPrompt: string;
  userMessage: string;
};

export type LlmCompletionResult = {
  text: string;
  provider: LlmProviderName;
  model: string;
};

export type LlmProviderName = 'anthropic' | 'openai' | 'google';

export type LlmToolCall = {
  id: string;
  name: string;
  input: Record<string, unknown>;
};

export type LlmMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string }
  | { role: 'assistant'; toolCalls: LlmToolCall[] }
  | { role: 'tool_result'; toolCallId: string; toolName: string; content: string };

export type LlmToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export type LlmCompletionWithToolsParams = {
  systemPrompt: string;
  messages: LlmMessage[];
  tools: LlmToolDefinition[];
};

export type LlmCompletionWithToolsResult =
  | { type: 'text'; text: string; provider: LlmProviderName; model: string }
  | { type: 'tool_calls'; toolCalls: LlmToolCall[]; provider: LlmProviderName; model: string };

export interface LlmProvider {
  readonly name: LlmProviderName;
  isConfigured(): boolean;
  complete(tier: LlmComplexityTier, params: LlmCompletionParams): Promise<LlmCompletionResult>;
  completeWithTools(
    tier: LlmComplexityTier,
    params: LlmCompletionWithToolsParams,
  ): Promise<LlmCompletionWithToolsResult>;
}
