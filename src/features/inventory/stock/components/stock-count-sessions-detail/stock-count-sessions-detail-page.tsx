import { formatDateTime as formatDateTimeShared } from '@/lib/dates';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useApproveStockCountSessionMutation,
  useGetStockCountSessionQuery,
  useSubmitStockCountSessionMutation,
  useUpdateStockCountSessionLineMutation,
} from '@/features/inventory/api';

function statusLabel(status: number) {
  if (status === 0) return 'Draft';
  if (status === 1) return 'Submitted';
  if (status === 2) return 'Approved';
  if (status === 3) return 'Cancelled';
  return 'Unknown';
}

export function StockCountSessionsDetailPage() {
  const { id = '' } = useParams();
  const queryArg = useMemo(() => id, [id]);
  const { data, isLoading, refetch } = useGetStockCountSessionQuery(queryArg, { skip: !id });
  const [updateLine, { isLoading: updatingLine }] = useUpdateStockCountSessionLineMutation();
  const [submitSession, { isLoading: submitting }] = useSubmitStockCountSessionMutation();
  const [approveSession, { isLoading: approving }] = useApproveStockCountSessionMutation();
  const [countedDraftByLine, setCountedDraftByLine] = useState<Record<string, string>>({});
  const [reasonDraftByLine, setReasonDraftByLine] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data?.lines?.length) return;
    setCountedDraftByLine((prev) => {
      const next = { ...prev };
      for (const line of data.lines ?? []) {
        if (next[line.id] === undefined) next[line.id] = line.countedQuantity;
      }
      return next;
    });
    setReasonDraftByLine((prev) => {
      const next = { ...prev };
      for (const line of data.lines ?? []) {
        if (next[line.id] === undefined) next[line.id] = line.varianceReason ?? '';
      }
      return next;
    });
  }, [data?.lines]);

  const onQuickMatch = async (lineId: string, countedQuantity: string) => {
    try {
      await updateLine({
        sessionId: id,
        lineId,
        countedQuantity,
      }).unwrap();
      toast.success('Line updated');
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update line');
    }
  };

  const onManualUpdate = async (lineId: string, systemQuantity: string) => {
    const nextQty = countedDraftByLine[lineId] ?? '0';
    const parsed = Number(nextQty);
    if (!Number.isInteger(parsed) || parsed < 0) {
      toast.error('Counted quantity must be a non-negative integer');
      return;
    }
    const system = Number(systemQuantity);
    const reason = (reasonDraftByLine[lineId] ?? '').trim();
    if (parsed !== system && !reason) {
      toast.error('Variance reason is required when counted quantity differs from system');
      return;
    }
    try {
      await updateLine({
        sessionId: id,
        lineId,
        countedQuantity: String(parsed),
        varianceReason: reason || undefined,
      }).unwrap();
      toast.success('Line updated');
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update line');
    }
  };

  const onSubmitSession = async () => {
    try {
      await submitSession({ id }).unwrap();
      toast.success('Session submitted');
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit session');
    }
  };

  const onApproveSession = async () => {
    try {
      await approveSession({ id, applyAdjustments: true }).unwrap();
      toast.success('Session approved and reconciled');
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve session');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Stock Count Session</CardTitle>
            <Link className="underline text-sm" to="/inventory/stock-count-sessions">
              Back to sessions
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p>Loading session...</p>
            ) : data ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <p>
                    <strong>Session:</strong> {data.sessionNo}
                  </p>
                  <p>
                    <strong>Status:</strong> {statusLabel(data.status)}
                  </p>
                  <p>
                    <strong>Location:</strong> {data.locationId}
                  </p>
                  <p>
                    <strong>Created:</strong>{' '}
                    {data.createdAt ? formatDateTimeShared(data.createdAt) : 'N/A'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={onSubmitSession} disabled={submitting || data.status !== 0}>
                    Submit Session
                  </Button>
                  <Button onClick={onApproveSession} disabled={approving || data.status !== 1}>
                    Approve and Reconcile
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>System Qty</TableHead>
                      <TableHead>Counted Qty</TableHead>
                      <TableHead>Variance</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data.lines ?? []).length ? (
                      (data.lines ?? []).map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>{line.productId}</TableCell>
                          <TableCell>{line.systemQuantity}</TableCell>
                          <TableCell className="w-[180px]">
                            <Input
                              type="number"
                              min={0}
                              value={countedDraftByLine[line.id] ?? line.countedQuantity}
                              disabled={updatingLine || data.status !== 0}
                              onChange={(event) =>
                                setCountedDraftByLine((prev) => ({
                                  ...prev,
                                  [line.id]: event.target.value,
                                }))
                              }
                            />
                          </TableCell>
                          <TableCell>{line.varianceQuantity}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updatingLine || data.status !== 0}
                                onClick={() => onQuickMatch(line.id, line.systemQuantity)}
                              >
                                Match System
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updatingLine || data.status !== 0}
                                onClick={() => onManualUpdate(line.id, line.systemQuantity)}
                              >
                                Save Count
                              </Button>
                            </div>
                            <Input
                              className="mt-2"
                              placeholder="Variance reason (if required)"
                              value={reasonDraftByLine[line.id] ?? ''}
                              disabled={updatingLine || data.status !== 0}
                              onChange={(event) =>
                                setReasonDraftByLine((prev) => ({
                                  ...prev,
                                  [line.id]: event.target.value,
                                }))
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5}>No lines in this session.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </>
            ) : (
              <p>Session not found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
