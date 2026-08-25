import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SelfServiceDraft } from '../api/self-service-agent.api';

export function SelfServiceDraftSummaryCard({ draft }: { draft: SelfServiceDraft }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Declared</CardTitle>
        <CardDescription>Submitted by the customer through the self-service link.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Sender</p>
          <p className="font-medium">{draft.senderFullname}</p>
          <p className="text-sm text-muted-foreground">
            {draft.senderPhone}
            {draft.senderPhone2 ? ` / ${draft.senderPhone2}` : ''}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Receiver</p>
          <p className="font-medium">{draft.receiverFullname}</p>
          <p className="text-sm text-muted-foreground">
            {draft.receiverPhone}
            {draft.receiverPhone2 ? ` / ${draft.receiverPhone2}` : ''}
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs text-muted-foreground">Parcel Content</p>
          <p className="text-sm">{draft.parcelContent}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Declared Value</p>
          <p className="text-sm">GH₵{(draft.parcelValuePsw / 100).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Call Sender Before Delivery</p>
          <p className="text-sm">{draft.callSender ? 'Yes' : 'No'}</p>
        </div>
      </CardContent>
    </Card>
  );
}
