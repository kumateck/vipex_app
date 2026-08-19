import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/datatable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { formatDateTime } from '@/lib/dates';
import { ConsignmentReceivingStatus } from '@/db/schemas/enums';
import { useAuthStore } from '@/stores/auth-store';
import {
  type IncomingConsignmentRow,
  useListIncomingConsignmentsQuery,
} from '../../api/parcel.api';

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return formatDateTime(date);
}

function statusBadge(row: IncomingConsignmentRow) {
  if (row.status === ConsignmentReceivingStatus.CLOSED) {
    return <Badge className="bg-emerald-500 hover:bg-emerald-500">Closed</Badge>;
  }
  if (row.status === ConsignmentReceivingStatus.CLOSED_WITH_EXCEPTIONS) {
    return <Badge variant="destructive">Closed with exceptions</Badge>;
  }
  return <Badge variant="outline">Open</Badge>;
}

export function IncomingConsignmentsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;

  const { data = [], isLoading } = useListIncomingConsignmentsQuery(
    { companyId, destinationId: branchId },
    { skip: !companyId || !branchId },
  );

  const columns = useMemo<ColumnDef<IncomingConsignmentRow>[]>(
    () => [
      {
        id: 'code',
        header: 'Consignment',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.code}</p>
            <p className="text-muted-foreground text-xs">
              From {row.original.sourceName} &middot; {formatDate(row.original.consignmentDate)}
            </p>
          </div>
        ),
      },
      {
        id: 'progress',
        header: 'Received',
        cell: ({ row }) => {
          const { arrived, total } = row.original;
          const complete = total > 0 && arrived === total;
          return (
            <div className="leading-tight">
              <p className={`font-medium ${complete ? 'text-emerald-600' : ''}`}>
                {arrived} of {total} arrived
              </p>
              {!complete && total > 0 ? (
                <p className="text-muted-foreground text-xs">{total - arrived} pending</p>
              ) : null}
            </div>
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => statusBadge(row.original),
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            size="sm"
            variant={
              row.original.status === ConsignmentReceivingStatus.OPEN ? 'default' : 'outline'
            }
            onClick={() => navigate(`/parcels/consignments/${row.original.id}/receive`)}
          >
            {row.original.status === ConsignmentReceivingStatus.OPEN ? 'Receive' : 'View'}
          </Button>
        ),
      },
    ],
    [navigate],
  );

  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Branch Receiving Manifest</CardTitle>
            <CardDescription>
              Consignments dispatched to your branch, with live arrival counts. Open a consignment
              to scan parcels against its checklist and close it once received.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              mode="client"
              data={data}
              columns={columns}
              loading={isLoading}
              showSearch={false}
              enableVirtualization={false}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>
    </div>
  );
}
