import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import type { AiChatMessage } from '../api/ai-chat.api';
import { AiChatToolChart } from './ai-chat-tool-chart';

export function AiChatMessageBubble({ message }: { message: AiChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-2xl space-y-3 ${isUser ? '' : 'w-full'}`}>
        <div
          className={
            isUser
              ? 'rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground'
              : 'rounded-2xl border bg-card px-4 py-3 text-sm'
          }
        >
          {!isUser ? (
            <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon name="Sparkles" className="h-3.5 w-3.5 text-primary" />
              AI Insights
            </div>
          ) : null}
          {message.succeeded === false ? (
            <p className="text-muted-foreground">
              I couldn&apos;t answer that right now — please try again shortly.
            </p>
          ) : (
            <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {!isUser && message.toolInvocations.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {message.toolInvocations.map((invocation, index) => (
              <AiChatToolChart key={`${invocation.toolName}-${index}`} invocation={invocation} />
            ))}
          </div>
        ) : null}

        {!isUser && message.provider ? (
          <div className="flex justify-start">
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {message.provider}
            </Badge>
          </div>
        ) : null}
      </div>
    </div>
  );
}
