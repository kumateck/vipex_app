# DataTable

Reusable table component built with `shadcn/ui` + `@tanstack/react-table`.

Screen cells use the application-wide wrapping policy in `src/components/ui/table-content.css`.
Long content, unbroken words, nested single-line text, and clamped previews wrap without hiding
values; rows expand. Content is bounded to 24rem, with existing narrower location widths retained.
The same policy covers plain HTML tables. Calendar grids and print layouts are excluded.

## Modes

- `server`: uses backend pagination (`page`, `pageSize`, `sort`, `search`, `filters`) and expects `meta`.
- `client`: local pagination/filter/sort.
- `grid`: no pagination (plain list/grid table).

## Server Example

```tsx
import { DataTable, type ServerPaginatedData } from '@/components/datatable';
import type { PaginationRequestDto } from '@/server/types/pagination.types';

type UserFilters = { companyId?: string | null; roleId?: string | null };

function UsersTable() {
  const [rows, setRows] = useState<UserDto[]>([]);
  const [meta, setMeta] = useState({
    totalRecords: 0,
    totalPages: 1,
    page: 1,
    pageSize: 20,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(false);

  const fetchUsers = async (request: PaginationRequestDto<UserFilters>) => {
    setLoading(true);
    const res = await api.users.list(request);
    const payload = res.data as ServerPaginatedData<UserDto>;
    setRows(payload.data);
    setMeta(payload.meta);
    setLoading(false);
  };

  return (
    <DataTable
      mode="server"
      data={rows}
      columns={columns}
      meta={meta}
      loading={loading}
      serverFilters={{ companyId: 'cmp_001' }}
      onRequestChange={fetchUsers}
      searchPlaceholder="Search users..."
    />
  );
}
```

## Client Example

```tsx
<DataTable mode="client" data={rows} columns={columns} />
```

## Grid (No Pagination) Example

```tsx
<DataTable mode="grid" data={rows} columns={columns} />
```
