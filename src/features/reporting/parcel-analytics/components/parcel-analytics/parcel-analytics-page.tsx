import './parcel-analytics.css';
import { lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParcelAnalytics } from '../../hooks';
import { ParcelAnalyticsFiltersDialog } from '../../dialogs';
import { ParcelAnalyticsMetrics } from './parcel-analytics-metrics';
import { ParcelAnalyticsStatusTable } from './parcel-analytics-status-table';
import { ParcelAnalyticsBranches } from './parcel-analytics-branches';
import { ParcelAnalyticsDetails } from './parcel-analytics-details';

const ParcelAnalyticsCharts = lazy(() =>
  import('../parcel-analytics-charts').then((module) => ({
    default: module.ParcelAnalyticsCharts,
  })),
);

export function ParcelAnalyticsPage() {
  const a = useParcelAnalytics();
  if (!a.allowed)
    return (
      <p role="alert" className="p-4">
        You do not have permission to view parcel analytics.
      </p>
    );
  return (
    <div className="w-full space-y-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Parcel Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Explore parcel volumes, branch performance, and current statuses.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ParcelAnalyticsFiltersDialog analytics={a} />
          <Button
            variant="outline"
            onClick={a.exportCsv}
            disabled={!a.data || a.isFetching || a.isError}
          >
            Export CSV
          </Button>
        </div>
      </header>
      <ScrollableWrapper>
        <div className="parcel-analytics-content space-y-4">
          {a.isError ? (
            <p role="alert" className="text-sm text-destructive">
              Could not load parcel analytics. Open Filters and apply to try again.
            </p>
          ) : null}
          {a.isFetching ? (
            <p role="status" className="text-sm text-muted-foreground">
              Loading parcel analytics…
            </p>
          ) : null}
          {a.data && !a.isFetching && !a.isError ? (
            <>
              <div className="space-y-1 text-sm">
                <p className="font-medium">
                  {a.scopeName} · {a.data.filters.basis === 'source' ? 'Outgoing' : 'Incoming'} ·
                  Booked {a.data.filters.from} to {a.data.filters.to}
                </p>
                <p className="text-muted-foreground">
                  Current records as of {a.data.generatedAt.replace('T', ' ').slice(0, 19)} UTC.
                  Charges are booking values; receiver balances exclude principal moved to customer
                  credit.
                </p>
              </div>
              <ParcelAnalyticsMetrics report={a.data} />
              {!a.data.totals.parcels ? (
                <p className="rounded-md border border-dashed p-6 text-sm">
                  No parcels match these filters. Try another booking period, branch, or status.
                </p>
              ) : (
                <>
                  <Card>
                    <CardContent className="pt-6">
                      <Tabs defaultValue="status">
                        <TabsList className="h-auto flex-wrap" aria-label="Parcel analytics views">
                          <TabsTrigger value="status">Status breakdown</TabsTrigger>
                          <TabsTrigger value="branches">Branch comparison</TabsTrigger>
                          <TabsTrigger value="trends">Trends &amp; aging</TabsTrigger>
                        </TabsList>
                        <TabsContent value="status" className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Select a count to inspect parcels. Average booking age is measured from
                            creation, across all statuses.
                          </p>
                          <ParcelAnalyticsStatusTable
                            rows={a.data.statuses}
                            onSelect={(status) => a.setDrilldown({ status })}
                          />
                        </TabsContent>
                        <TabsContent value="branches" className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Each parcel belongs to one{' '}
                            {a.data.filters.basis === 'source' ? 'booking' : 'destination'} branch.
                            Scroll across for every status; select a count to inspect parcels.
                          </p>
                          <ParcelAnalyticsBranches
                            report={a.data}
                            onSelect={(branchId, status) =>
                              a.setDrilldown({
                                branchId,
                                ...(status === undefined ? {} : { status }),
                              })
                            }
                          />
                        </TabsContent>
                        <TabsContent value="trends">
                          <Suspense fallback={<p role="status">Loading charts…</p>}>
                            <ParcelAnalyticsCharts report={a.data} />
                          </Suspense>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                  {a.detailsQuery ? (
                    <div ref={a.detailsRef}>
                      <ParcelAnalyticsDetails
                        key={JSON.stringify(a.detailsQuery)}
                        query={a.detailsQuery}
                        onClose={() => a.setDrilldown(null)}
                      />
                    </div>
                  ) : null}
                </>
              )}
            </>
          ) : !a.applied ? (
            <p className="text-sm text-muted-foreground">
              Open Filters, select a booking period, and apply to load parcel analytics.
            </p>
          ) : null}
        </div>
      </ScrollableWrapper>
    </div>
  );
}
