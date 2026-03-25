CREATE INDEX "users_company_idx" ON "users" USING btree ("company_id");
CREATE UNIQUE INDEX "users_company_lower_email_uq" ON "users" USING btree ("company_id", lower("email"));
