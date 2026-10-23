import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { useTaxData } from '../../hooks';
import { taxDataMoney } from '../../utils';

export function TaxDataCounts({ data }: { data: ReturnType<typeof useTaxData> }) {
  if (data.countsLoading) return <p role="status">Counting matching parcels…</p>;
  if (data.countsError)
    return (
      <p role="alert" className="text-sm text-destructive">
        Could not count tax data. Use Refresh or Count to try again.
      </p>
    );
  if (!data.counts) return null;
  const t = data.counts.totals;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Paid-amount counts</CardTitle>
        <CardDescription>
          Every principal-paid amount for the applied route, booking date, and confirmation filter.
          Select a count to get matching records.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t.parcels.toLocaleString()} paid parcels · {taxDataMoney(t.paidPrincipalPsw)} principal ·{' '}
          {taxDataMoney(t.taxTotalPsw)} tax
        </p>
        {data.counts.groups.length ? (
          <Table className="tax-data-table">
            <caption className="sr-only">Parcel count per recorded principal amount paid.</caption>
            <TableHeader>
              <TableRow>
                <TableHead>Amount paid</TableHead>
                <TableHead>Occurrences</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.counts.groups.map((group) => (
                <TableRow key={group.amountPsw}>
                  <TableCell className="tabular-nums">{taxDataMoney(group.amountPsw)}</TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      className="h-auto p-0 tabular-nums"
                      disabled={data.busy || data.draft.maxInvalid}
                      aria-label={`Get ${group.parcels} ${group.parcels === 1 ? 'parcel' : 'parcels'} paid ${taxDataMoney(group.amountPsw)}`}
                      onClick={() => data.loadAmount(group.amountPsw)}
                    >
                      {group.parcels}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">
            No paid parcel records match this date and scope.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
