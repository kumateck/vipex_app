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

const RISK_OPTIONS = [
  { value: '__all__', label: 'All suspicious signals' },
  { value: 'override', label: 'Override activity' },
  { value: 'reject', label: 'Rejected actions' },
  { value: 'failed', label: 'Failed attempts' },
  { value: 'delete', label: 'Delete operations' },
  { value: 'suspicious', label: 'Explicit suspicious flags' },
];

function toSearchKeyword(mode: string) {
  if (mode === '__all__') return undefined;
  return mode;
}

function mapRiskFlag(row: EntityAuditLog) {
  const searchable = `${row.action} ${row.message ?? ''}`.toLowerCase();
  if (searchable.includes('override')) return 'Override';
  if (searchable.includes('reject')) return 'Rejected';
  if (searchable.includes('failed')) return 'Failed';
  if (searchable.includes('delete')) return 'Delete';
  if (searchable.includes('suspicious')) return 'Suspicious';
  return 'General';
}

export default function SuspiciousChangesAuditPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [riskMode, setRiskMode] = useState('__all__');
  const [request, setRequest] = useState<ServerListQuery>({
    page: 1,
    pageSize: 20,
    sort: [{ field: 'createdAt', direction: 'desc' }],
  });

  const query = useMemo<ServerListQuery>(() => {
    const keyword = toSearchKeyword(riskMode);
    if (!keyword) return request;
    const existing = (request.search ?? '').trim();
    return {
      ...request,
      search: existing ? `${existing} ${keyword}` : keyword,
    };
  }, [request, riskMode]);

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
      { accessorKey: 'action', header: 'Action' },
      {
        id: 'riskFlag',
        header: 'Risk Signal',
        accessorFn: (row) => mapRiskFlag(row),
      },
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
            <CardTitle>Suspicious Changes</CardTitle>
            <CardDescription>
              Monitor high-risk audit events such as overrides, rejects, failed attempts, and
              deletions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AuditKpiRow rows={data?.data ?? []} loading={isLoading} />

            <AuditReportActions
              filenamePrefix="audit-suspicious-changes"
              rows={data?.data ?? []}
              disabled={isLoading}
            />

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Signal Type</Label>
                <Select value={riskMode} onValueChange={setRiskMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="All suspicious signals" />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
                from: from ? `${from}T00:00:00.000` : undefined,
                to: to ? `${to}T23:59:59.999` : undefined,
              }}
              onRequestChange={setRequest}
              searchPlaceholder="Search action or message"
              enableVirtualization={false}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>
    </div>
  );
}
