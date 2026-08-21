import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
  useGetLatestAiChatConversationQuery,
  useSendAiChatMessageMutation,
  type AiChatMessage,
} from '../api/ai-chat.api';
import { AiChatComposer } from '../components/ai-chat-composer';
import { AiChatMessageList } from '../components/ai-chat-message-list';

const THINKING_MESSAGE: AiChatMessage = {
  id: '__thinking__',
  role: 'assistant',
  content: 'Thinking… querying data',
  toolInvocations: [],
  provider: null,
  hitIterationCap: false,
  succeeded: true,
  createdAt: new Date().toISOString(),
};

export function AiChatPage() {
  const latest = useGetLatestAiChatConversationQuery();
  const [sendMessage, sendState] = useSendAiChatMessageMutation();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);

  useEffect(() => {
    if (latest.data) {
      setConversationId(latest.data.id);
      setMessages(latest.data.messages);
    }
  }, [latest.data]);

  function handleSend(text: string) {
    const optimisticUser: AiChatMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: text,
      toolInvocations: [],
      provider: null,
      hitIterationCap: false,
      succeeded: true,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);

    void sendMessage({ conversationId, message: text })
      .unwrap()
      .then((result) => {
        setConversationId(result.conversationId);
        setMessages((prev) => [...prev, result.message]);
      })
      .catch(() => {
        // handled by sendState.error below; optimistic user message stays visible
      });
  }

  function handleNewChat() {
    setConversationId(null);
    setMessages([]);
  }

  const displayMessages = sendState.isLoading ? [...messages, THINKING_MESSAGE] : messages;

  return (
    <div className="w-full p-3">
      <div className="flex h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-2xl border bg-background shadow">
        <div className="z-20 flex shrink-0 items-start justify-between gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Icon name="Sparkles" className="h-4 w-4 text-primary" /> AI Insights Chat
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Ask about profitability, cash, branch performance, or credit risk. Answers are
              grounded in live data — verify against the charts shown before acting on them.
            </p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" onClick={handleNewChat}>
            <Icon name="Plus" className="h-4 w-4" /> New Chat
          </Button>
        </div>

        {displayMessages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Ask your first question to get started.
          </div>
        ) : (
          <AiChatMessageList messages={displayMessages} />
        )}

        <div className="shrink-0 border-t bg-background/95 px-4 py-3 backdrop-blur">
          {sendState.error ? (
            <p className="mb-2 text-sm text-muted-foreground">
              The AI chat isn&apos;t available right now — please try again shortly.
            </p>
          ) : null}
          <AiChatComposer onSend={handleSend} disabled={sendState.isLoading} />
        </div>
      </div>
    </div>
  );
}
