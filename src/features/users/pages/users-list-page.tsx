import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UsersTable } from '../components/users-table';

export function UsersListPage() {
  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link to="/users/new">New user</Link>
        </Button>
      </div>
      <UsersTable />
    </div>
  );
}
