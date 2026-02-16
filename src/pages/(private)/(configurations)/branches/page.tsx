/**
 * Branch List View: fetches and displays all branches from GET /v1/branches/,
 * with loading skeleton, error state with retry, and optional associated locations.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';

/** Location shape returned by the API for each branch. */
type BranchLocation = { id: string; name: string };

/** Branch row shape matching GET /v1/branches/ list response. */
type BranchRow = {
  id: string;
  name: string;
  type: string;
  telephone: string | null;
  address: string | null;
  email: string | null;
  locations?: BranchLocation[];
};

/** Number of skeleton rows to show while loading. */
const SKELETON_ROWS = 5;
/** Number of table columns (must match header cells). */
const COLUMN_COUNT = 5;

const Branches = () => {
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Fetches branch list from API and updates state; used on mount and on retry. */
  const fetchBranches = () => {
    setError(null);
    setLoading(true);
    const token = useAuthStore.getState().accessToken;
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch('/v1/branches/?limit=50', { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load branches');
        return res.json();
      })
      .then((body: { data: BranchRow[] }) => {
        setBranches(body.data ?? []);
      })
      .catch(() => setError('Failed to load branches. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  /* Error state: show message and retry button. */
  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchBranches}>
          Retry
        </Button>
      </div>
    );
  }

  /* Main view: responsive table with loading skeleton or branch rows. */
  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link to="/branches/new">New branch</Link>
        </Button>
      </div>
      <div className="relative w-full overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              /* Loading: render placeholder rows with Skeleton in each cell. */
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: COLUMN_COUNT + 1 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full min-w-[60px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              /* Data: one row per branch; Location column shows names when returned by API. */
              branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell>{branch.name}</TableCell>
                  <TableCell>{branch.type}</TableCell>
                  <TableCell>{branch.address ?? '—'}</TableCell>
                  <TableCell>{branch.telephone ?? branch.email ?? '—'}</TableCell>
                  <TableCell>
                    {branch.locations?.length
                      ? branch.locations.map((loc) => loc.name).join(', ')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/branches/edit/${branch.id}`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Branches;
