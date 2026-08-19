import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { formatDateTime } from '@/lib/dates';
import { ConsignmentReceivingStatus } from '@/db/schemas/enums';
import {
  useCloseConsignmentMutation,
  useGetConsignmentDetailQuery,
  useListConsignmentItemsQuery,
  useReceiveConsignmentItemMutation,
} from '../../api/parcel.api';
import { CloseWithExceptionsDialog } from './close-with-exceptions-dialog';

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return formatDateTime(date);
}

function extractErrorDetails(error: unknown) {
  if (typeof error === 'object' && error && 'data' in error) {
    const data = (
      error as {
        data?: { error?: { message?: string; details?: { missingParcelIds?: string[] } } };
      }
    ).data;
    return {
      message: data?.error?.message,
      missingParcelIds: data?.error?.details?.missingParcelIds,
    };
  }
  return { message: undefined, missingParcelIds: undefined };
}

export function ConsignmentReceivingSessionPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [missingCount, setMissingCount] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { data: consignment, refetch: refetchDetail } = useGetConsignmentDetailQuery(id, {
    skip: !id,
  });
  const {
    data: items = [],
    isLoading: isLoadingItems,
    refetch: refetchItems,
  } = useListConsignmentItemsQuery(id, { skip: !id });
  const [receiveConsignmentItem, { isLoading: isReceiving }] = useReceiveConsignmentItemMutation();
  const [closeConsignment, { isLoading: isClosing }] = useCloseConsignmentMutation();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScanSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = code.trim();
      if (!trimmed || !id) return;
      setCode('');

      try {
        const result = await receiveConsignmentItem({ consignmentId: id, code: trimmed }).unwrap();
        if (result.outcome === 'RECEIVED') {
          toast.success(`Received ${result.trackingCode} (${result.arrived} of ${result.total})`);
        } else if (result.outcome === 'ALREADY_RECEIVED') {
          toast.warning(
            `${result.trackingCode} was already received at ${formatDate(result.arrivedAt)}${
              result.arrivedByName ? ` by ${result.arrivedByName}` : ''
            }`,
          );
        } else if (result.outcome === 'NOT_DISPATCHED') {
          toast.error(
            `${result.trackingCode} hasn't been dispatched yet — it's still at ${
              result.sourceBranchName ?? 'the sending branch'
            } and hasn't been loaded onto a consignment.`,
          );
        } else {
          toast.error(
            `${result.trackingCode} does not belong to this consignment${
              result.belongsToConsignmentCode
                ? ` — it belongs to ${result.belongsToConsignmentCode}`
                : ''
            }`,
          );
        }
        await Promise.all([refetchDetail(), refetchItems()]);
      } catch (error) {
        const { message } = extractErrorDetails(error);
        toast.error(message || 'Failed to receive parcel');
      } finally {
        inputRef.current?.focus();
      }
    },
    [code, id, receiveConsignmentItem, refetchDetail, refetchItems],
  );

  const handleCloseClick = useCallback(async () => {
    if (!id) return;
    try {
      const result = await closeConsignment({ consignmentId: id }).unwrap();
      toast.success(
        result.status === ConsignmentReceivingStatus.CLOSED
          ? 'Consignment closed — all parcels received'
          : 'Consignment closed',
      );
      navigate('/reports/consignments/receiving');
    } catch (error) {
      const { message, missingParcelIds } = extractErrorDetails(error);
      if (missingParcelIds) {
        setMissingCount(missingParcelIds.length);
        setCloseDialogOpen(true);
        return;
      }
      toast.error(message || 'Failed to close consignment');
    }
  }, [closeConsignment, id, navigate]);

  const handleConfirmCloseWithExceptions = useCallback(
    async (reason: string) => {
      if (!id) return;
      try {
        const result = await closeConsignment({
          consignmentId: id,
          forceWithExceptions: true,
          exceptionReason: reason,
        }).unwrap();
        toast.success(
          `Consignment closed with ${result.missingParcelIds.length} missing parcel${
            result.missingParcelIds.length === 1 ? '' : 's'
          } flagged as discrepancies`,
        );
        setCloseDialogOpen(false);
        navigate('/reports/consignments/receiving');
      } catch (error) {
        const { message } = extractErrorDetails(error);
        toast.error(message || 'Failed to close consignment');
      }
    },
    [closeConsignment, id, navigate],
  );

  const isOpen = consignment?.status === ConsignmentReceivingStatus.OPEN;
  const arrived = consignment?.arrived ?? 0;
  const total = consignment?.total ?? 0;

  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Receive Consignment {consignment?.code ?? ''}</CardTitle>
                  <CardDescription>
                    Scan or enter each parcel's tracking/booking code to receive it against this
                    consignment's checklist.
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold tabular-nums">
                    {arrived} <span className="text-muted-foreground text-base">of {total}</span>
                  </p>
                  <p className="text-muted-foreground text-xs">arrived</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isOpen ? (
                <Badge variant={consignment?.closedWithExceptions ? 'destructive' : 'outline'}>
                  {consignment?.closedWithExceptions ? 'Closed with exceptions' : 'Closed'}
                </Badge>
              ) : null}

              <form className="flex items-center gap-2" onSubmit={handleScanSubmit}>
                <Input
                  ref={inputRef}
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Scan or type tracking / booking code"
                  className="h-11 text-base"
                  disabled={!isOpen || isReceiving}
                  autoFocus
                />
                <Button
                  type="submit"
                  className="h-11 px-6"
                  disabled={!isOpen || isReceiving || code.trim().length === 0}
                >
                  Receive
                </Button>
              </form>

              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant={arrived === total && total > 0 ? 'default' : 'outline'}
                  disabled={!isOpen || isClosing}
                  onClick={handleCloseClick}
                >
                  Close Consignment
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Checklist</CardTitle>
              <CardDescription>All parcels loaded into this consignment.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingItems ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : (
                <div className="divide-y rounded-md border">
                  {items.map((item) => (
                    <div
                      key={item.parcelId}
                      className="flex items-center justify-between gap-3 p-3 text-sm"
                    >
                      <div className="leading-tight">
                        <p className="font-medium">{item.trackingCode}</p>
                        <p className="text-muted-foreground text-xs">
                          {item.bookingCode} &middot; {item.receiverName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        {item.arrivedAt ? (
                          <div className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <div className="leading-tight">
                              <p className="text-xs">Arrived {formatDate(item.arrivedAt)}</p>
                              {item.arrivedByName ? (
                                <p className="text-muted-foreground text-xs">
                                  by {item.arrivedByName}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Circle className="h-4 w-4" />
                            <p className="text-xs">Pending</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 ? (
                    <p className="p-4 text-center text-muted-foreground text-sm">
                      No parcels in this consignment.
                    </p>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollableWrapper>

      <CloseWithExceptionsDialog
        open={closeDialogOpen}
        missingCount={missingCount}
        isSaving={isClosing}
        onOpenChange={setCloseDialogOpen}
        onConfirm={handleConfirmCloseWithExceptions}
      />
    </div>
  );
}
