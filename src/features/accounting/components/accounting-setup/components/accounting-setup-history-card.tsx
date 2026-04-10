import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDateTime } from '@/lib/date';
import { useGetEntityAuditHistoryQuery } from '@/features/audit/api';

function stringifyAuditMetadata(metadata: unknown) {
  if (metadata == null) return null;

  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return String(metadata);
  }
}

export function AccountingSetupHistoryCard({
  entityType,
  entityId,
  entityLabel,
}: {
  entityType: string;
  entityId: string;
  entityLabel: string;
}) {
  const { data, isFetching, isError } = useGetEntityAuditHistoryQuery(
    { entityType, entityId },
    { skip: !entityId },
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change History</CardTitle>
        <CardDescription>
          Review the audit trail for this {entityLabel.toLowerCase()} without leaving accounting
          setup.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isFetching ? (
          <p className="text-sm text-muted-foreground">Loading history...</p>
        ) : isError ? (
          <p className="text-sm text-destructive">
            Unable to load change history for this {entityLabel.toLowerCase()} right now.
          </p>
        ) : (data?.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">
            No setup changes have been recorded for this {entityLabel.toLowerCase()} yet.
          </p>
        ) : (
          <ScrollArea className="h-80 pr-4">
            <div className="space-y-4">
              {data?.data.map((entry) => {
                const metadata = stringifyAuditMetadata(entry.metadata);

                return (
                  <div key={entry.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{entry.action}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(entry.createdAt)}
                      </span>
                    </div>
                    {entry.message ? (
                      <p className="mt-2 text-sm font-medium">{entry.message}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Actor: {entry.actorUserId || 'System'}
                    </p>
                    {metadata ? (
                      <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap break-all">
                        {metadata}
                      </pre>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
