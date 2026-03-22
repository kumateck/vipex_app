import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CustomerType, useListCustomersQuery } from '@/features/customers/api';

const PAGE_SIZE = 30;

export default function CustomersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  const query = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: search.trim() || undefined,
      filters: { includeDeleted: false },
      sort: [{ field: 'createdAt', direction: 'desc' as const }],
    }),
    [page, search],
  );

  const { data, isLoading, isFetching } = useListCustomersQuery(query);
  const customers = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Customers</h1>
          <p className="text-sm text-muted-foreground">Customer list with CRM profile access.</p>
        </div>
        <Button asChild>
          <Link to="/customers/new">
            <Plus className="size-4" />
            New customer
          </Link>
        </Button>
      </div>

      <Card className="h-[calc(100vh-11rem)] min-h-[28rem] flex flex-col overflow-hidden">
        <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
          <div className="border-b p-4">
            <Input
              placeholder="Search by name, phone, or email"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading customers...</p>
            ) : isFetching ? (
              <p className="text-sm text-muted-foreground">Updating customers...</p>
            ) : null}
            {!isLoading && customers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No customers found.</p>
            ) : null}

            {customers.map((customer) => (
              <Link
                key={customer.id}
                to={`/customers/${customer.id}`}
                className="block rounded-lg border p-3 transition hover:border-primary/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{customer.fullname}</p>
                  <Badge variant="outline">
                    {customer.customerType === CustomerType.Business ? 'Business' : 'Individual'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {customer.telephone || '-'} {customer.email ? `• ${customer.email}` : ''}
                </p>
                <div className="mt-2">
                  {customer.creditEligible ? (
                    <Badge>Credit Eligible</Badge>
                  ) : (
                    <Badge variant="secondary">No Credit</Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <div className="sticky bottom-0 z-10 flex items-center justify-between border-t bg-card/95 supports-backdrop-filter:backdrop-blur p-3">
            <p className="text-xs text-muted-foreground">
              Page {meta?.page ?? page} of {meta?.totalPages ?? 1} • {meta?.totalRecords ?? 0}{' '}
              records
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!meta?.hasPreviousPage && page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!meta?.hasNextPage}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
