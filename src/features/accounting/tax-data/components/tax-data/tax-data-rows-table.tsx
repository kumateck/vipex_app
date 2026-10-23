import { memo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TAX_TABLE_COLUMNS } from '@/shared/tax-data';
import type { TaxDataRow } from '../../types';
import { taxDataMoney } from '../../utils';

type Props = {
  rows: TaxDataRow[];
  mode: 'records' | 'selection';
  disabled: boolean;
  versions: Map<string, string>;
  onAdd: (rows: TaxDataRow[]) => void;
  onRemove: (id: string) => void;
};
export const TaxDataRowsTable = memo(function TaxDataRowsTable(props: Props) {
  return (
    <Table className="tax-data-table">
      <caption className="sr-only">
        {props.mode === 'records'
          ? 'Matching parcel tax records'
          : 'Selected parcel tax export list'}
        . Monetary amounts are GHS.
      </caption>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          {TAX_TABLE_COLUMNS.map(([key, label]) => (
            <TableHead key={key}>{label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.rows.map((row) => (
          <TableRow key={row.parcelId}>
            <TableCell>
              {props.mode === 'records' ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={props.disabled || props.versions.get(row.parcelId) === row.version}
                  aria-label={`Add ${row.trackingCode} to export list`}
                  onClick={() => props.onAdd([row])}
                >
                  {props.versions.get(row.parcelId) === row.version
                    ? 'Added'
                    : props.versions.has(row.parcelId)
                      ? 'Update'
                      : 'Add'}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={props.disabled}
                  aria-label={`Remove ${row.trackingCode} from export list`}
                  onClick={() => props.onRemove(row.parcelId)}
                >
                  Remove
                </Button>
              )}
            </TableCell>
            {TAX_TABLE_COLUMNS.map(([key, , kind]) => (
              <TableCell
                key={key}
                className={kind === 'money' || kind === 'number' ? 'tabular-nums' : undefined}
              >
                {kind === 'money'
                  ? taxDataMoney(Number(row[key]))
                  : kind === 'boolean'
                    ? row[key]
                      ? 'Yes'
                      : 'No'
                    : String(row[key] || '—')}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
});
