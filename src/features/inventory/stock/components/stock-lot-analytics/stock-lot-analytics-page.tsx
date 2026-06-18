import { useMemo, useState } from 'react';
import { formatDateTime as formatDateTimeShared } from '@/lib/dates';
import { Link } from 'react-router-dom';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGetStockLotAnalyticsQuery } from '@/features/inventory/api';
import { useAuthStore } from '@/stores/auth-store';

export function StockLotAnalyticsPage() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const [daysAhead, setDaysAhead] = useState(30);
  const [issueLookbackDays, setIssueLookbackDays] = useState(90);

  const query = useMemo(
    () => ({
      companyId: companyId ?? '',
      daysAhead,
      issueLookbackDays,
    }),
    [companyId, daysAhead, issueLookbackDays],
  );

  const { data, isLoading } = useGetStockLotAnalyticsQuery(query, { skip: !companyId });

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Stock Lot Analytics</CardTitle>
            <div className="flex gap-2">
              <Link className="underline text-sm" to="/inventory/stock-lots">
                Back to lots
              </Link>
              <Link className="underline text-sm" to="/inventory/stock-lots/expiry-alerts">
                Expiry alerts
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-2">
                <span>Near-expiry window</span>
                <input
                  className="border rounded px-2 py-1 w-24"
                  type="number"
                  min={1}
                  max={180}
                  value={daysAhead}
                  onChange={(event) =>
                    setDaysAhead(Math.max(1, Math.min(180, Number(event.target.value) || 30)))
                  }
                />
              </label>
              <label className="flex items-center gap-2">
                <span>FEFO lookback</span>
                <input
                  className="border rounded px-2 py-1 w-24"
                  type="number"
                  min={1}
                  max={365}
                  value={issueLookbackDays}
                  onChange={(event) =>
                    setIssueLookbackDays(
                      Math.max(1, Math.min(365, Number(event.target.value) || 90)),
                    )
                  }
                />
              </label>
            </div>

            {isLoading ? (
              <p className="text-sm">Loading analytics...</p>
            ) : data ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
                  <div className="border rounded p-3">
                    Total lots: <strong>{data.totals.totalLots}</strong>
                  </div>
                  <div className="border rounded p-3">
                    On hand: <strong>{data.totals.totalOnHand}</strong>
                  </div>
                  <div className="border rounded p-3">
                    Reserved: <strong>{data.totals.totalReserved}</strong>
                  </div>
                  <div className="border rounded p-3">
                    Expired lots: <strong>{data.totals.expiredLots}</strong>
                  </div>
                  <div className="border rounded p-3">
                    Near expiry: <strong>{data.totals.nearExpiryLots}</strong>
                  </div>
                  <div className="border rounded p-3">
                    At-risk qty: <strong>{data.totals.atRiskQuantity}</strong>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Aging Buckets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bucket</TableHead>
                          <TableHead>Lots</TableHead>
                          <TableHead>Quantity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.agingBuckets.map((bucket) => (
                          <TableRow key={bucket.bucket}>
                            <TableCell>{bucket.bucket}</TableCell>
                            <TableCell>{bucket.lotCount}</TableCell>
                            <TableCell>{bucket.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">FEFO Compliance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                      <div className="border rounded p-3">
                        Evaluated issues: <strong>{data.fefoCompliance.evaluatedIssues}</strong>
                      </div>
                      <div className="border rounded p-3">
                        Compliant: <strong>{data.fefoCompliance.compliantIssues}</strong>
                      </div>
                      <div className="border rounded p-3">
                        Non-compliant: <strong>{data.fefoCompliance.nonCompliantIssues}</strong>
                      </div>
                      <div className="border rounded p-3">
                        Compliance: <strong>{data.fefoCompliance.complianceRatePct}%</strong>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Issued At</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Issued Batch</TableHead>
                          <TableHead>Issued Expiry</TableHead>
                          <TableHead>Expected Earliest</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.fefoCompliance.items.length ? (
                          data.fefoCompliance.items.map((item) => (
                            <TableRow key={item.movementId}>
                              <TableCell>
                                {item.issuedAt ? formatDateTimeShared(item.issuedAt) : 'N/A'}
                              </TableCell>
                              <TableCell>{item.productId}</TableCell>
                              <TableCell>{item.locationId}</TableCell>
                              <TableCell>{item.issuedLotBatchNumber}</TableCell>
                              <TableCell>
                                {item.issuedLotExpiryDate
                                  ? new Date(item.issuedLotExpiryDate).toLocaleDateString()
                                  : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {item.expectedEarliestExpiryDate
                                  ? new Date(item.expectedEarliestExpiryDate).toLocaleDateString()
                                  : 'N/A'}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6}>No non-compliant FEFO issues found.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            ) : (
              <p className="text-sm">No analytics data found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
