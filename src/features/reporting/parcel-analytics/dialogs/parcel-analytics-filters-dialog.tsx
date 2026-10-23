import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ParcelAnalyticsFilters } from '../components/parcel-analytics-filters';
import type { useParcelAnalytics } from '../hooks';

type Props = { analytics: ReturnType<typeof useParcelAnalytics> };

export function ParcelAnalyticsFiltersDialog({ analytics: a }: Props) {
  return (
    <Dialog open={a.filtersOpen} onOpenChange={a.setFiltersOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={a.isFetching}>
          Filters
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Parcel analytics filters</DialogTitle>
          <DialogDescription>
            Choose a booking period and scope, then apply to load analytics on the page. Head office
            can compare all branches; branch staff see their own parcels.
          </DialogDescription>
        </DialogHeader>
        <ParcelAnalyticsFilters analytics={a} />
        <DialogFooter>
          <Button variant="outline" onClick={() => a.setFiltersOpen(false)}>
            Cancel
          </Button>
          <Button onClick={a.apply} disabled={!a.canLoad || a.isFetching}>
            Apply filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
