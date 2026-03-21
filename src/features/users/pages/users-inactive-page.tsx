import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UsersListPage } from './users-list-page';

type InactiveFilterKey = 'all' | 'blocked' | 'suspended' | 'removed' | 'inactive';

const INACTIVE_STATUS_FILTERS: Record<InactiveFilterKey, { status?: number; statuses?: string; label: string }> = {
  all: { statuses: '2,3,4,5', label: 'All inactive statuses' },
  blocked: { status: 3, label: 'Blocked' },
  suspended: { status: 5, label: 'Suspended' },
  removed: { status: 2, label: 'Removed' },
  inactive: { status: 4, label: 'Inactive' },
};

export function UsersInactivePage() {
  const [selectedFilter, setSelectedFilter] = useState<InactiveFilterKey>('all');
  const activeFilter = useMemo(() => INACTIVE_STATUS_FILTERS[selectedFilter], [selectedFilter]);

  return (
    <UsersListPage
      title="Inactive Users"
      status={activeFilter.status ?? null}
      statuses={activeFilter.statuses ?? null}
      headerLeft={
        <div className="max-w-64">
          <Select value={selectedFilter} onValueChange={(value) => setSelectedFilter(value as InactiveFilterKey)}>
            <SelectTrigger>
              <SelectValue placeholder="Select inactive filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All inactive statuses</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="removed">Removed</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    />
  );
}
