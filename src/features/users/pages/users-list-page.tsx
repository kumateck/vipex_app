import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { Button } from '@/components/ui/button';
import { PermissionKeys } from '@/shared/permissions/constants';
import { UsersTable } from '../components/users-table';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

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
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">{title}</h1>
            {headerLeft}
          </div>
          <PermissionGuard permissionKey={PermissionKeys.CanCreateUsers}>
            <Button asChild>
              <Link to="/users/new">New user</Link>
            </Button>
          </PermissionGuard>
        </div>
        <UsersTable status={status} statuses={statuses} />
      </div>
    </ScrollableWrapper>
  );
}
