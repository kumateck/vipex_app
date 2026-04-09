CREATE TABLE IF NOT EXISTS stock_count_sessions (
  id varchar(25) PRIMARY KEY,
  company_id varchar(25) NOT NULL REFERENCES companies(id),
  location_id varchar(25) NOT NULL REFERENCES inventory_locations(id),
  session_no varchar(60) NOT NULL,
  status smallint NOT NULL DEFAULT 0,
  notes text,
  submitted_by varchar(25),
  submitted_at timestamp,
  approved_by varchar(25),
  approved_at timestamp,
  cancelled_by varchar(25),
  cancelled_at timestamp,
  cancellation_reason text,
  created_by varchar(25) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS stock_count_sessions_company_no_uq
  ON stock_count_sessions (company_id, session_no);
CREATE INDEX IF NOT EXISTS stock_count_sessions_company_idx
  ON stock_count_sessions (company_id);
CREATE INDEX IF NOT EXISTS stock_count_sessions_location_idx
  ON stock_count_sessions (location_id);
CREATE INDEX IF NOT EXISTS stock_count_sessions_status_idx
  ON stock_count_sessions (status);
CREATE INDEX IF NOT EXISTS stock_count_sessions_created_idx
  ON stock_count_sessions (created_at);

CREATE TABLE IF NOT EXISTS stock_count_session_lines (
  id varchar(25) PRIMARY KEY,
  session_id varchar(25) NOT NULL REFERENCES stock_count_sessions(id),
  product_id varchar(25) NOT NULL REFERENCES products(id),
  system_quantity bigint NOT NULL DEFAULT 0,
  counted_quantity bigint NOT NULL DEFAULT 0,
  variance_quantity bigint NOT NULL DEFAULT 0,
  variance_reason text,
  adjustment_movement_id varchar(25),
  counted_by varchar(25),
  counted_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS stock_count_session_lines_session_product_uq
  ON stock_count_session_lines (session_id, product_id);
CREATE INDEX IF NOT EXISTS stock_count_session_lines_session_idx
  ON stock_count_session_lines (session_id);
CREATE INDEX IF NOT EXISTS stock_count_session_lines_product_idx
  ON stock_count_session_lines (product_id);
CREATE INDEX IF NOT EXISTS stock_count_session_lines_variance_idx
  ON stock_count_session_lines (variance_quantity);
