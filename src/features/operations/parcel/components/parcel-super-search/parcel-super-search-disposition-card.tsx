import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ParcelDispositionActionType } from '@/db/schemas/enums';
import { useListWarehouseOptionsQuery } from '@/features/warehouses';
import ThrowErrorMessage from '@/lib/throw-error';
import {
  type ParcelDispositionActionRow,
  useRecordParcelDispositionActionMutation,
} from '../../api/parcel.api';
import { formatCurrency, formatParcelDate } from './utils';

type ParcelSuperSearchDispositionCardProps = {
  parcelId: string;
  companyId: string | null;
  destinationBranchId: string | null;
  dispositionActions: ParcelDispositionActionRow[];
};

export function ParcelSuperSearchDispositionCard({
  parcelId,
  companyId,
  destinationBranchId,
  dispositionActions,
}: ParcelSuperSearchDispositionCardProps) {
  const [notes, setNotes] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [recoveredAmount, setRecoveredAmount] = useState('');

  const { data: warehouseOptions = [] } = useListWarehouseOptionsQuery(
    {
      companyId: companyId ?? '',
      branchId: destinationBranchId ?? '',
      activeOnly: true,
    },
    { skip: !companyId || !destinationBranchId },
  );

  const [recordDispositionAction, { isLoading: isRecordingDispositionAction }] =
    useRecordParcelDispositionActionMutation();

  async function handleRecordDispositionAction(actionType: number) {
    try {
      await recordDispositionAction({
        id: parcelId,
        actionType,
        notes: notes.trim() || null,
        warehouseId:
          actionType === ParcelDispositionActionType.TRANSFERRED_TO_WAREHOUSE
            ? warehouseId || null
            : null,
        recoveredAmountCedis: recoveredAmount.trim() || null,
      }).unwrap();

      setNotes('');
      setRecoveredAmount('');
      if (actionType !== ParcelDispositionActionType.TRANSFERRED_TO_WAREHOUSE) {
        setWarehouseId('');
      }
    } catch (error) {
      ThrowErrorMessage(error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Aged Parcel Actions ({dispositionActions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="disposition-notes">Action Notes</Label>
            <Input
              id="disposition-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Reason, notice details, or decision context"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="disposition-recovery">Recovered Amount (GHS)</Label>
            <Input
              id="disposition-recovery"
              value={recoveredAmount}
              onChange={(event) => setRecoveredAmount(event.target.value)}
              placeholder="0.00"
              inputMode="decimal"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="disposition-warehouse">Warehouse (for transfer action)</Label>
          <select
            id="disposition-warehouse"
            value={warehouseId}
            onChange={(event) => setWarehouseId(event.target.value)}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Select warehouse</option>
            {warehouseOptions.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isRecordingDispositionAction}
            onClick={() =>
              void handleRecordDispositionAction(ParcelDispositionActionType.NOTICE_SENT)
            }
          >
            Notice Sent
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isRecordingDispositionAction}
            onClick={() =>
              void handleRecordDispositionAction(
                ParcelDispositionActionType.TRANSFERRED_TO_WAREHOUSE,
              )
            }
          >
            Transfer To Warehouse
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isRecordingDispositionAction}
            onClick={() => void handleRecordDispositionAction(ParcelDispositionActionType.SOLD)}
          >
            Mark Sold
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isRecordingDispositionAction}
            onClick={() =>
              void handleRecordDispositionAction(ParcelDispositionActionType.DESTROYED)
            }
          >
            Mark Destroyed
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isRecordingDispositionAction}
            onClick={() => void handleRecordDispositionAction(ParcelDispositionActionType.DONATED)}
          >
            Mark Donated
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isRecordingDispositionAction}
            onClick={() =>
              void handleRecordDispositionAction(ParcelDispositionActionType.WRITTEN_OFF)
            }
          >
            Write Off
          </Button>
        </div>

        <div className="space-y-2">
          {dispositionActions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No disposition actions recorded yet.</p>
          ) : (
            dispositionActions.map((action) => (
              <div key={action.id} className="space-y-1 rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">
                    {ParcelDispositionActionType[action.actionType] ??
                      `Action ${action.actionType}`}
                  </p>
                  <span className="text-muted-foreground text-xs">
                    {formatParcelDate(action.performedAt)}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">By: {action.performedByName ?? '-'}</p>
                {action.warehouseName ? (
                  <p className="text-muted-foreground text-xs">Warehouse: {action.warehouseName}</p>
                ) : null}
                {action.recoveredAmountPsw > 0 ? (
                  <p className="text-muted-foreground text-xs">
                    Recovered: {formatCurrency(action.recoveredAmountPsw)}
                  </p>
                ) : null}
                {action.notes ? <p className="text-xs">{action.notes}</p> : null}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
