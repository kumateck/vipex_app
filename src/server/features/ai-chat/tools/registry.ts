import type { LlmToolDefinition } from '@/server/services/llm/types';
import { getCashFlowStatementTool, getIncomeStatementTool } from './financial-tools';
import {
  getBranchProfitabilityTool,
  getDeliveryPerformanceTool,
  getExpenseByCategoryTool,
} from './operational-tools';
import { getAuditAnalyticsTool, getCreditExposureTool } from './risk-tools';
import type { AiChatTool } from './types';

export const AI_CHAT_TOOLS: AiChatTool[] = [
  getIncomeStatementTool,
  getCashFlowStatementTool,
  getBranchProfitabilityTool,
  getDeliveryPerformanceTool,
  getExpenseByCategoryTool,
  getCreditExposureTool,
  getAuditAnalyticsTool,
] as AiChatTool[];

export const AI_CHAT_TOOL_MAP: Map<string, AiChatTool> = new Map(
  AI_CHAT_TOOLS.map((tool) => [tool.name, tool]),
);

export function toLlmToolDefinitions(): LlmToolDefinition[] {
  return AI_CHAT_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
}
