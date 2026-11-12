import { CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { pickupOfficeLabel } from '@/shared/shipments/receiving-office';
import { ParcelHandoverNoteAction } from '@/features/operations/parcel-handover-note';
import { ViewParcelDetailsButton } from '@/features/operations/parcel-details';
import type { ConsignmentItemRow } from '../../api/parcel.api';
import { formatConsignmentTime } from './format-consignment-time';

export function ConsignmentReceivingChecklist({
  items,
  isLoadingItems,
}: {
  items: ConsignmentItemRow[];
  isLoadingItems: boolean;
}) {
  return (
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
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{item.bookingCode}</p>
                    <ParcelHandoverNoteAction
                      parcelId={item.parcelId}
                      hasHandoverNote={item.hasHandoverNote}
                      handoverNoteCritical={item.handoverNoteCritical}
                    />
                    <ViewParcelDetailsButton parcelId={item.parcelId} />
                  </div>
                  <p className="text-muted-foreground text-xs">{item.receiverName}</p>
                  {item.receivingOfficeName ? (
                    <p className="text-xs">
                      {pickupOfficeLabel(item.pickupLocationName, item.receivingOfficeName)}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 text-right">
                  {item.arrivedAt ? (
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <div className="leading-tight">
                        <p className="text-xs">Arrived {formatConsignmentTime(item.arrivedAt)}</p>
                        {item.arrivedByName ? (
                          <p className="text-muted-foreground text-xs">by {item.arrivedByName}</p>
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
  );
}
