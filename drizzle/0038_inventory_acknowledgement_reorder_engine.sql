CREATE TABLE IF NOT EXISTS stock_transfer_acceptances (
  id varchar(25) PRIMARY KEY,
  transfer_id varchar(25) NOT NULL REFERENCES stock_transfers(id),
  accepted_quantity bigint NOT NULL,
  damaged_quantity bigint NOT NULL DEFAULT 0,
  missing_quantity bigint NOT NULL DEFAULT 0,
  notes text,
  acknowledged_by varchar(25) NOT NULL,
  acknowledged_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_transfer_acceptances_transfer_idx
  ON stock_transfer_acceptances (transfer_id);
CREATE INDEX IF NOT EXISTS stock_transfer_acceptances_acker_idx
  ON stock_transfer_acceptances (acknowledged_by);
CREATE INDEX IF NOT EXISTS stock_transfer_acceptances_ack_at_idx
  ON stock_transfer_acceptances (acknowledged_at);

CREATE TABLE IF NOT EXISTS stock_request_acknowledgements (
  id varchar(25) PRIMARY KEY,
  request_id varchar(25) NOT NULL REFERENCES stock_requests(id),
  request_line_id varchar(25) NOT NULL REFERENCES stock_request_lines(id),
  acknowledged_quantity bigint NOT NULL,
  notes text,
  acknowledged_by varchar(25) NOT NULL,
  acknowledged_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_request_acknowledgements_request_idx
  ON stock_request_acknowledgements (request_id);
CREATE INDEX IF NOT EXISTS stock_request_acknowledgements_line_idx
  ON stock_request_acknowledgements (request_line_id);
CREATE INDEX IF NOT EXISTS stock_request_acknowledgements_acker_idx
  ON stock_request_acknowledgements (acknowledged_by);
CREATE INDEX IF NOT EXISTS stock_request_acknowledgements_ack_at_idx
  ON stock_request_acknowledgements (acknowledged_at);
