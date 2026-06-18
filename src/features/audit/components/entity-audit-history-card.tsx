import { formatDateTime as formatDateTimeShared } from '@/lib/dates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetEntityAuditHistoryQuery } from '../api';

export function EntityAuditHistoryCard(props: {
  title: string;
  entityType: string;
  entityId?: string | null;
}) {
  const { data, isLoading } = useGetEntityAuditHistoryQuery(
    {
      entityType: props.entityType,
      entityId: props.entityId ?? '',
    },
    { skip: !props.entityId },
  );

  const rows = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!props.entityId ? (
          <div className="text-sm text-muted-foreground">Select a record to view history.</div>
        ) : isLoading ? (
          <div className="text-sm text-muted-foreground">Loading history...</div>
        ) : rows.length ? (
          rows.map((row) => (
            <div key={row.id} className="rounded-md border p-3 text-sm">
              <div className="font-medium">{row.action}</div>
              <div className="text-muted-foreground">{row.message ?? '-'}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {formatDateTimeShared(row.createdAt)}
                {row.actorUserId ? ` • ${row.actorUserId}` : ''}
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">No history found for this record.</div>
        )}
      </CardContent>
    </Card>
  );
}
