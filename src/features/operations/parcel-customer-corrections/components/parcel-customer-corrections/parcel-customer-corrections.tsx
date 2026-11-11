import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useCorrectionLookup } from '../../hooks';
import { CorrectionParcel } from '../correction-parcel';

const permissions = [
  PermissionKeys.CanCorrectParcelCustomers,
  PermissionKeys.CanOverrideParcelCustomerDetails,
];

export function ParcelCustomerCorrections() {
  const lookup = useCorrectionLookup();
  return (
    <PermissionGuard
      permissionKey={permissions}
      mode="any"
      fallback={<p role="alert">Customer correction permission is required.</p>}
    >
      <div className="w-full space-y-4 p-4">
        <ScrollableWrapper>
          <Card className="mx-auto w-full max-w-3xl">
            <CardHeader>
              <CardTitle>Parcel Customer Corrections</CardTitle>
              <CardDescription>
                Find a parcel by booking code to correct customer details before handover or
                delivery confirmation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form className="space-y-2" onSubmit={lookup.find}>
                <Label htmlFor="correction-booking-code">Booking code</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="correction-booking-code"
                    value={lookup.bookingCode}
                    autoComplete="off"
                    maxLength={255}
                    placeholder="Enter booking code"
                    required
                    onChange={(event) => lookup.changeCode(event.target.value)}
                  />
                  <Button type="submit" disabled={lookup.isFetching || !lookup.bookingCode.trim()}>
                    {lookup.isFetching ? 'Finding parcel…' : 'Find parcel'}
                  </Button>
                </div>
              </form>
              {lookup.error ? (
                <p role="alert" className="text-sm text-destructive">
                  {lookup.error}
                </p>
              ) : null}
              {lookup.parcels.length > 1 ? (
                <fieldset className="space-y-2">
                  <legend className="mb-2 text-sm font-medium">
                    Select the parcel under this booking
                  </legend>
                  {lookup.parcels.map((parcel) => (
                    <label
                      key={parcel.id}
                      className="flex items-center gap-3 rounded-md border p-3 text-sm"
                    >
                      <input
                        type="radio"
                        name="correction-parcel"
                        checked={lookup.selectedId === parcel.id}
                        onChange={() => lookup.setSelectedId(parcel.id)}
                        className="accent-primary"
                      />
                      <span className="break-all">
                        {parcel.trackingCode} · {parcel.parties.receiver?.recordedName}
                      </span>
                    </label>
                  ))}
                </fieldset>
              ) : null}
              {lookup.selected ? (
                <CorrectionParcel
                  key={lookup.selected.id}
                  parcel={lookup.selected}
                  onSaved={lookup.saved}
                />
              ) : null}
            </CardContent>
          </Card>
        </ScrollableWrapper>
      </div>
    </PermissionGuard>
  );
}
