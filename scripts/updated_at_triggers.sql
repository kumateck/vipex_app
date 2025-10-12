-- Suppress NOTICE messages like "does not exist, skipping"
set client_min_messages = warning;

-- Function and triggers to auto-update "updated_at" on row UPDATEs
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create/replace triggers for each table
do $$
declare
  t text;
  tables text[] := array[
    'companies',
    'branches',
    'customers',
    'cards',
    'customer_cards',
    'statuses',
    'roles',
    'users',
    'permissions',
    'role_permissions',
    'locations',
    'cashier_session_types',
    'cashier_sessions',
    'bookings',
    'consignments',
    'parcels',
    'deliveries'
  ];
begin
  foreach t in array tables
  loop
    -- Drop prior trigger (if any), then create fresh
    execute format('drop trigger if exists trg_%I_updated_at on %I;', t, t);
    execute format(
      'create trigger trg_%I_updated_at before update on %I
       for each row execute function set_updated_at();',
      t, t
    );
  end loop;
end $$;