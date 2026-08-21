import { selectProvider } from '@/server/services/llm/router';
import type { LlmMessage } from '@/server/services/llm/types';
import { ServiceUnavailable } from '@/server/utils/http-error';
import { logger } from '@/server/utils/logger';
import { AI_CHAT_TOOL_MAP, toLlmToolDefinitions } from './tools/registry';
import type { AiChatChartPoint, AiChatChartType } from './tools/types';

const MAX_ITERATIONS = 4;

export type AgentToolInvocation = {
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
  chartType: AiChatChartType;
  chartPoints: AiChatChartPoint[];
};

export type AgentLoopResult = {
  finalText: string;
  toolInvocations: AgentToolInvocation[];
  provider: string;
  hitIterationCap: boolean;
};

export async function runAgentLoop(params: {
  companyId: string;
  systemPrompt: string;
  conversationMessages: LlmMessage[];
}): Promise<AgentLoopResult> {
  const provider = selectProvider('complex');
  if (!provider) {
    throw ServiceUnavailable(
      'The AI chat is not set up yet. Please try again once it has been configured.',
    );
  }

  const messages: LlmMessage[] = [...params.conversationMessages];
  const toolInvocations: AgentToolInvocation[] = [];
  const tools = toLlmToolDefinitions();

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const allowTools = i < MAX_ITERATIONS - 1;
    const result = await provider.completeWithTools('complex', {
      systemPrompt: params.systemPrompt,
      messages,
      tools: allowTools ? tools : [],
    });

    if (result.type === 'text') {
      return {
        finalText: result.text,
        toolInvocations,
        provider: result.provider,
        hitIterationCap: false,
      };
    }

    messages.push({ role: 'assistant', toolCalls: result.toolCalls });

    for (const call of result.toolCalls) {
      const tool = AI_CHAT_TOOL_MAP.get(call.name);
      let raw: unknown;
      let chartPoints: AiChatChartPoint[] = [];
      let llmSummary: Record<string, unknown>;

      if (!tool) {
        raw = { error: `Unknown tool: ${call.name}` };
        llmSummary = raw as Record<string, unknown>;
      } else {
        try {
          raw = await tool.handler(call.input, { companyId: params.companyId });
          chartPoints = tool.toChartPoints(raw);
          llmSummary = tool.toLlmSummary(raw);
        } catch (err) {
          logger.error(`ai-chat: tool ${call.name} failed`, err);
          raw = { error: 'This data is currently unavailable.' };
          llmSummary = raw as Record<string, unknown>;
        }
      }

      toolInvocations.push({
        toolName: call.name,
        args: call.input,
        result: raw,
        chartType: tool?.defaultChartType ?? 'none',
        chartPoints,
      });

      // The model only ever sees the cedis-converted, cleanly-labelled summary —
      // never the raw *Svc result (which uses *Psw pesewas fields) — so it can
      // never narrate a pesewas figure as if it were cedis.
      messages.push({
        role: 'tool_result',
        toolCallId: call.id,
        toolName: call.name,
        content: JSON.stringify(llmSummary),
      });
    }
  }

  return {
    finalText:
      'I have gathered the available data but could not finish forming an answer — please refine your question.',
    toolInvocations,
    provider: provider.name,
    hitIterationCap: true,
  };
}
