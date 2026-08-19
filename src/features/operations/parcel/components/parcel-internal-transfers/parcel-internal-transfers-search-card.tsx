import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ParcelSearchRow } from '../../api/parcel.api';

type ParcelInternalTransfersSearchCardProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  agedOnly: boolean;
  onAgedOnlyChange: (value: boolean) => void;
  storageChargeAccruingOnly: boolean;
  onStorageChargeAccruingOnlyChange: (value: boolean) => void;
  onSearch: () => void;
  isSearching: boolean;
  rows: ParcelSearchRow[];
  columns: ColumnDef<ParcelSearchRow>[];
};

export function ParcelInternalTransfersSearchCard({
  searchTerm,
  onSearchTermChange,
  agedOnly,
  onAgedOnlyChange,
  storageChargeAccruingOnly,
  onStorageChargeAccruingOnlyChange,
  onSearch,
  isSearching,
  rows,
  columns,
}: ParcelInternalTransfersSearchCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Parcels</CardTitle>
        <CardDescription>
          Search parcels already assigned to this branch, then add them to the transfer list.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Booking code, receiver name, or phone"
          />
          <Button onClick={onSearch} disabled={isSearching}>
            Search
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="aged-only"
              checked={agedOnly}
              onCheckedChange={(value) => onAgedOnlyChange(Boolean(value))}
            />
            <Label htmlFor="aged-only" className="cursor-pointer">
              Aged only (received 6+ months)
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="charge-only"
              checked={storageChargeAccruingOnly}
              onCheckedChange={(value) => onStorageChargeAccruingOnlyChange(Boolean(value))}
            />
            <Label htmlFor="charge-only" className="cursor-pointer">
              Storage charge accruing
            </Label>
          </div>
        </div>

        <DataTable
          mode="client"
          data={rows}
          columns={columns}
          loading={isSearching}
          pageSizeOptions={[10, 20]}
        />
      </CardContent>
    </Card>
  );
}
