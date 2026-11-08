import { memo, useMemo } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWhatsAppTestSend } from '../../hooks';
import type { WhatsAppEventTemplate } from '../../types';
import { buildWhatsAppTestTemplateOptions } from '../../utils';

type WhatsAppTestCardProps = { events: WhatsAppEventTemplate[] };

export const WhatsAppTestCard = memo(function WhatsAppTestCard({ events }: WhatsAppTestCardProps) {
  const test = useWhatsAppTestSend();
  const options = useMemo(() => buildWhatsAppTestTemplateOptions(events), [events]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send a test message
        </CardTitle>
        <CardDescription>
          Sends the selected template with sample values (for example &quot;Test Customer&quot;) to
          confirm the saved credentials and that Meta has approved the template.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 md:flex-row">
        <Select value={test.template} onValueChange={test.setTemplate}>
          <SelectTrigger aria-label="Test template" className="md:max-w-sm">
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          aria-label="Test phone number"
          placeholder="0244123456"
          value={test.phone}
          onChange={(event) => test.setPhone(event.target.value)}
          className="md:max-w-xs"
        />
        <Button onClick={test.submit} disabled={test.isSending || test.phone.trim().length < 9}>
          {test.isSending ? 'Sending...' : 'Send test'}
        </Button>
      </CardContent>
    </Card>
  );
});
