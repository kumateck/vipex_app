import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  onSend: (message: string) => void;
  disabled?: boolean;
};

export function AiChatComposer({ onSend, disabled }: Props) {
  const [message, setMessage] = useState('');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setMessage('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <Textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Ask about profitability, cash, branch performance, credit risk..."
        maxLength={1000}
        className="min-h-11 flex-1"
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit(event);
          }
        }}
      />
      <Button type="submit" disabled={disabled || message.trim().length === 0}>
        {disabled ? <Spinner /> : <Icon name="Send" className="h-4 w-4" />}
        Send
      </Button>
    </form>
  );
}
