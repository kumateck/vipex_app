-- Zero-charge proposals do not alter parcel balances until independently approved.
CREATE TABLE parcel_charge_corrections (
  id varchar(25) PRIMARY KEY,
  company_id varchar(25) NOT NULL REFERENCES companies(id),
  parcel_id varchar(25) NOT NULL REFERENCES parcels(id),
  customer_id varchar(25) NOT NULL REFERENCES customers(id),
  original_method smallint NOT NULL,
  charge_psw bigint NOT NULL CONSTRAINT parcel_charge_corrections_amount_check CHECK (charge_psw > 0 AND charge_psw <= 10000000),
  reason varchar(500) NOT NULL,
  status smallint NOT NULL DEFAULT 0 CONSTRAINT parcel_charge_corrections_status_check CHECK (status IN (0, 1, 2)),
  requested_by varchar(25) NOT NULL REFERENCES users(id),
  requested_at timestamp NOT NULL DEFAULT now(),
  reviewed_by varchar(25) REFERENCES users(id),
  reviewed_at timestamp,
  review_note varchar(500),
  CONSTRAINT parcel_charge_corrections_review_check CHECK ((status = 0 AND reviewed_by IS NULL AND reviewed_at IS NULL)
    OR (status IN (1, 2) AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL AND reviewed_by <> requested_by))
);
--> statement-breakpoint
CREATE INDEX parcel_charge_corrections_company_status_idx
  ON parcel_charge_corrections (company_id, status, requested_at);
--> statement-breakpoint
CREATE INDEX parcel_charge_corrections_parcel_idx ON parcel_charge_corrections (parcel_id);
--> statement-breakpoint
CREATE UNIQUE INDEX parcel_charge_corrections_pending_uq ON parcel_charge_corrections (parcel_id) WHERE status = 0;
