import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useWhatsAppTestSend } from '../../hooks';

export function WhatsAppTestCard() {
  const test = useWhatsAppTestSend();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send a test message
        </CardTitle>
        <CardDescription>
          Sends Meta&apos;s built-in hello_world template to confirm the saved credentials.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 md:flex-row">
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
}
