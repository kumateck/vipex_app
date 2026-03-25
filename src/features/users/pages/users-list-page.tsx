import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UsersTable } from '../components/users-table';

interface UsersListPageProps {
  title?: string;
  status?: number | null;
  statuses?: string | null;
  headerLeft?: ReactNode;
}

export function UsersListPage({
  title = 'Users',
  status = null,
  statuses = null,
  headerLeft,
}: UsersListPageProps = {}) {
  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{title}</h1>
          {headerLeft}
        </div>
        <Button asChild>
          <Link to="/users/new">New user</Link>
        </Button>
      </div>
      <UsersTable status={status} statuses={statuses} />
    </div>
  );
}
