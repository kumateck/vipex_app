import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useListInventoryEventJournalQuery } from '@/features/inventory/api';
import { useAuthStore } from '@/stores/auth-store';

export function InventoryAuditJournalPage() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const { data = [], isLoading } = useListInventoryEventJournalQuery(
    { companyId: companyId ?? '' },
    { skip: !companyId },
  );

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <div className="flex justify-end">
          <Button asChild>
            <Link to="/inventory/audit/corrections/new">New Correction</Link>
          </Button>
        </div>
        <div className="rounded border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2">When</th>
                <th className="text-left p-2">Event</th>
                <th className="text-left p-2">Entity</th>
                <th className="text-left p-2">By</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="p-2">{row.createdAt ?? '-'}</td>
                  <td className="p-2">{row.eventType}</td>
                  <td className="p-2">
                    {row.entityType} / {row.entityId}
                  </td>
                  <td className="p-2">{row.createdBy}</td>
                </tr>
              ))}
              {!isLoading && !data.length ? (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={4}>
                    No events in journal.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </ScrollableWrapper>
  );
}
