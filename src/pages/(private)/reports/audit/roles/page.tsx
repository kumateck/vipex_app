import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/datatable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useListAuditLogsQuery, type EntityAuditLog } from '@/features/audit/api';
import { AuditReportActions } from '@/features/audit/components/audit-report-actions';
import { AuditKpiRow } from '@/features/audit/components/audit-kpi-row';
import { formatAuditDateTime } from '@/features/audit/report-utils';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ServerListQuery } from '@/services/rtk-query';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

function readPermissionCount(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object') return 0;
  const value = (metadata as Record<string, unknown>).permissionCount;
  return typeof value === 'number' ? value : 0;
}

export default function UserRolePermissionsAuditPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [query, setQuery] = useState<ServerListQuery>({
    page: 1,
    pageSize: 20,
    sort: [{ field: 'createdAt', direction: 'desc' }],
  });

  const { data, isLoading } = useListAuditLogsQuery(query);

  const columns = useMemo<ColumnDef<EntityAuditLog>[]>(
    () => [
      {
        id: 'createdAtLabel',
        header: 'Time',
        accessorFn: (row) => formatAuditDateTime(row.createdAt),
      },
      {
        id: 'actor',
        header: 'Changed By',
        accessorFn: (row) => row.actorUserName || row.actorUserId || '-',
      },
      {
        accessorKey: 'action',
        header: 'Role Action',
      },
      {
        accessorKey: 'entityId',
        header: 'Role ID',
        cell: ({ row }) => row.original.entityId || '-',
      },
      {
        id: 'permissionCount',
        header: 'Permissions',
        accessorFn: (row) => readPermissionCount(row.metadata),
      },
      {
        accessorKey: 'message',
        header: 'Message',
        cell: ({ row }) => row.original.message || '-',
      },
    ],
    [],
  );

  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>User Role Permissions</CardTitle>
            <CardDescription>
              Review role and permission audit events including create, update, delete, and
              permission changes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AuditKpiRow rows={data?.data ?? []} loading={isLoading} />

            <AuditReportActions
              filenamePrefix="audit-role-permissions"
              rows={data?.data ?? []}
              disabled={isLoading}
            />

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>From</Label>
                <DatePicker
                  date={from ? new Date(`${from}T00:00:00`) : undefined}
                  onDateChange={(date) => setFrom(date ? format(date, 'yyyy-MM-dd') : '')}
                  placeholder="Select start date"
                />
              </div>
              <div className="space-y-2">
                <Label>To</Label>
                <DatePicker
                  date={to ? new Date(`${to}T00:00:00`) : undefined}
                  onDateChange={(date) => setTo(date ? format(date, 'yyyy-MM-dd') : '')}
                  placeholder="Select end date"
                />
              </div>
            </div>

            <DataTable
              mode="server"
              data={data?.data ?? []}
              columns={columns}
              meta={data?.meta ?? EMPTY_META}
              loading={isLoading}
              serverFilters={{
                entityType: 'role',
                from: from ? `${from}T00:00:00.000` : undefined,
                to: to ? `${to}T23:59:59.999` : undefined,
              }}
              onRequestChange={setQuery}
              searchPlaceholder="Search role audit activity"
              enableVirtualization={false}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>
    </div>
  );
}
