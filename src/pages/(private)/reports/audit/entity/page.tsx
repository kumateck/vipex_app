import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/datatable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
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

const MODULE_OPTIONS = [
  { label: 'All modules', value: '__all__' },
  { label: 'Accounting', value: 'accounting' },
  { label: 'Branch', value: 'branch' },
  { label: 'Cashier', value: 'cashier' },
  { label: 'Customer', value: 'customer' },
  { label: 'Employee', value: 'employee' },
  { label: 'Fleet', value: 'fleet' },
  { label: 'Leave', value: 'leave' },
  { label: 'Notification', value: 'notification' },
  { label: 'Parcel', value: 'parcel' },
  { label: 'Payroll', value: 'payroll' },
  { label: 'Procurement', value: 'procurement' },
  { label: 'Reconciliation', value: 'reconciliation' },
  { label: 'Role', value: 'role' },
  { label: 'Upload', value: 'upload' },
  { label: 'Warehouse', value: 'warehouse' },
];

export default function AuditTrailByEntityPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [entityType, setEntityType] = useState('__all__');
  const [entityId, setEntityId] = useState('');
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
        accessorKey: 'entityType',
        header: 'Module',
      },
      {
        accessorKey: 'entityId',
        header: 'Entity ID',
        cell: ({ row }) => row.original.entityId || '-',
      },
      { accessorKey: 'action', header: 'Action' },
      {
        id: 'actor',
        header: 'User',
        accessorFn: (row) => row.actorUserName || row.actorUserId || '-',
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
            <CardTitle>Audit Trail by Entity</CardTitle>
            <CardDescription>
              Investigate all audit actions performed against a specific entity record.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AuditKpiRow rows={data?.data ?? []} loading={isLoading} />

            <AuditReportActions
              filenamePrefix="audit-trail-by-entity"
              rows={data?.data ?? []}
              disabled={isLoading}
            />

            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Module</Label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All modules" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Entity ID</Label>
                <Input
                  value={entityId}
                  onChange={(event) => setEntityId(event.target.value)}
                  placeholder="Enter entity ID"
                />
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
                entityType: entityType !== '__all__' ? entityType : undefined,
                entityId: entityId.trim() || undefined,
                from: from ? `${from}T00:00:00.000` : undefined,
                to: to ? `${to}T23:59:59.999` : undefined,
              }}
              onRequestChange={setQuery}
              searchPlaceholder="Search action, message, or entity type"
              enableVirtualization={false}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>
    </div>
  );
}
