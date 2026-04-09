import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DailyCashMainFooterCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recorded Confirmations</CardTitle>
        <CardDescription>
          Use dedicated pages for Drafts, Approvals, and Recorded confirmations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          Navigate to `Daily Cash / Drafts`, `Daily Cash / Approvals`, and `Daily Cash / Recorded`
          from the Accounting menu.
        </div>
      </CardContent>
    </Card>
  );
}
