import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useGetInventoryTaskQuery, useScanInventoryTaskMutation } from '@/features/inventory/api';

export function InventoryTaskDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data } = useGetInventoryTaskQuery(id, { skip: !id });
  const [scanCode, setScanCode] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [scanTask, { isLoading }] = useScanInventoryTaskMutation();

  if (!id) return null;

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <div className="rounded border p-4 space-y-1">
          <p className="text-sm font-medium">Task</p>
          <p>{data?.id ?? id}</p>
          <p className="text-sm text-muted-foreground">
            Type: {data?.taskType ?? '-'} | Status: {data?.status ?? '-'}
          </p>
          <p className="text-sm text-muted-foreground">
            Planned: {data?.plannedQuantity ?? '0'} | Processed: {data?.processedQuantity ?? '0'}
          </p>
        </div>

        <form
          className="rounded border p-4 space-y-3 max-w-xl"
          onSubmit={async (event) => {
            event.preventDefault();
            await scanTask({ taskId: id, body: { scanCode, quantity } }).unwrap();
            setScanCode('');
            setQuantity('1');
          }}
        >
          <p className="text-sm font-medium">Record Scan</p>
          <input
            className="h-9 w-full rounded border px-3"
            value={scanCode}
            onChange={(e) => setScanCode(e.target.value)}
            placeholder="Scan code"
            required
          />
          <input
            className="h-9 w-full rounded border px-3"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Quantity"
            required
          />
          <Button type="submit" disabled={isLoading}>
            Add Scan
          </Button>
        </form>

        <div className="rounded border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2">Scan Code</th>
                <th className="text-left p-2">Quantity</th>
                <th className="text-left p-2">Scanned At</th>
              </tr>
            </thead>
            <tbody>
              {(data?.scans ?? []).map((scan) => (
                <tr key={scan.id} className="border-b">
                  <td className="p-2">{scan.scanCode}</td>
                  <td className="p-2">{scan.quantity}</td>
                  <td className="p-2">{scan.scannedAt ?? '-'}</td>
                </tr>
              ))}
              {!data?.scans?.length ? (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={3}>
                    No scans yet.
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
