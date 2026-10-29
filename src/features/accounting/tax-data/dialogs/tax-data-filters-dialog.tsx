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
import { TaxDataFilters } from '../components/tax-data-filters';
import type { useTaxData } from '../hooks';

export function TaxDataFiltersDialog({
  data,
  disabled,
}: {
  data: ReturnType<typeof useTaxData>;
  disabled: boolean;
}) {
  return (
    <Dialog open={data.draft.open} onOpenChange={data.draft.setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={data.busy || disabled}>
          Filters
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tax data filters</DialogTitle>
          <DialogDescription>
            Select a from-branch → to-branch route and booking date. Count lists paid amounts; Get
            data retrieves an exact amount up to your maximum occurrences. Results load on the page.
          </DialogDescription>
        </DialogHeader>
        <TaxDataFilters data={data} disabled={disabled} />
        <DialogFooter>
          <Button variant="outline" onClick={() => data.draft.setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
