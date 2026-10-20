-- Supports cashier-owned report rows and active-session summaries; no ownership data is changed.
CREATE INDEX IF NOT EXISTS "parcels_cashier_session_idx"
  ON "parcels" USING btree ("cashier_session_id");
