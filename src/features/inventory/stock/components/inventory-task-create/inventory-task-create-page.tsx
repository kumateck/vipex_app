import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useCreateInventoryTaskMutation } from '@/features/inventory/api';

export function InventoryTaskCreatePage() {
  const navigate = useNavigate();
  const [createTask, { isLoading }] = useCreateInventoryTaskMutation();
  const [taskType, setTaskType] = useState('1');
  const [productId, setProductId] = useState('');
  const [fromLocationId, setFromLocationId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [plannedQuantity, setPlannedQuantity] = useState('1');
  const [notes, setNotes] = useState('');

  return (
    <ScrollableWrapper>
      <form
        className="w-full p-4 max-w-xl space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const created = await createTask({
            taskType: Number(taskType),
            productId: productId || null,
            fromLocationId: fromLocationId || null,
            toLocationId: toLocationId || null,
            plannedQuantity,
            notes: notes || undefined,
          }).unwrap();
          navigate(`/inventory/tasks/view/${created.id}`);
        }}
      >
        <div className="space-y-1">
          <p className="text-sm font-medium">Task Type</p>
          <input
            className="h-9 w-full rounded border px-3"
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Product ID</p>
          <input
            className="h-9 w-full rounded border px-3"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">From Location ID</p>
          <input
            className="h-9 w-full rounded border px-3"
            value={fromLocationId}
            onChange={(e) => setFromLocationId(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">To Location ID</p>
          <input
            className="h-9 w-full rounded border px-3"
            value={toLocationId}
            onChange={(e) => setToLocationId(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Planned Quantity</p>
          <input
            className="h-9 w-full rounded border px-3"
            value={plannedQuantity}
            onChange={(e) => setPlannedQuantity(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Notes</p>
          <textarea
            className="min-h-24 w-full rounded border p-3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/inventory/tasks')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            Create Task
          </Button>
        </div>
      </form>
    </ScrollableWrapper>
  );
}
