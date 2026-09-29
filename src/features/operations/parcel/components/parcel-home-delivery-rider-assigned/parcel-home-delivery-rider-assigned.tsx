import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { HomeDeliveryReceiptPrintController } from '../parcel-home-delivery-dispatch';
import { RiderAssignmentListPrintController } from './rider-assignment-list-print-controller';
import { useRiderAssignedColumns } from './use-rider-assigned-columns';
import { useRiderAssignedParcels, type RiderListMode } from './use-rider-assigned-parcels';
import { useRiderAssignmentListPrint } from './use-rider-assignment-list-print';
import { useRiderAssignedReceiptPrint } from './use-rider-assigned-receipt-print';

export function ParcelHomeDeliveryRiderAssigned() {
  const list = useRiderAssignedParcels();
  const receiptPrint = useRiderAssignedReceiptPrint();
  const listPrint = useRiderAssignmentListPrint();
  const columns = useRiderAssignedColumns(receiptPrint.onPrint, receiptPrint.isPrinting);

  return (
    <div className="w-full space-y-4 p-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Rider Assigned Parcels</CardTitle>
            <CardDescription>
              Select a rider to view assigned parcels (current, history, or all).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Select value={list.selectedRiderUserId} onValueChange={list.setSelectedRiderUserId}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select rider" />
                </SelectTrigger>
                <SelectContent>
                  {list.riderOptions.map((rider) => (
                    <SelectItem key={rider.id} value={rider.id}>
                      {rider.fullname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={list.mode}
                onValueChange={(value) => list.setMode(value as RiderListMode)}
              >
                <SelectTrigger className="w-full max-w-48">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                disabled={
                  !list.selectedRiderName ||
                  !list.isReady ||
                  list.rows.length === 0 ||
                  list.isLoading ||
                  Boolean(listPrint.payload)
                }
                onClick={() =>
                  listPrint.printList(list.selectedRiderName ?? '', list.mode, list.rows)
                }
              >
                Print List
              </Button>
            </div>
            <DataTable
              mode="client"
              data={list.rows}
              columns={columns}
              loading={list.isLoading}
              showSearch={false}
              enableVirtualization={false}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>
      {receiptPrint.printData ? (
        <HomeDeliveryReceiptPrintController
          key={receiptPrint.printData.trackingCode}
          receipt={receiptPrint.printData}
          onComplete={receiptPrint.onComplete}
        />
      ) : null}
      {listPrint.payload ? (
        <RiderAssignmentListPrintController
          payload={listPrint.payload}
          onComplete={listPrint.onComplete}
        />
      ) : null}
    </div>
  );
}
