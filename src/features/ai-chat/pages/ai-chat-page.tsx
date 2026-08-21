import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
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
    <ScrollableWrapper>
      <div className="mx-auto flex h-full w-full max-w-4xl flex-col p-4 md:p-6">
        <Card className="flex min-h-[70vh] flex-1 flex-col">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Sparkles" className="h-5 w-5 text-primary" /> AI Insights Chat
              </CardTitle>
              <CardDescription>
                Ask about profitability, cash, branch performance, or credit risk. Answers are
                grounded in live data — verify against the charts shown before acting on them.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleNewChat}>
              <Icon name="Plus" className="h-4 w-4" /> New Chat
            </Button>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
            {sendState.error ? (
              <p className="text-sm text-muted-foreground">
                The AI chat isn&apos;t available right now — please try again shortly.
              </p>
            ) : null}

            {displayMessages.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                Ask your first question to get started.
              </div>
            ) : (
              <AiChatMessageList messages={displayMessages} />
            )}

            <AiChatComposer onSend={handleSend} disabled={sendState.isLoading} />
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
