import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { aiChatConversations, aiChatMessages } from '@/db/schemas';
import type { AiChatConversationDto, AiChatMessageDto, AiChatToolInvocationDto } from './dto';

function parseToolInvocations(raw: string | null): AiChatToolInvocationDto[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AiChatToolInvocationDto[];
  } catch {
    return [];
  }
}

function toMessageDto(row: typeof aiChatMessages.$inferSelect): AiChatMessageDto {
  return {
    id: row.id,
    role: row.role === 'assistant' ? 'assistant' : 'user',
    content: row.content,
    toolInvocations: parseToolInvocations(row.toolInvocations),
    provider: row.provider,
    hitIterationCap: row.hitIterationCap,
    succeeded: row.succeeded,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createAiChatConversationRepo(input: {
  companyId: string;
  userId: string;
  title: string | null;
}): Promise<{ id: string } | null> {
  const [created] = await db
    .insert(aiChatConversations)
    .values({ companyId: input.companyId, userId: input.userId, title: input.title })
    .returning({ id: aiChatConversations.id });
  return created ?? null;
}

export async function touchAiChatConversationRepo(conversationId: string): Promise<void> {
  await db
    .update(aiChatConversations)
    .set({ updatedAt: new Date() })
    .where(eq(aiChatConversations.id, conversationId));
}

export async function getAiChatConversationOwnedByUserRepo(input: {
  conversationId: string;
  companyId: string;
  userId: string;
}): Promise<{ id: string } | null> {
  const [row] = await db
    .select({ id: aiChatConversations.id })
    .from(aiChatConversations)
    .where(
      and(
        eq(aiChatConversations.id, input.conversationId),
        eq(aiChatConversations.companyId, input.companyId),
        eq(aiChatConversations.userId, input.userId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getLatestAiChatConversationRepo(input: {
  companyId: string;
  userId: string;
}): Promise<AiChatConversationDto | null> {
  const [conversation] = await db
    .select()
    .from(aiChatConversations)
    .where(
      and(
        eq(aiChatConversations.companyId, input.companyId),
        eq(aiChatConversations.userId, input.userId),
      ),
    )
    .orderBy(desc(aiChatConversations.updatedAt))
    .limit(1);

  if (!conversation) return null;

  const messages = await db
    .select()
    .from(aiChatMessages)
    .where(eq(aiChatMessages.conversationId, conversation.id))
    .orderBy(asc(aiChatMessages.createdAt));

  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    messages: messages.map(toMessageDto),
  };
}

export async function listAiChatMessagesRepo(conversationId: string): Promise<AiChatMessageDto[]> {
  const rows = await db
    .select()
    .from(aiChatMessages)
    .where(eq(aiChatMessages.conversationId, conversationId))
    .orderBy(asc(aiChatMessages.createdAt));
  return rows.map(toMessageDto);
}

export async function insertAiChatMessageRepo(input: {
  conversationId: string;
  companyId: string;
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: AiChatToolInvocationDto[] | null;
  provider?: string | null;
  hitIterationCap?: boolean;
  succeeded?: boolean;
  errorReason?: string | null;
}): Promise<AiChatMessageDto | null> {
  const [created] = await db
    .insert(aiChatMessages)
    .values({
      conversationId: input.conversationId,
      companyId: input.companyId,
      role: input.role,
      content: input.content,
      toolInvocations: input.toolInvocations ? JSON.stringify(input.toolInvocations) : null,
      provider: input.provider ?? null,
      hitIterationCap: input.hitIterationCap ?? false,
      succeeded: input.succeeded ?? true,
      errorReason: input.errorReason ?? null,
    })
    .returning();

  return created ? toMessageDto(created) : null;
}
