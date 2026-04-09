import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useListInventoryTasksQuery,
  useUpdateInventoryTaskStatusMutation,
} from '@/features/inventory/api';
import { useAuthStore } from '@/stores/auth-store';

export function InventoryTasksPage() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const { data = [], isLoading } = useListInventoryTasksQuery(
    { companyId: companyId ?? '' },
    { skip: !companyId },
  );
  const [updateStatus, { isLoading: isUpdating }] = useUpdateInventoryTaskStatusMutation();

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <div className="flex justify-end">
          <Button asChild>
            <Link to="/inventory/tasks/new">New Task</Link>
          </Button>
        </div>
        <div className="rounded border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2">Task</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Planned</th>
                <th className="text-left p-2">Processed</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="p-2">{row.id}</td>
                  <td className="p-2">{row.taskType}</td>
                  <td className="p-2">{row.status}</td>
                  <td className="p-2">{row.plannedQuantity}</td>
                  <td className="p-2">{row.processedQuantity}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/inventory/tasks/view/${row.id}`}>View</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isUpdating}
                        onClick={() => void updateStatus({ id: row.id, status: 1 })}
                      >
                        Start
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isUpdating}
                        onClick={() => void updateStatus({ id: row.id, status: 2 })}
                      >
                        Complete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !data.length ? (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={6}>
                    No inventory tasks found.
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
