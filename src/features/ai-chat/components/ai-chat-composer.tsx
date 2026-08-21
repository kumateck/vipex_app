import { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';

type Props = {
  onSend: (message: string) => void;
  disabled?: boolean;
};

export function AiChatComposer({ onSend, disabled }: Props) {
  const [message, setMessage] = useState('');

  function submit() {
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setMessage('');
  }

  return (
    <InputGroup className="rounded-3xl border-0 bg-muted/40 px-1 shadow-sm">
      <InputGroupTextarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Ask about profitability, cash, branch performance, credit risk..."
        maxLength={1000}
        rows={13}
        className="max-h-72 min-h-14 overflow-y-auto px-3 text-sm"
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
      />
      <InputGroupAddon align="block-end" className="justify-end px-3 pb-2.5">
        <InputGroupButton
          type="button"
          size="icon-sm"
          variant="default"
          className="rounded-full"
          disabled={disabled || message.trim().length === 0}
          onClick={submit}
          aria-label="Send"
        >
          {disabled ? <Spinner /> : <Icon name="ArrowUp" className="h-4 w-4" />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
