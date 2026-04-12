import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useConvertProcurementDemandsToPurchaseRequestsMutation,
  useListProcurementDemandsQuery,
  useListProcurementSupplierOptionsQuery,
} from '../../api/procurement.api';

function demandStatusLabel(status: number) {
  if (status === 0) return 'Open';
  if (status === 1) return 'Consolidated';
  if (status === 2) return 'Converted to PR';
  if (status === 3) return 'Cancelled';
  if (status === 4) return 'Approved';
  return 'Unknown';
}

function urgencyLabel(urgency: number) {
  if (urgency === 0) return 'Low';
  if (urgency === 1) return 'Normal';
  if (urgency === 2) return 'High';
  if (urgency === 3) return 'Critical';
  return 'Unknown';
}

export function ProcurementDemandsListPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('__all__');
  const [sourceModule, setSourceModule] = useState<string>('__all__');
  const [supplierId, setSupplierId] = useState<string>('__none__');
  const [selectedDemandIds, setSelectedDemandIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  const query = useMemo(
    () => ({
      page,
      pageSize: 20,
      search: search.trim() || undefined,
      filters: {
        status: status === '__all__' ? undefined : Number(status),
        sourceModule: sourceModule === '__all__' ? undefined : sourceModule,
      },
    }),
    [page, search, status, sourceModule],
  );

  const { data, isLoading } = useListProcurementDemandsQuery(query);
  const { data: suppliers = [] } = useListProcurementSupplierOptionsQuery();
  const [convertDemands, { isLoading: converting }] =
    useConvertProcurementDemandsToPurchaseRequestsMutation();
  const rows = data?.data ?? [];
  const meta = data?.meta;
  const openRows = rows.filter((row) => row.status === 0);

  const toggleSelected = (id: string) => {
    setSelectedDemandIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAllOpenOnPage = () => {
    const openIds = openRows.map((row) => row.id);
    const allSelected = openIds.length > 0 && openIds.every((id) => selectedDemandIds.includes(id));
    if (allSelected) {
      setSelectedDemandIds((prev) => prev.filter((id) => !openIds.includes(id)));
      return;
    }
    setSelectedDemandIds((prev) => [...new Set([...prev, ...openIds])]);
  };

  const onConvertSelected = async () => {
    if (!selectedDemandIds.length) {
      toast.error('Select at least one open demand');
      return;
    }
    try {
      const result = await convertDemands({
        demandIds: selectedDemandIds,
        supplierId: supplierId === '__none__' ? null : supplierId,
      }).unwrap();
      toast.success(`Converted ${result.converted} demand(s) to purchase request(s).`);
      setSelectedDemandIds([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to convert demands');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Procurement Demands</CardTitle>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/procurement/demands/approvals">Demand Approvals</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/procurement/demands/consolidations">Consolidations</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/procurement/fleet-policies">Fleet Policy Rules</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/procurement/demands/fleet-low-stock">Fleet Low-Stock Intake</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/procurement/demands/inventory-low-stock">
                  Inventory Low-Stock Intake
                </Link>
              </Button>
              <Button asChild>
                <Link to="/procurement/demands/new">Create demand</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Input
                placeholder="Search demand no/item"
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
                  <SelectItem value="0">Open</SelectItem>
                  <SelectItem value="1">Consolidated</SelectItem>
                  <SelectItem value="2">Converted</SelectItem>
                  <SelectItem value="3">Cancelled</SelectItem>
                  <SelectItem value="4">Approved</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sourceModule}
                onValueChange={(value) => {
                  setSourceModule(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All modules</SelectItem>
                  <SelectItem value="fleet_transport">Fleet Transport</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional supplier for conversion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No supplier</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={toggleSelectAllOpenOnPage}>
                Select All Open (Page)
              </Button>
              <Button
                onClick={onConvertSelected}
                disabled={selectedDemandIds.length === 0 || converting}
              >
                Convert Selected to PRs
              </Button>
              <span className="text-sm text-muted-foreground">
                Selected: {selectedDemandIds.length}
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Select</TableHead>
                  <TableHead>Demand No</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Estimated Total</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8}>Loading demands...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedDemandIds.includes(row.id)}
                          onChange={() => toggleSelected(row.id)}
                          disabled={row.status !== 0}
                        />
                      </TableCell>
                      <TableCell>{row.demandNo}</TableCell>
                      <TableCell>
                        {row.itemCode} - {row.itemName}
                      </TableCell>
                      <TableCell>
                        {row.quantity} {row.unit}
                      </TableCell>
                      <TableCell>{row.estimatedTotalPsw.toLocaleString()}</TableCell>
                      <TableCell>{urgencyLabel(row.urgency)}</TableCell>
                      <TableCell>{demandStatusLabel(row.status)}</TableCell>
                      <TableCell>{row.sourceModule}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8}>No demands found.</TableCell>
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
