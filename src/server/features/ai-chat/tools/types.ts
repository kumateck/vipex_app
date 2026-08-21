export type AiChatChartType = 'bar' | 'donut' | 'line' | 'none';

export type AiChatChartPoint = { label: string; value: number };

export type AiChatToolScope = { companyId: string };

export type AiChatTool<TArgs extends Record<string, unknown> = Record<string, unknown>> = {
  name: string;
  description: string;
  /** JSON schema for the LLM-settable args only — never include companyId or any tenant-scoping field here. */
  inputSchema: Record<string, unknown>;
  defaultChartType: AiChatChartType;
  handler: (args: TArgs, scope: AiChatToolScope) => Promise<unknown>;
  toChartPoints: (raw: unknown) => AiChatChartPoint[];
  /**
   * Converts the raw *Svc result (amounts in pesewas, via *Psw fields) into a
   * clean, cedis-denominated, explicitly-labelled JSON object for the LLM to
   * read. This is what actually goes into the tool_result message — never the
   * raw Psw JSON — so the model can't accidentally narrate a pesewas figure
   * as if it were cedis (a 100x unit error) or omit the currency unit.
   */
  toLlmSummary: (raw: unknown) => Record<string, unknown>;
};
