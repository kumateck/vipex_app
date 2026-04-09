ALTER TABLE stock_movements
  ADD COLUMN IF NOT EXISTS lot_id varchar(25);

ALTER TABLE stock_reservation_allocations
  ADD COLUMN IF NOT EXISTS source_lot_id varchar(25);

CREATE TABLE IF NOT EXISTS stock_lots (
  id varchar(25) PRIMARY KEY,
  company_id varchar(25) NOT NULL REFERENCES companies(id),
  product_id varchar(25) NOT NULL REFERENCES products(id),
  location_id varchar(25) NOT NULL REFERENCES inventory_locations(id),
  batch_number varchar(100) NOT NULL,
  supplier_batch_number varchar(100),
  received_at timestamp NOT NULL DEFAULT now(),
  manufactured_at timestamp,
  expiry_date timestamp,
  quantity_on_hand bigint NOT NULL DEFAULT 0,
  reserved_quantity bigint NOT NULL DEFAULT 0,
  status smallint NOT NULL DEFAULT 0,
  notes text,
  created_by varchar(25) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS stock_lots_product_location_batch_uq
  ON stock_lots (product_id, location_id, lower(batch_number));
CREATE INDEX IF NOT EXISTS stock_lots_company_idx ON stock_lots (company_id);
CREATE INDEX IF NOT EXISTS stock_lots_product_idx ON stock_lots (product_id);
CREATE INDEX IF NOT EXISTS stock_lots_location_idx ON stock_lots (location_id);
CREATE INDEX IF NOT EXISTS stock_lots_status_idx ON stock_lots (status);
CREATE INDEX IF NOT EXISTS stock_lots_expiry_idx ON stock_lots (expiry_date);
CREATE INDEX IF NOT EXISTS stock_lots_received_idx ON stock_lots (received_at);

CREATE TABLE IF NOT EXISTS stock_lot_movements (
  id varchar(25) PRIMARY KEY,
  company_id varchar(25) NOT NULL REFERENCES companies(id),
  lot_id varchar(25) NOT NULL REFERENCES stock_lots(id),
  product_id varchar(25) NOT NULL REFERENCES products(id),
  location_id varchar(25) NOT NULL REFERENCES inventory_locations(id),
  movement_type smallint NOT NULL,
  quantity bigint NOT NULL,
  reference_id varchar(25),
  reference_type varchar(50),
  notes text,
  created_by varchar(25) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_lot_movements_company_idx ON stock_lot_movements (company_id);
CREATE INDEX IF NOT EXISTS stock_lot_movements_lot_idx ON stock_lot_movements (lot_id);
CREATE INDEX IF NOT EXISTS stock_lot_movements_product_idx ON stock_lot_movements (product_id);
CREATE INDEX IF NOT EXISTS stock_lot_movements_location_idx ON stock_lot_movements (location_id);
CREATE INDEX IF NOT EXISTS stock_lot_movements_created_idx ON stock_lot_movements (created_at);
CREATE INDEX IF NOT EXISTS stock_lot_movements_reference_idx ON stock_lot_movements (reference_id);

CREATE INDEX IF NOT EXISTS stock_movements_lot_idx ON stock_movements (lot_id);
CREATE INDEX IF NOT EXISTS stock_reservation_allocations_source_lot_idx ON stock_reservation_allocations (source_lot_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'stock_movements_lot_fk'
  ) THEN
    ALTER TABLE stock_movements
      ADD CONSTRAINT stock_movements_lot_fk
      FOREIGN KEY (lot_id) REFERENCES stock_lots(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'stock_reservation_allocations_source_lot_fk'
  ) THEN
    ALTER TABLE stock_reservation_allocations
      ADD CONSTRAINT stock_reservation_allocations_source_lot_fk
      FOREIGN KEY (source_lot_id) REFERENCES stock_lots(id);
  END IF;
END $$;
