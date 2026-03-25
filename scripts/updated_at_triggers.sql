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

-- Create/replace triggers for every base table that has an "updated_at" column
do $$
declare
  row_rec record;
begin
  for row_rec in
    select c.table_schema, c.table_name
    from information_schema.columns c
    join information_schema.tables tbl
      on tbl.table_schema = c.table_schema
     and tbl.table_name = c.table_name
    where c.table_schema = 'public'
      and c.column_name = 'updated_at'
      and tbl.table_type = 'BASE TABLE'
    order by c.table_name
  loop
    execute format(
      'drop trigger if exists trg_%I_updated_at on %I.%I;',
      row_rec.table_name,
      row_rec.table_schema,
      row_rec.table_name
    );

    execute format(
      'create trigger trg_%I_updated_at before update on %I.%I for each row execute function set_updated_at();',
      row_rec.table_name,
      row_rec.table_schema,
      row_rec.table_name
    );
  end loop;
end $$;
