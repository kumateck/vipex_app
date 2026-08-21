import OpenAI from 'openai';
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

let client: OpenAI | null = null;
function getClient(): OpenAI {
  client ??= new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return client;
}

function modelForTier(tier: LlmComplexityTier): string {
  return tier === 'complex' ? env.OPENAI_COMPLEX_MODEL : env.OPENAI_SIMPLE_MODEL;
}

function toOpenAiMessages(messages: LlmMessage[]): OpenAI.ChatCompletionMessageParam[] {
  return messages.map((message): OpenAI.ChatCompletionMessageParam => {
    if (message.role === 'user') return { role: 'user', content: message.content };
    if (message.role === 'assistant' && 'content' in message) {
      return { role: 'assistant', content: message.content };
    }
    if (message.role === 'assistant') {
      return {
        role: 'assistant',
        content: null,
        tool_calls: message.toolCalls.map((call) => ({
          id: call.id,
          type: 'function' as const,
          function: { name: call.name, arguments: JSON.stringify(call.input) },
        })),
      };
    }
    // role: 'tool_result'
    return { role: 'tool', tool_call_id: message.toolCallId, content: message.content };
  });
}

export const openaiProvider: LlmProvider = {
  name: 'openai',
  isConfigured() {
    return Boolean(env.OPENAI_API_KEY);
  },
  async complete(tier, params: LlmCompletionParams): Promise<LlmCompletionResult> {
    const model = modelForTier(tier);
    const completion = await getClient().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userMessage },
      ],
    });
    const text = completion.choices[0]?.message?.content?.trim() ?? '';
    return { text, provider: 'openai', model };
  },
  async completeWithTools(
    tier,
    params: LlmCompletionWithToolsParams,
  ): Promise<LlmCompletionWithToolsResult> {
    const model = modelForTier(tier);
    const completion = await getClient().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: params.systemPrompt },
        ...toOpenAiMessages(params.messages),
      ],
      tools: params.tools.map((tool) => ({
        type: 'function' as const,
        function: { name: tool.name, description: tool.description, parameters: tool.inputSchema },
      })),
    });

    const message = completion.choices[0]?.message;
    if (message?.tool_calls?.length) {
      const toolCalls = message.tool_calls
        .filter(
          (call): call is OpenAI.ChatCompletionMessageFunctionToolCall => call.type === 'function',
        )
        .map((call) => {
          let input: Record<string, unknown> = {};
          try {
            input = JSON.parse(call.function.arguments) as Record<string, unknown>;
          } catch {
            input = {};
          }
          return { id: call.id, name: call.function.name, input };
        });
      return { type: 'tool_calls', toolCalls, provider: 'openai', model };
    }

    return { type: 'text', text: message?.content?.trim() ?? '', provider: 'openai', model };
  },
};
