import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useAskHelpAssistantMutation } from '../../api/help-assistant.api';

type Props = {
  onSelectGuide: (guideId: string) => void;
};

export function HelpAssistantPanel({ onSelectGuide }: Props) {
  const [question, setQuestion] = useState('');
  const [askHelpAssistant, { data, error, isLoading }] = useAskHelpAssistantMutation();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    void askHelpAssistant({ question: trimmed });
  }

  return (
    <section className="rounded-xl border bg-card p-5 md:p-7">
      <h3 className="flex items-center gap-2 font-semibold">
        <Icon name="Sparkles" className="h-5 w-5 text-primary" /> Ask a question
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Get a quick answer grounded in the Help Center guides below.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="e.g. Where do I find my daily sales as a cashier?"
          minLength={3}
          maxLength={500}
          className="min-h-10 flex-1"
        />
        <Button type="submit" disabled={isLoading || question.trim().length < 3}>
          {isLoading ? <Spinner /> : <Icon name="Send" className="h-4 w-4" />}
          Ask
        </Button>
      </form>

      {error ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Ask a question isn&apos;t available right now — browse the guides below.
        </p>
      ) : null}

      {data ? (
        <div className="mt-4 rounded-lg border bg-muted/40 p-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.answer}</p>
          {data.sources.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {data.sources.map((source) => (
                <Badge
                  key={source.guideId}
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => onSelectGuide(source.guideId)}
                >
                  {source.title}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
