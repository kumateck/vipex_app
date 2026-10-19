CREATE TABLE IF NOT EXISTS "cashier_session_delegates" (
  "id" varchar(25) PRIMARY KEY,
  "session_id" varchar(25) NOT NULL REFERENCES "cashier_sessions_enhanced"("id"),
  "user_id" varchar(25) NOT NULL REFERENCES "users"("id"),
  "assigned_by" varchar(25) NOT NULL REFERENCES "users"("id"),
  "assigned_at" timestamp NOT NULL DEFAULT now(),
  "revoked_at" timestamp
);
CREATE UNIQUE INDEX IF NOT EXISTS "cashier_session_delegates_session_user_uq"
  ON "cashier_session_delegates" ("session_id", "user_id");
CREATE INDEX IF NOT EXISTS "cashier_session_delegates_user_idx"
  ON "cashier_session_delegates" ("user_id");
