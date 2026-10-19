import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useStorageClearanceCreate } from '../hooks';
import { StorageClearanceSearchResults } from './storage-clearance-search-results';
import { StorageClearanceCreateForm } from './storage-clearance-create-form';

export function StorageClearanceCreate() {
  const state = useStorageClearanceCreate();
  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Storage Fee Clearance</CardTitle>
          <CardDescription>
            Request clearance with a reason and optional evidence. Approval and final Finance
            execution follow on separate pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              state.runSearch();
            }}
          >
            <Input
              aria-label="Search parcel"
              value={state.search}
              onChange={(event) => state.setSearch(event.target.value)}
              placeholder="Booking, tracking, telephone, or receiver"
            />
            <Button
              type="submit"
              disabled={state.search.trim().length < 2 || state.result.isFetching}
            >
              Search
            </Button>
          </form>
          <StorageClearanceSearchResults state={state} />
          <StorageClearanceCreateForm state={state} />
        </CardContent>
      </Card>
    </div>
  );
}
