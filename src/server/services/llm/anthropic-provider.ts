import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/server/utils/env';
import type {
  LlmCompletionParams,
  LlmCompletionResult,
  LlmCompletionWithToolsParams,
  LlmCompletionWithToolsResult,
  LlmComplexityTier,
  LlmMessage,
  LlmProvider,
} from './types';

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return client;
}

function modelForTier(tier: LlmComplexityTier): string {
  return tier === 'complex' ? env.ANTHROPIC_COMPLEX_MODEL : env.ANTHROPIC_SIMPLE_MODEL;
}

function toAnthropicMessages(messages: LlmMessage[]): Anthropic.MessageParam[] {
  return messages.map((message): Anthropic.MessageParam => {
    if (message.role === 'user') return { role: 'user', content: message.content };
    if (message.role === 'assistant' && 'content' in message) {
      return { role: 'assistant', content: message.content };
    }
    if (message.role === 'assistant') {
      return {
        role: 'assistant',
        content: message.toolCalls.map((call) => ({
          type: 'tool_use' as const,
          id: call.id,
          name: call.name,
          input: call.input,
        })),
      };
    }
    // role: 'tool_result' — Anthropic requires results sent back as a user turn.
    return {
      role: 'user',
      content: [
        { type: 'tool_result' as const, tool_use_id: message.toolCallId, content: message.content },
      ],
    };
  });
}

export const anthropicProvider: LlmProvider = {
  name: 'anthropic',
  isConfigured() {
    return Boolean(env.ANTHROPIC_API_KEY);
  },
  async complete(tier, params: LlmCompletionParams): Promise<LlmCompletionResult> {
    const model = modelForTier(tier);
    const response = await getClient().messages.create({
      model,
      max_tokens: 1024,
      system: params.systemPrompt,
      messages: [{ role: 'user', content: params.userMessage }],
    });
    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();
    return { text, provider: 'anthropic', model };
  },
  async completeWithTools(
    tier,
    params: LlmCompletionWithToolsParams,
  ): Promise<LlmCompletionWithToolsResult> {
    const model = modelForTier(tier);
    const response = await getClient().messages.create({
      model,
      max_tokens: 2048,
      system: params.systemPrompt,
      messages: toAnthropicMessages(params.messages),
      tools: params.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
      })),
    });

    if (response.stop_reason === 'tool_use') {
      const toolCalls = response.content
        .filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')
        .map((block) => ({
          id: block.id,
          name: block.name,
          input: (block.input ?? {}) as Record<string, unknown>,
        }));
      return { type: 'tool_calls', toolCalls, provider: 'anthropic', model };
    }

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();
    return { type: 'text', text, provider: 'anthropic', model };
  },
};
