import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { useShelfPickupReassignmentForm } from '../hooks';
import type { ShelfPickupParcel, ShelfPickupScope } from '../types';

export function ShelfPickupReassignmentForm({
  parcel,
  scope,
  onDone,
}: {
  parcel: ShelfPickupParcel;
  scope: ShelfPickupScope;
  onDone: () => void;
}) {
  const state = useShelfPickupReassignmentForm(parcel, scope, onDone);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Shelf Picker</CardTitle>
        <CardDescription>
          Choose the staff member who will pick this parcel from the shelf.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void state.save();
          }}
        >
          <div className="rounded-md border p-3 text-sm space-y-1">
            <p>
              <strong>Booking:</strong> {parcel.bookingCode}
            </p>
            <p>
              <strong>Receiver:</strong> {parcel.receiverName ?? '-'}
            </p>
            <p>
              <strong>Current shelf picker:</strong> {parcel.pickerStaffName ?? 'Assigned staff'}
            </p>
          </div>
          <Label htmlFor="replacement-shelf-picker">Replacement Shelf Picker</Label>
          <Select
            value={state.staffId}
            onValueChange={state.setStaffId}
            disabled={state.isSaving || state.staff.isFetching}
          >
            <SelectTrigger id="replacement-shelf-picker">
              <SelectValue placeholder="Select replacement staff" />
            </SelectTrigger>
            <SelectContent>
              {(state.staff.currentData ?? []).map((staff) => (
                <SelectItem key={staff.id} value={staff.id}>
                  {staff.fullname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {scope.locationId
              ? 'Only active staff assigned to your location and branch are shown.'
              : 'Only active staff at your branch are shown.'}
          </p>
          {state.staff.isFetching ? <p>Loading staff…</p> : null}
          {state.staff.isError ? (
            <p role="alert" className="text-destructive">
              Unable to load staff.{' '}
              <Button type="button" variant="outline" onClick={() => void state.staff.refetch()}>
                Retry
              </Button>
            </p>
          ) : null}
          {!state.staff.isFetching && !state.staff.isError && !state.staff.currentData?.length ? (
            <p>No active staff are available for reassignment.</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={state.isSaving} onClick={onDone}>
              Back to Parcels
            </Button>
            <Button type="submit" disabled={!state.canSave}>
              {state.isSaving ? 'Reassigning…' : 'Save Reassignment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
