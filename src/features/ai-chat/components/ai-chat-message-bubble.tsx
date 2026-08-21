import { Icon } from '@/components/ui/icon';
import type { AiChatMessage } from '../api/ai-chat.api';
import { AiChatToolChart } from './ai-chat-tool-chart';

export function AiChatMessageBubble({ message }: { message: AiChatMessage }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <p className="max-w-xl rounded-md bg-muted/60 px-3 py-1.5 text-sm text-foreground">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
        <Icon name="Sparkles" className="h-3.5 w-3.5 text-primary" />
        AI Insights
        {message.provider ? (
          <span className="text-muted-foreground/60">· {message.provider}</span>
        ) : null}
      </div>

      {message.toolInvocations.map((invocation, index) => (
        <AiChatToolChart key={`${invocation.toolName}-${index}`} invocation={invocation} />
      ))}

      {message.succeeded === false ? (
        <p className="text-sm text-muted-foreground">
          I couldn&apos;t answer that right now — please try again shortly.
        </p>
      ) : (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      )}
    </div>
  );
}
