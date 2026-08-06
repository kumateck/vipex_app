import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function BulkSmsCard({ canCreate, onCreate }: { canCreate: boolean; onCreate: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Bulk SMS
        </CardTitle>
        <CardDescription>
          Send a saved template or a new one-off message to customers, users, or employees.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" onClick={onCreate} disabled={!canCreate}>
          <Send className="h-4 w-4" />
          Create bulk SMS
        </Button>
        {!canCreate ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Campaign-creation permission is required to create bulk SMS messages.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
