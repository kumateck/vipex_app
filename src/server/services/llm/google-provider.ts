import { GoogleGenAI, type Content } from '@google/genai';
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

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  client ??= new GoogleGenAI({ apiKey: env.GOOGLE_API_KEY });
  return client;
}

function modelForTier(tier: LlmComplexityTier): string {
  return tier === 'complex' ? env.GOOGLE_COMPLEX_MODEL : env.GOOGLE_SIMPLE_MODEL;
}

function toGoogleContents(messages: LlmMessage[]): Content[] {
  return messages.map((message): Content => {
    if (message.role === 'user') return { role: 'user', parts: [{ text: message.content }] };
    if (message.role === 'assistant' && 'content' in message) {
      return { role: 'model', parts: [{ text: message.content }] };
    }
    if (message.role === 'assistant') {
      return {
        role: 'model',
        parts: message.toolCalls.map((call) => ({
          functionCall: { id: call.id, name: call.name, args: call.input },
        })),
      };
    }
    // role: 'tool_result' — Google expects a parsed JSON object as the response payload.
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(message.content) as Record<string, unknown>;
    } catch {
      parsed = { output: message.content };
    }
    return {
      role: 'user',
      parts: [
        {
          functionResponse: {
            id: message.toolCallId,
            name: message.toolName,
            response: parsed,
          },
        },
      ],
    };
  });
}

export const googleProvider: LlmProvider = {
  name: 'google',
  isConfigured() {
    return Boolean(env.GOOGLE_API_KEY);
  },
  async complete(tier, params: LlmCompletionParams): Promise<LlmCompletionResult> {
    const model = modelForTier(tier);
    const response = await getClient().models.generateContent({
      model,
      contents: params.userMessage,
      config: { systemInstruction: params.systemPrompt },
    });
    const text = (response.text ?? '').trim();
    return { text, provider: 'google', model };
  },
  async completeWithTools(
    tier,
    params: LlmCompletionWithToolsParams,
  ): Promise<LlmCompletionWithToolsResult> {
    const model = modelForTier(tier);
    const response = await getClient().models.generateContent({
      model,
      contents: toGoogleContents(params.messages),
      config: {
        systemInstruction: params.systemPrompt,
        tools: [
          {
            functionDeclarations: params.tools.map((tool) => ({
              name: tool.name,
              description: tool.description,
              parametersJsonSchema: tool.inputSchema,
            })),
          },
        ],
      },
    });

    const functionCalls = response.functionCalls;
    if (functionCalls?.length) {
      const toolCalls = functionCalls.map((call, index) => ({
        id: call.id ?? `google_${Date.now()}_${index}`,
        name: call.name ?? '',
        input: (call.args ?? {}) as Record<string, unknown>,
      }));
      return { type: 'tool_calls', toolCalls, provider: 'google', model };
    }

    return { type: 'text', text: (response.text ?? '').trim(), provider: 'google', model };
  },
};
