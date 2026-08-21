import type { LlmMessage } from '@/server/services/llm/types';
import { logger } from '@/server/utils/logger';
import { NotFound } from '@/server/utils/http-error';
import { runAgentLoop } from './agent-loop';
import type {
  AiChatConversationDto,
  GetLatestAiChatConversationInput,
  SendAiChatMessageInput,
  SendAiChatMessageResult,
} from './dto';
import {
  createAiChatConversationRepo,
  getAiChatConversationOwnedByUserRepo,
  getLatestAiChatConversationRepo,
  insertAiChatMessageRepo,
  listAiChatMessagesRepo,
  touchAiChatConversationRepo,
} from './repository';

function buildSystemPrompt(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `You are an AI data-insights assistant for management and the business owner of Vipex, a logistics/courier company. You answer questions about business performance using the tools provided — you never invent, estimate, or recompute a number yourself.

Today's date is ${today}. When a question uses a relative date phrase ("this year", "this month", "last 30 days", "year to date"), resolve it against today's actual date above, not any other assumption about the current date.

Rules:
- Only use numbers returned by tool calls. If you need data to answer, call the relevant tool(s) before answering.
- All monetary figures returned by tools are already in GHS (Ghana cedis) — always state "GHS" when quoting a monetary figure, and never divide, multiply, or otherwise convert a number a tool gave you.
- If a tool result contains an error or is unavailable, say so plainly rather than guessing.
- The audit "flagged for review" signal is a simple keyword match, not a verified fraud finding — never describe it as "confirmed fraud."
- Do not offer investment, legal, or tax advice — describe what the data shows.
- Only answer questions about business data (financials, operations, risk). If asked how to use the application itself, say that's a question for the Help Center instead.
- Keep answers concise and business-focused.`;
}

function toLlmHistory(messages: AiChatConversationDto['messages']): LlmMessage[] {
  return messages
    .filter((message) => message.content)
    .map(
      (message): LlmMessage =>
        message.role === 'assistant'
          ? { role: 'assistant', content: message.content }
          : { role: 'user', content: message.content },
    );
}

export async function sendAiChatMessageSvc(
  input: SendAiChatMessageInput,
): Promise<SendAiChatMessageResult> {
  let conversationId = input.conversationId ?? null;
  let priorMessages: AiChatConversationDto['messages'] = [];

  if (conversationId) {
    const owned = await getAiChatConversationOwnedByUserRepo({
      conversationId,
      companyId: input.companyId,
      userId: input.userId,
    });
    if (!owned) throw NotFound('Conversation not found');
    priorMessages = await listAiChatMessagesRepo(conversationId);
  } else {
    const created = await createAiChatConversationRepo({
      companyId: input.companyId,
      userId: input.userId,
      title: input.message.slice(0, 200),
    });
    if (!created) throw new Error('Failed to create conversation');
    conversationId = created.id;
  }

  await insertAiChatMessageRepo({
    conversationId,
    companyId: input.companyId,
    role: 'user',
    content: input.message,
  });

  const history: LlmMessage[] = [
    ...toLlmHistory(priorMessages),
    { role: 'user', content: input.message },
  ];

  try {
    const result = await runAgentLoop({
      companyId: input.companyId,
      systemPrompt: buildSystemPrompt(),
      conversationMessages: history,
    });

    const saved = await insertAiChatMessageRepo({
      conversationId,
      companyId: input.companyId,
      role: 'assistant',
      content: result.finalText,
      toolInvocations: result.toolInvocations,
      provider: result.provider,
      hitIterationCap: result.hitIterationCap,
      succeeded: true,
    });

    await touchAiChatConversationRepo(conversationId);

    if (!saved) throw new Error('Failed to persist assistant message');
    return { conversationId, message: saved };
  } catch (err) {
    logger.error('ai-chat: agent loop failed', err);
    await insertAiChatMessageRepo({
      conversationId,
      companyId: input.companyId,
      role: 'assistant',
      content: '',
      succeeded: false,
      errorReason: 'agent_loop_failed',
    });
    throw err;
  }
}

export async function getLatestAiChatConversationSvc(
  input: GetLatestAiChatConversationInput,
): Promise<AiChatConversationDto | null> {
  return getLatestAiChatConversationRepo(input);
}
