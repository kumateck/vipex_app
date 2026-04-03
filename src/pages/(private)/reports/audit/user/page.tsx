import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/datatable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useListAuditLogsQuery, type EntityAuditLog } from '@/features/audit/api';
import { AuditReportActions } from '@/features/audit/components/audit-report-actions';
import { AuditKpiRow } from '@/features/audit/components/audit-kpi-row';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ServerListQuery } from '@/services/rtk-query';
import { formatAuditDateTime } from '@/features/audit/report-utils';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export default function AuditTrailByUserPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [actorUserId, setActorUserId] = useState('__all__');
  const [query, setQuery] = useState<ServerListQuery>({
    page: 1,
    pageSize: 20,
    sort: [{ field: 'createdAt', direction: 'desc' }],
  });

  const { data: userOptions = [] } = useListUserOptionsQuery();
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
        header: 'User',
        accessorFn: (row) => row.actorUserName || row.actorUserId || '-',
      },
      { accessorKey: 'action', header: 'Action' },
      { accessorKey: 'entityType', header: 'Module' },
      {
        accessorKey: 'entityId',
        header: 'Entity ID',
        cell: ({ row }) => row.original.entityId || '-',
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
            <CardTitle>Audit Trail by User</CardTitle>
            <CardDescription>
              Review user-level audit activity across modules, actions, and affected records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AuditKpiRow rows={data?.data ?? []} loading={isLoading} />

            <AuditReportActions
              filenamePrefix="audit-trail-by-user"
              rows={data?.data ?? []}
              disabled={isLoading}
            />

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>User</Label>
                <Select value={actorUserId} onValueChange={setActorUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All users</SelectItem>
                    {userOptions.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.fullname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                actorUserId: actorUserId !== '__all__' ? actorUserId : undefined,
                from: from ? `${from}T00:00:00.000` : undefined,
                to: to ? `${to}T23:59:59.999` : undefined,
              }}
              onRequestChange={setQuery}
              searchPlaceholder="Search action, module, or message"
              enableVirtualization={false}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>
    </div>
  );
}
