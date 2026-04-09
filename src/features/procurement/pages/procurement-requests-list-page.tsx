import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { PermissionKeys } from '@/shared/permissions/constants';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import {
  useListPurchaseRequestsQuery,
  useListProcurementSupplierOptionsQuery,
} from '../api/procurement.api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

function statusLabel(status: number) {
  if (status === 1) return 'Submitted';
  if (status === 2) return 'Approved';
  if (status === 3) return 'Rejected';
  return 'Draft';
}

export function ProcurementRequestsListPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  const [status, setStatus] = useState<string>('__all__');
  const [supplierId, setSupplierId] = useState<string>('__all__');
  const [page, setPage] = useState(1);

  const { data: suppliers = [] } = useListProcurementSupplierOptionsQuery();
  const query = useMemo(
    () => ({
      page,
      pageSize: 20,
      search: search.trim() || undefined,
      filters: {
        status: status === '__all__' ? undefined : Number(status),
        supplierId: supplierId === '__all__' ? undefined : supplierId,
      },
    }),
    [page, search, status, supplierId],
  );

  const { data, isLoading } = useListPurchaseRequestsQuery(query);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Purchase Requests</CardTitle>
            <div className="flex gap-2">
              <PermissionGuard permissionKey={PermissionKeys.CanReadProcurement}>
                <Button asChild variant="outline">
                  <Link to="/procurement/demands">Demands</Link>
                </Button>
              </PermissionGuard>
              <PermissionGuard permissionKey={PermissionKeys.CanApproveProcurementPurchaseRequests}>
                <Button asChild variant="outline">
                  <Link to="/procurement/purchase-requests/approvals">Approvals</Link>
                </Button>
              </PermissionGuard>
              <PermissionGuard permissionKey={PermissionKeys.CanCreateProcurementPurchaseRequests}>
                <Button asChild>
                  <Link to="/procurement/purchase-requests/new">Create request</Link>
                </Button>
              </PermissionGuard>
              <PermissionGuard permissionKey={PermissionKeys.CanReadProcurement}>
                <Button asChild variant="outline">
                  <Link to="/procurement/supplier-quotes">Supplier Quotes</Link>
                </Button>
              </PermissionGuard>
              <PermissionGuard permissionKey={PermissionKeys.CanReadProcurement}>
                <Button asChild variant="outline">
                  <Link to="/procurement/purchase-orders">Purchase Orders</Link>
                </Button>
              </PermissionGuard>
              <PermissionGuard permissionKey={PermissionKeys.CanReadProcurement}>
                <Button asChild variant="outline">
                  <Link to="/procurement/goods-receipts">Goods Receipts</Link>
                </Button>
              </PermissionGuard>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Input
                placeholder="Search request no/title"
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  setPage(1);
                }}
              />
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All status</SelectItem>
                  <SelectItem value="1">Submitted</SelectItem>
                  <SelectItem value="2">Approved</SelectItem>
                  <SelectItem value="3">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={supplierId}
                onValueChange={(value) => {
                  setSupplierId(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All suppliers</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request no</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>Loading purchase requests...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.requestNo}</TableCell>
                      <TableCell>{row.title}</TableCell>
                      <TableCell>{row.supplierName ?? '-'}</TableCell>
                      <TableCell>{row.amountPsw.toLocaleString()}</TableCell>
                      <TableCell>{statusLabel(row.status)}</TableCell>
                      <TableCell>{row.requestedByName ?? '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>No purchase requests found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {meta?.page ?? 1} of {meta?.totalPages ?? 1}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={(meta?.page ?? 1) <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={(meta?.page ?? 1) >= (meta?.totalPages ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
